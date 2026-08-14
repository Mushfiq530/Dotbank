<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\ValidationException;

final class Account
{
    public function __construct(
        public readonly string $accountNo,
        public readonly string $userId,
        public float $balance,
        public readonly string $accountType,
        public string $status,
        public ?string $handledBy
    ) {
    }

    public static function generateAccountNo(): string
    {
        return 'ACC' . date('YmdHis') . random_int(100, 999);
    }

    /**
     * @return self[] every account belonging to this user (a user can have more than one).
     */
    public static function findAllByUserId(string $userId): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM account WHERE user_id = ? ORDER BY account_no'
        );
        $stmt->execute([$userId]);

        return array_map(
            fn (array $row) => new self(
                $row['account_no'],
                $row['user_id'],
                (float) $row['balance'],
                $row['account_type'],
                $row['status'],
                $row['handled_by']
            ),
            $stmt->fetchAll()
        );
    }

    public static function findByAccountNo(string $accountNo): ?self
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM account WHERE account_no = ?'
        );
        $stmt->execute([$accountNo]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new self(
            $row['account_no'],
            $row['user_id'],
            (float) $row['balance'],
            $row['account_type'],
            $row['status'],
            $row['handled_by']
        );
    }

    public function deposit(float $amount): void
    {
        if ($amount <= 0) {
            throw new ValidationException('Invalid amount');
        }

        if ($this->status !== 'ACTIVE') {
            throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
        }

        $stmt = Database::getConnection()->prepare(
            'UPDATE account SET balance = balance + ? WHERE account_no = ?'
        );
        $stmt->execute([$amount, $this->accountNo]);

        $this->balance += $amount;
    }

    /**
     * Withdraws atomically at the database level: the balance check and
     * the decrement happen in a single conditional UPDATE, so two
     * concurrent withdrawals against the same account can't both pass a
     * stale in-PHP balance check and overdraw the account (a classic
     * check-then-act race condition).
     */
    public function withdraw(float $amount): void
    {
        if ($amount <= 0) {
            throw new ValidationException('Invalid amount');
        }

        // The status check lives in the same conditional UPDATE as the balance
        // check (not a separate "if frozen, throw" beforehand) so a freeze that
        // happens concurrently, between reading this object and writing the
        // debit, still can't slip a withdrawal through — same atomicity
        // reasoning as the balance guard below.
        $stmt = Database::getConnection()->prepare(
            "UPDATE account
             SET balance = balance - ?
             WHERE account_no = ? AND balance >= ? AND status = 'ACTIVE'"
        );
        $stmt->execute([$amount, $this->accountNo, $amount]);

        if ($stmt->rowCount() === 0) {
            $fresh = self::findByAccountNo($this->accountNo);

            if ($fresh && $fresh->status !== 'ACTIVE') {
                throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
            }

            // Otherwise: insufficient balance, or the account no longer exists.
            throw new InsufficientFundsException('Insufficient balance');
        }

        $this->balance -= $amount;
    }

    public function block(): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE account SET status = 'BLOCKED' WHERE account_no = ?"
        );
        $stmt->execute([$this->accountNo]);
        $this->status = 'BLOCKED';
    }

    public function activate(): void
    {
        $stmt = Database::getConnection()->prepare(
            "UPDATE account SET status = 'ACTIVE' WHERE account_no = ?"
        );
        $stmt->execute([$this->accountNo]);
        $this->status = 'ACTIVE';
    }
}