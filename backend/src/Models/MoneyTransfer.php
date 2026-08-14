<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;

final class MoneyTransfer
{
    /**
     * Debit, credit, and the transfer/transaction records now all happen
     * inside one DB transaction, so a failure partway through can't leave
     * money debited from the sender without ever reaching the receiver.
     */
    public static function transfer(
        string $transferId,
        string $fromAccount,
        string $toAccount,
        float $amount
    ): void {
        if ($fromAccount === $toAccount) {
            throw new ValidationException('Cannot transfer to the same account.');
        }

        Database::transaction(function ($conn) use ($transferId, $fromAccount, $toAccount, $amount) {
            $sender = Account::findByAccountNo($fromAccount);
            $receiver = Account::findByAccountNo($toAccount);

            if (!$sender || !$receiver) {
                throw new NotFoundException('Account not found');
            }

            $sender->withdraw($amount);
            $receiver->deposit($amount);

            $stmt = $conn->prepare(
                'INSERT INTO money_transfer (transfer_id, from_account_no, to_account_no, amount, transfer_time)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $stmt->execute([$transferId, $fromAccount, $toAccount, $amount]);

            Transaction::create($fromAccount, 'TRANSFER', $amount);
        });
    }
}
