<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;

final class BankToMobile
{
    public static function transfer(
        string $transferId,
        string $fromAccount,
        string $mobileNumber,
        string $provider,
        float $amount
    ): void {
        Database::transaction(function ($conn) use ($transferId, $fromAccount, $mobileNumber, $provider, $amount) {
            $account = Account::findByAccountNo($fromAccount);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->withdraw($amount);

            $stmt = $conn->prepare(
                'INSERT INTO bank_to_mobile (transfer_id, mobile_number, provider)
                 VALUES (?, ?, ?)'
            );
            $stmt->execute([$transferId, $mobileNumber, $provider]);

            Transaction::create($fromAccount, 'TRANSFER', $amount);
        });
    }
}
