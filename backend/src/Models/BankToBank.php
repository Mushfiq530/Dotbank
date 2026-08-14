<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;

final class BankToBank
{
    /**
     * The original code withdrew from the source account in the
     * controller, then called this method to record the transfer as a
     * separate step. If the insert here failed, the money was already
     * gone with no record of where it went. The withdrawal now happens
     * inside this method's own transaction so it either fully succeeds
     * or fully rolls back together.
     */
    public static function transfer(
        string $transferId,
        string $fromAccount,
        string $receiverBank,
        string $receiverAccount,
        float $amount
    ): void {
        Database::transaction(function ($conn) use ($transferId, $fromAccount, $receiverBank, $receiverAccount, $amount) {
            $account = Account::findByAccountNo($fromAccount);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->withdraw($amount);

            $stmt = $conn->prepare(
                'INSERT INTO bank_to_bank (transfer_id, receiver_bank, receiver_account)
                 VALUES (?, ?, ?)'
            );
            $stmt->execute([$transferId, $receiverBank, $receiverAccount]);

            Transaction::create($fromAccount, 'TRANSFER', $amount);
        });
    }
}
