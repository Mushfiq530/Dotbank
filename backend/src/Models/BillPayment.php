<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\AccountFrozenException;
use App\Exceptions\InsufficientFundsException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use PDO;

final class BillPayment
{
    /**
     * Delegates to sp_pay_bill(), same pattern as BankToBank::transfer()
     * and BankToMobile::transfer().
     */
    public static function pay(
        string $paymentId,
        string $accountNo,
        string $billType,
        float $amount
    ): void {
        Database::transaction(function (PDO $conn) use ($paymentId, $accountNo, $billType, $amount) {
            $call = $conn->prepare('CALL sp_pay_bill(?, ?, ?, ?, @status, @tx_id)');
            $call->execute([$paymentId, $accountNo, $billType, $amount]);
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
                    throw new \RuntimeException("Unexpected status from sp_pay_bill: {$status}");
            }
        });
    }
}