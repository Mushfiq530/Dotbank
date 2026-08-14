<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\Account;
use App\Models\BankToBank;
use App\Models\BankToMobile;
use App\Models\BillPayment;
use App\Models\LargeTransactionRequest;
use App\Models\MoneyTransfer;
use App\Models\Notification;
use App\Models\OfficerAlert;
use App\Models\Transaction;
use App\Models\UserLog;
use App\Support\Validator;

final class TransactionController
{
    // Any withdrawal / transfer / bill payment above this amount is held
    // for officer approval instead of completing immediately (item #5).
    private const LARGE_AMOUNT_THRESHOLD = 100_000.0;

    public static function deposit(string $accountNo, float $amount, string $userId): void
    {
        Validator::positiveAmount($amount);

        Database::transaction(function () use ($accountNo, $amount) {
            $account = Account::findByAccountNo($accountNo);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->deposit($amount);
            Transaction::create($accountNo, 'DEPOSIT', $amount);
        });

        self::logSafely($userId, $accountNo, $userId, "Deposited {$amount}");
        self::notifySafely($userId, "A deposit of {$amount} to account {$accountNo} was completed.");
    }

    public static function withdraw(string $accountNo, float $amount, string $userId): void
    {
        Validator::positiveAmount($amount);

        Database::transaction(function () use ($accountNo, $amount) {
            $account = Account::findByAccountNo($accountNo);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->withdraw($amount);
            Transaction::create($accountNo, 'WITHDRAW', $amount);
        });

        self::logSafely($userId, $accountNo, $userId, "Withdrawn {$amount}");
        self::notifySafely($userId, "A withdrawal of {$amount} from account {$accountNo} was completed.");
    }

    /**
     * Returns a message describing what happened — either "completed" or
     * "submitted for officer approval" — so the caller can show the right
     * thing without needing to know about the threshold itself.
     */
    public static function payBill(
        string $paymentId,
        string $accountNo,
        string $billType,
        float $amount,
        string $userId
    ): string {
        Validator::positiveAmount($amount);
        Validator::requireNonEmpty($billType, 'Bill type');

        if (self::requiresOfficerApproval($amount)) {
            self::holdForApproval('BILL_PAYMENT', $userId, $accountNo, $amount, [
                'billType' => $billType,
            ]);

            return "This bill payment is over 1,00,000 and needs officer approval. You'll be notified once it's reviewed.";
        }

        BillPayment::pay($paymentId, $accountNo, $billType, $amount);

        self::logSafely($userId, $accountNo, $userId, "Paid bill: {$billType}");
        self::notifySafely($userId, "Your {$billType} bill payment of {$amount} was completed.");

        return 'Bill paid.';
    }

    public static function transferInternal(
        string $transferId,
        string $fromAccount,
        string $toAccount,
        float $amount,
        string $userId
    ): void {
        Validator::positiveAmount($amount);

        MoneyTransfer::transfer($transferId, $fromAccount, $toAccount, $amount);

        self::logSafely($userId, $fromAccount, $userId, "Transferred {$amount}");
        self::notifySafely($userId, "A transfer of {$amount} from {$fromAccount} to {$toAccount} was completed.");
    }

    public static function transferBank(
        string $transferId,
        string $fromAccount,
        string $receiverBank,
        string $receiverAccount,
        float $amount,
        string $userId
    ): string {
        Validator::positiveAmount($amount);

        if (self::requiresOfficerApproval($amount)) {
            self::holdForApproval('BANK_TRANSFER', $userId, $fromAccount, $amount, [
                'receiverBank' => $receiverBank,
                'receiverAccount' => $receiverAccount,
            ]);

            return "This withdrawal is over 1,00,000 and needs officer approval. You'll be notified once it's reviewed.";
        }

        // BankToBank::transfer performs the withdrawal itself, atomically
        // with its own record (see model for why).
        BankToBank::transfer($transferId, $fromAccount, $receiverBank, $receiverAccount, $amount);

        self::logSafely($userId, $fromAccount, $userId, "Bank transfer {$amount}");
        self::notifySafely($userId, "A bank transfer of {$amount} to {$receiverAccount} was completed.");

        return 'Withdrawal completed.';
    }

    public static function transferMobile(
        string $transferId,
        string $fromAccount,
        string $mobileNumber,
        string $provider,
        float $amount,
        string $userId
    ): string {
        Validator::positiveAmount($amount);
        Validator::mobile($mobileNumber);

        if (self::requiresOfficerApproval($amount)) {
            self::holdForApproval('MOBILE_TRANSFER', $userId, $fromAccount, $amount, [
                'mobile' => $mobileNumber,
                'provider' => $provider,
            ]);

            return "This withdrawal is over 1,00,000 and needs officer approval. You'll be notified once it's reviewed.";
        }

        BankToMobile::transfer($transferId, $fromAccount, $mobileNumber, $provider, $amount);

        self::logSafely($userId, $fromAccount, $userId, "Mobile transfer {$amount}");
        self::notifySafely($userId, "A mobile transfer of {$amount} to {$mobileNumber} was completed.");

        return 'Withdrawal completed.';
    }

    public static function getPendingTransactions(): array
    {
        return Transaction::getPendingTransactions();
    }

