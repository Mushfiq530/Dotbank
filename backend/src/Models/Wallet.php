<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

final class Wallet
{
    public function __construct(
        public readonly string $walletId,
        public readonly string $userId,
        public float $balance,
        public string $status,
    ) {
    }

    public static function generateWalletId(): string
    {
        return 'WLT' . date('YmdHis') . random_int(100, 999);
    }

    public static function findByUserId(string $userId): ?self
    {
        $stmt = Database::getConnection()->prepare('SELECT * FROM wallet WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        return $row ? new self($row['wallet_id'], $row['user_id'], (float) $row['balance'], $row['status']) : null;
    }

    public static function findById(string $walletId): ?self
    {
        $stmt = Database::getConnection()->prepare('SELECT * FROM wallet WHERE wallet_id = ?');
        $stmt->execute([$walletId]);
        $row = $stmt->fetch();

        return $row ? new self($row['wallet_id'], $row['user_id'], (float) $row['balance'], $row['status']) : null;
    }

    /** Creates a wallet for a user who doesn't have one yet. Idempotent-ish:
     *  returns the existing wallet if one already exists rather than erroring,
     *  since "open my wallet" is a reasonable thing to click more than once. */
    public static function getOrCreateForUser(string $userId): self
    {
        $existing = self::findByUserId($userId);
        if ($existing) {
            return $existing;
        }

        $walletId = self::generateWalletId();
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO wallet (wallet_id, user_id, balance, status) VALUES (?, ?, 0.00, \'ACTIVE\')'
        );
        $stmt->execute([$walletId, $userId]);

        return new self($walletId, $userId, 0.00, 'ACTIVE');
    }

    public static function transactionsFor(string $walletId, int $limit = 50): array
    {
        $limit = max(1, min($limit, 200));
        $stmt = Database::getConnection()->prepare(
            "SELECT * FROM wallet_transaction WHERE wallet_id = ? ORDER BY created_at DESC LIMIT {$limit}"
        );
        $stmt->execute([$walletId]);

        return $stmt->fetchAll();
    }

    /** Delegates to sp_wallet_topup(): moves money from a real account into this wallet. */
    public static function topUp(string $accountNo, string $walletId, float $amount): void
    {
        Database::transaction(function (PDO $conn) use ($accountNo, $walletId, $amount) {
            $call = $conn->prepare('CALL sp_wallet_topup(?, ?, ?, @status, @txn_id)');
            $call->execute([$accountNo, $walletId, $amount]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];
            self::assertOk($status, 'sp_wallet_topup');
        });
    }

    /** Delegates to sp_wallet_withdraw(): moves money out of this wallet back into a real account. */
    public static function withdraw(string $walletId, string $accountNo, float $amount): void
    {
        Database::transaction(function (PDO $conn) use ($walletId, $accountNo, $amount) {
            $call = $conn->prepare('CALL sp_wallet_withdraw(?, ?, ?, @status, @txn_id)');
            $call->execute([$walletId, $accountNo, $amount]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];
            self::assertOk($status, 'sp_wallet_withdraw');
        });
    }

    /** Delegates to sp_wallet_transfer(): peer-to-peer, wallet to wallet. */
    public static function transfer(string $transferId, string $fromWalletId, string $toWalletId, float $amount): void
    {
        Database::transaction(function (PDO $conn) use ($transferId, $fromWalletId, $toWalletId, $amount) {
            $call = $conn->prepare('CALL sp_wallet_transfer(?, ?, ?, ?, @status, @txn_id)');
            $call->execute([$transferId, $fromWalletId, $toWalletId, $amount]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];
            self::assertOk($status, 'sp_wallet_transfer');
        });
    }

    private static function assertOk(string $status, string $procedureName): void
    {
        switch ($status) {
            case 'OK':
                return;
            case 'SAME_WALLET':
                throw new ValidationException('Cannot transfer to your own wallet.');
            case 'INVALID_AMOUNT':
                throw new ValidationException('Invalid amount.');
            case 'NOT_FOUND':
                throw new NotFoundException('Account or wallet not found.');
            case 'ACCOUNT_FROZEN':
                throw new AccountFrozenException('That account is frozen. Contact an officer to reactivate it.');
            case 'WALLET_BLOCKED':
            case 'SENDER_BLOCKED':
            case 'RECEIVER_BLOCKED':
                throw new AccountFrozenException('One of the wallets involved is blocked.');
            case 'INSUFFICIENT':
                throw new InsufficientFundsException('Insufficient balance.');
            default:
                throw new \RuntimeException("Unexpected status from {$procedureName}: {$status}");
        }
    }
}
