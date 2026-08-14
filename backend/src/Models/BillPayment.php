<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;

final class BillPayment
{
    /**
     * Withdrawal, the bill_payment record, and the transaction record
     * now happen inside one DB transaction. Previously the withdrawal
     * could succeed while the payment record failed to insert, silently
     * losing the customer's money with no paper trail.
     */
    public static function pay(
        string $paymentId,
        string $accountNo,
        string $billType,
        float $amount
    ): void {
        Database::transaction(function ($conn) use ($paymentId, $accountNo, $billType, $amount) {
            $account = Account::findByAccountNo($accountNo);

            if (!$account) {
                throw new NotFoundException('Account not found');
            }

            $account->withdraw($amount);

            $stmt = $conn->prepare(
                'INSERT INTO bill_payment (payment_id, account_no, bill_type, amount, payment_time)
                 VALUES (?, ?, ?, ?, NOW())'
            );
            $stmt->execute([$paymentId, $accountNo, $billType, $amount]);

            Transaction::create($accountNo, 'BILL_PAYMENT', $amount);
        });
    }
}