    public static function approveTransaction(int $transactionId, string $officerId): void
    {
        Transaction::approve($transactionId, $officerId);
    }

    public static function denyTransaction(int $transactionId, string $officerId): void
    {
        Transaction::deny($transactionId, $officerId);
    }

    // ---------- large transaction hold / approval (item #5) ----------

    public static function getPendingLargeTransactions(): array
    {
        return LargeTransactionRequest::getPending();
    }

    /**
     * Actually performs the withdrawal/transfer/bill payment that was held
     * for review. Nothing was debited when the request was created — this
     * is the first point the money moves.
     */
    public static function approveLargeTransaction(int $id, string $officerId): void
    {
        Database::transaction(function () use ($id, $officerId) {
            $request = LargeTransactionRequest::findByIdForUpdate($id);

            if (!$request) {
                throw new NotFoundException('Request not found');
            }

            if ($request['status'] !== 'PENDING') {
                throw new ValidationException('This request has already been reviewed.');
            }

            $payload = $request['payload'];
            $amount = (float) $request['amount'];
            $accountNo = $request['account_no'];
            $userId = $request['user_id'];
            $refId = 'REF-' . bin2hex(random_bytes(5));

            switch ($request['request_type']) {
                case 'BANK_TRANSFER':
                    BankToBank::transfer(
                        $refId,
                        $accountNo,
                        $payload['receiverBank'] ?? 'Dot Bank',
                        $payload['receiverAccount'] ?? '',
                        $amount
                    );
                    break;
                case 'MOBILE_TRANSFER':
                    BankToMobile::transfer(
                        $refId,
                        $accountNo,
                        $payload['mobile'] ?? '',
                        $payload['provider'] ?? 'bKash',
                        $amount
                    );
                    break;
                case 'BILL_PAYMENT':
                    BillPayment::pay($refId, $accountNo, $payload['billType'] ?? '', $amount);
                    break;
                default:
                    throw new ValidationException('Unknown request type.');
            }

            LargeTransactionRequest::markReviewed($id, 'APPROVED', $officerId);

            self::logSafely($userId, $accountNo, $officerId, "Approved large transaction #{$id} ({$amount})");
            self::notifySafely($userId, "Your request to move {$amount} from account {$accountNo} was approved and completed.");
        });
    }

    public static function denyLargeTransaction(int $id, string $officerId): void
    {
        $request = LargeTransactionRequest::findById($id);

        if (!$request) {
            throw new NotFoundException('Request not found');
        }

        if ($request['status'] !== 'PENDING') {
            throw new ValidationException('This request has already been reviewed.');
        }

        LargeTransactionRequest::markReviewed($id, 'DENIED', $officerId);

        self::logSafely($request['user_id'], $request['account_no'], $officerId, "Denied large transaction #{$id} ({$request['amount']})");
        self::notifySafely(
            $request['user_id'],
            "Your request to move {$request['amount']} from account {$request['account_no']} was denied by an officer. No money was deducted."
        );
    }

    private static function requiresOfficerApproval(float $amount): bool
    {
        return $amount > self::LARGE_AMOUNT_THRESHOLD;
    }

    /**
     * Records the hold request. Verifies the account exists, isn't frozen,
     * and has enough balance up front (so users aren't left waiting on a
     * request that could never succeed) — but does NOT touch the balance.
     * The balance is re-checked atomically again when an officer approves,
     * since it can change while the request is pending.
     */
    private static function holdForApproval(
        string $type,
        string $userId,
        string $accountNo,
        float $amount,
        array $payload
    ): void {
        $account = Account::findByAccountNo($accountNo);

        if (!$account) {
            throw new NotFoundException('Account not found');
        }

        if ($account->status !== 'ACTIVE') {
            throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
        }

        if ($account->balance < $amount) {
            throw new InsufficientFundsException('Insufficient balance');
        }

        LargeTransactionRequest::create($type, $userId, $accountNo, $amount, $payload);

        self::notifySafely(
            $userId,
            "Your request to move {$amount} from account {$accountNo} needs officer approval (amounts over 1,00,000 require review)."
        );

        try {
            OfficerAlert::create($userId, $accountNo, "Large transaction of {$amount} on account {$accountNo} needs approval.");
        } catch (\Throwable $e) {
            error_log('OfficerAlert::create failed: ' . $e->getMessage());
        }
    }

    /**
     * Audit logging is important but is not the reason the customer's
     * money moved. If writing the log entry fails, we record the error
     * server-side rather than throwing — a broken audit log must never
     * make an already-committed deposit/withdrawal/transfer look like it
     * failed to the caller.
     */
    private static function logSafely(string $userId, ?string $accountNo, string $actorId, string $action): void
    {
        try {
            UserLog::log($userId, $accountNo, 'USER', $actorId, $action);
        } catch (\Throwable $e) {
            error_log('UserLog::log failed: ' . $e->getMessage());
        }
    }

    /**
     * Same reasoning as logSafely: a failed notification insert must never
     * make an already-completed transaction look like it failed.
     */
    private static function notifySafely(string $userId, string $message): void
    {
        try {
            Notification::create($userId, $message);
        } catch (\Throwable $e) {
            error_log('Notification::create failed: ' . $e->getMessage());
        }
    }
}