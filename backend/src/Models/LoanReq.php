<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

final class LoanReq
{
    public static function create(string $loanId, string $accountNo, float $amount): void
    {
        if ($amount <= 0) {
            throw new ValidationException('Loan amount must be greater than zero.');
        }

        $stmt = Database::getConnection()->prepare(
            "INSERT INTO loan_request (loan_id, account_no, amount, status)
             VALUES (?, ?, ?, 'PENDING')"
        );
        $stmt->execute([$loanId, $accountNo, $amount]);
    }

    /**
     * Delegates to sp_approve_loan(), which locks the loan row, credits
     * the account, and flips the loan to APPROVED inside one procedure
     * call instead of PHP orchestrating the SELECT ... FOR UPDATE,
     * Account::deposit(), and UPDATE separately.
     */
    public static function approve(string $loanId, string $officerId): void
    {
        Database::transaction(function (PDO $conn) use ($loanId, $officerId) {
            $call = $conn->prepare('CALL sp_approve_loan(?, ?, @status)');
            $call->execute([$loanId, $officerId]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

            switch ($status) {
                case 'OK':
                    return;
                case 'NOT_FOUND':
                    throw new NotFoundException('Loan not found');
                case 'ALREADY_REVIEWED':
                    throw new ValidationException('Loan has already been reviewed.');
                case 'ACCOUNT_NOT_FOUND':
                    throw new NotFoundException('Account not found');
                case 'FROZEN':
                    throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
                default:
                    throw new \RuntimeException("Unexpected status from sp_approve_loan: {$status}");
            }
        });
    }

    public static function deny(string $loanId, string $officerId): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE loan_request SET status = 'DENIED', reviewed_by = ? WHERE loan_id = ?"
        );
        $stmt->execute([$officerId, $loanId]);
    }

    /**
     * All loan requests belonging to accounts owned by this user, newest first.
     * Used by the user's "My Loans" list so they can see status and repay
     * anything that's APPROVED.
     */
    public static function findAllForUser(string $userId): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT lr.* FROM loan_request lr
             JOIN account a ON a.account_no = lr.account_no
             WHERE a.user_id = ?
             ORDER BY lr.created_at DESC'
        );
        $stmt->execute([$userId]);

        return $stmt->fetchAll();
    }

    /**
     * Delegates to sp_repay_loan(), which locks the loan row, verifies
     * ownership, withdraws the amount, records the transaction, and
     * marks the loan REPAID inside one procedure call.
     */
    public static function repay(string $loanId, string $userId): void
    {
        Database::transaction(function (PDO $conn) use ($loanId, $userId) {
            $call = $conn->prepare('CALL sp_repay_loan(?, ?, @status)');
            $call->execute([$loanId, $userId]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

            switch ($status) {
                case 'OK':
                    return;
                case 'NOT_FOUND':
                    throw new NotFoundException('Loan not found');
                case 'NOT_APPROVED':
                    throw new ValidationException('Only approved loans can be repaid.');
                case 'ACCOUNT_NOT_FOUND':
                    throw new NotFoundException('Account not found');
                case 'NOT_OWNER':
                    throw new ValidationException('This loan does not belong to you.');
                case 'FROZEN':
                    throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
                case 'INSUFFICIENT':
                    throw new InsufficientFundsException('Insufficient balance');
                default:
                    throw new \RuntimeException("Unexpected status from sp_repay_loan: {$status}");
            }
        });
    }
}