<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

final class BankToBank
{
    /**
     * Delegates to sp_bank_transfer(), which debits the account and
     * inserts both the bank_to_bank record and the transaction record
     * inside a single stored procedure call — all-or-nothing, without
     * PHP needing to orchestrate the individual INSERT/UPDATE statements.
     */
    public static function transfer(
        string $transferId,
        string $fromAccount,
        string $receiverBank,
        string $receiverAccount,
        float $amount
    ): void {
        Database::transaction(function (PDO $conn) use ($transferId, $fromAccount, $receiverBank, $receiverAccount, $amount) {
            $call = $conn->prepare('CALL sp_bank_transfer(?, ?, ?, ?, ?, @status, @tx_id)');
            $call->execute([$transferId, $fromAccount, $receiverBank, $receiverAccount, $amount]);
            $call->closeCursor();

            $status = (string) $conn->query('SELECT @status AS status')->fetch()['status'];

            switch ($status) {
                case 'OK':
                    return;
                case 'INVALID_AMOUNT':
                    throw new ValidationException('Invalid amount');
                case 'NOT_FOUND':
                    throw new NotFoundException('Account not found');
                case 'FROZEN':
                    throw new AccountFrozenException('This account is frozen. Contact an officer to reactivate it.');
                case 'INSUFFICIENT':
                    throw new InsufficientFundsException('Insufficient balance');
                default:
                    throw new \RuntimeException("Unexpected status from sp_bank_transfer: {$status}");
            }
        });
    }
}