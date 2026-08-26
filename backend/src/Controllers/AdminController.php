<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Models\Officer;

final class AdminController
{
    /**
     * Returns every officer for the admin's "manage officers" list.
     * Never includes the password hash, only what the UI needs.
     *
     * @return array<int, array{officer_id: string, name: string, email: string, mobile: string}>
     */
    public static function getAllOfficers(): array
    {
        $stmt = Database::getConnection()->query(
            'SELECT officer_id, name, email, mobile FROM officer ORDER BY name'
        );

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Creates a new officer with a random temporary password (see
     * Officer::create) and returns it once so the admin can hand it off.
     *
     * @return array{temporaryPassword: string}
     */
    public static function createOfficer(
        string $officerId,
        string $fullName,
        string $email,
        string $phone
    ): array {
        $result = Officer::create($officerId, $fullName, $email, $phone);

        return ['temporaryPassword' => $result['temporaryPassword']];
    }

    /**
     * Removes an officer account. Past officer_log rows are left in place
     * as a historical audit trail rather than deleted along with them.
     */
    public static function removeOfficer(string $officerId): void
    {
        $stmt = Database::getConnection()->prepare('DELETE FROM officer WHERE officer_id = ?');
        $stmt->execute([$officerId]);
    }

    /**
     * Permanently removes a user and everything tied to them: every
     * transaction/bill-payment/loan-request/money-transfer/large-transaction-request
     * against each of their accounts, the accounts themselves, their
     * account requests, notifications, and finally the user row. Wrapped
     * in one transaction so a failure partway through can't leave
     * orphaned rows or a half-deleted user behind.
     *
     * money_transfer and large_transaction_request rows are deleted here
     * because both carry a FOREIGN KEY on account_no — added in
     * 18_money_transfer.sql and present since the original schema for
     * large_transaction_request respectively — so leaving them in place
     * would make the DELETE FROM account below fail with a foreign key
     * constraint violation whenever the user being removed had ever sent
     * or received an internal transfer, or filed a large-transaction
     * request.
     */
    public static function removeUser(string $userId): void
    {
        Database::transaction(function ($conn) use ($userId) {
            $stmt = $conn->prepare('SELECT account_no FROM account WHERE user_id = ?');
            $stmt->execute([$userId]);
            $accountNumbers = $stmt->fetchAll(\PDO::FETCH_COLUMN);

            foreach ($accountNumbers as $accountNo) {
                foreach (['transaction', 'bill_payment', 'loan_request'] as $table) {
                    $del = $conn->prepare("DELETE FROM {$table} WHERE account_no = ?");
                    $del->execute([$accountNo]);
                }

                $del = $conn->prepare(
                    'DELETE FROM money_transfer WHERE from_account_no = ? OR to_account_no = ?'
                );
                $del->execute([$accountNo, $accountNo]);

                $del = $conn->prepare('DELETE FROM large_transaction_request WHERE account_no = ?');
                $del->execute([$accountNo]);
            }

            $conn->prepare('DELETE FROM account WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM account_request WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM notification WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM user_log WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM login_attempt WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM officer_alert WHERE user_id = ?')->execute([$userId]);
            $conn->prepare('DELETE FROM user WHERE user_id = ?')->execute([$userId]);
        });
    }
}