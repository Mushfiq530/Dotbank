<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
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

    /**
     * Delegates to sp_deposit() in the database. The procedure returns a
     * status code via an OUT parameter (rather than a SQL error) so this
     * method can throw the exact same exception types the old inline-SQL
     * version did — callers elsewhere in the codebase don't need to change.
     */
    public function deposit(float $amount): void
    {
        $status = self::callBalanceProcedure('sp_deposit', $this->accountNo, $amount);

        switch ($status) {
            case 'OK':
                $this->balance += $amount;
                return;
            case 'INVALID_AMOUNT':
                throw new ValidationException('Invalid amount');
            case 'FROZEN':
                throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
            case 'NOT_FOUND':
                throw new NotFoundException('Account not found');
            default:
                throw new \RuntimeException("Unexpected status from sp_deposit: {$status}");
        }
    }

    /**
     * Delegates to sp_withdraw() in the database. Same atomicity guarantee
     * as before — the balance/status check and the debit happen in one
     * conditional UPDATE inside the procedure — just executed in MySQL
     * instead of PHP.
     */
    public function withdraw(float $amount): void
    {
        $status = self::callBalanceProcedure('sp_withdraw', $this->accountNo, $amount);

        switch ($status) {
            case 'OK':
                $this->balance -= $amount;
                return;
            case 'INVALID_AMOUNT':
                throw new ValidationException('Invalid amount');
            case 'FROZEN':
                throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
            case 'INSUFFICIENT':
                throw new InsufficientFundsException('Insufficient balance');
            case 'NOT_FOUND':
                throw new NotFoundException('Account not found');
            default:
                throw new \RuntimeException("Unexpected status from sp_withdraw: {$status}");
        }
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

    /**
     * Calls a stored procedure of the shape
     * (IN account_no, IN amount, OUT status) and returns the status.
     * MySQL OUT params via PDO are read back through a user session
     * variable (@status) rather than PDO::PARAM_INPUT_OUTPUT, since that
     * binding mode is unreliable with PDO::ATTR_EMULATE_PREPARES = false
     * (which this project's Database.php sets).
     */
    private static function callBalanceProcedure(string $procedure, string $accountNo, float $amount): string
    {
        $conn = Database::getConnection();

        $call = $conn->prepare("CALL {$procedure}(?, ?, @status)");
        $call->execute([$accountNo, $amount]);
        $call->closeCursor();

        $result = $conn->query('SELECT @status AS status')->fetch();

        return (string) $result['status'];
    }
}