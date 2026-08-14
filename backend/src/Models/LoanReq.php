<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

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

    public static function approve(string $loanId, string $officerId): void
    {
        Database::transaction(function ($conn) use ($loanId, $officerId) {
            $stmt = $conn->prepare(
                'SELECT * FROM loan_request WHERE loan_id = ? FOR UPDATE'
            );
            $stmt->execute([$loanId]);
            $loan = $stmt->fetch();

            if (!$loan) {
                throw new NotFoundException('Loan not found');
            }

            if ($loan['status'] !== 'PENDING') {
                throw new ValidationException('Loan has already been reviewed.');
            }

            $account = Account::findByAccountNo($loan['account_no']);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->deposit((float) $loan['amount']);

            $update = $conn->prepare(
                "UPDATE loan_request SET status = 'APPROVED', reviewed_by = ? WHERE loan_id = ?"
            );
            $update->execute([$officerId, $loanId]);
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
     * Pays back an APPROVED loan in one shot: withdraws the full loan amount
     * from the account it was disbursed to and marks the loan REPAID.
     * Ownership is checked (the account must belong to $userId) so a user
     * can't repay someone else's loan by guessing a loan ID. Withdrawal,
     * the transaction record, and the status flip all happen in one DB
     * transaction so a failure partway through can't leave the loan marked
     * repaid without the money actually moving (or vice versa).
     */
    public static function repay(string $loanId, string $userId): void
    {
        Database::transaction(function ($conn) use ($loanId, $userId) {
            $stmt = $conn->prepare('SELECT * FROM loan_request WHERE loan_id = ? FOR UPDATE');
            $stmt->execute([$loanId]);
            $loan = $stmt->fetch();

            if (!$loan) {
                throw new NotFoundException('Loan not found');
            }

            if ($loan['status'] !== 'APPROVED') {
                throw new ValidationException('Only approved loans can be repaid.');
            }

            $account = Account::findByAccountNo($loan['account_no']);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            if ($account->userId !== $userId) {
                throw new ValidationException('This loan does not belong to you.');
            }

            // Account::withdraw() already checks status = ACTIVE and
            // sufficient balance atomically at the DB level.
            $account->withdraw((float) $loan['amount']);

            Transaction::create($loan['account_no'], 'LOAN_REPAYMENT', (float) $loan['amount']);

            $update = $conn->prepare("UPDATE loan_request SET status = 'REPAID' WHERE loan_id = ?");
            $update->execute([$loanId]);
        });
    }
}
