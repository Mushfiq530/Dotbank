<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

final class MoneyTransfer
{
    /**
     * Delegates to sp_transfer_internal(), which performs the debit,
     * credit, money_transfer record, and transaction record all inside
     * the database in one call. Database::transaction() still wraps this
     * so the row locks taken by the procedure's FOR UPDATE selects are
     * released correctly on commit/rollback.
     */
    public static function transfer(
        string $transferId,
        string $fromAccount,
        string $toAccount,
        float $amount
    ): void {
        Database::transaction(function (PDO $conn) use ($transferId, $fromAccount, $toAccount, $amount) {
            $call = $conn->prepare('CALL sp_transfer_internal(?, ?, ?, ?, @status, @tx_id)');
            $call->execute([$transferId, $fromAccount, $toAccount, $amount]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

            switch ($status) {
                case 'OK':
                    return;
                case 'SAME_ACCOUNT':
                    throw new ValidationException('Cannot transfer to the same account.');
                case 'INVALID_AMOUNT':
                    throw new ValidationException('Invalid amount');
                case 'NOT_FOUND':
                    throw new NotFoundException('Account not found');
                case 'SENDER_FROZEN':
                case 'RECEIVER_FROZEN':
                    throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
                case 'INSUFFICIENT':
                    throw new InsufficientFundsException('Insufficient balance');
                default:
                    throw new \RuntimeException("Unexpected status from sp_transfer_internal: {$status}");
            }
        });
    }
}