<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\Account;
use App\Models\Wallet;

final class WalletController
{
    public static function open(string $userId): Wallet
    {
        return Wallet::getOrCreateForUser($userId);
    }

    /**
     * A user can only top up their wallet from an account they actually own —
     * that check belongs here in PHP (where we know who's logged in), not in
     * the stored procedure, which has no concept of "the current user" and
     * just trusts whatever account/wallet IDs it's given.
     */
    public static function topUp(string $userId, string $walletId, string $accountNo, float $amount): void
    {
        self::assertOwnsWallet($userId, $walletId);
        self::assertOwnsAccount($userId, $accountNo);

        Wallet::topUp($accountNo, $walletId, $amount);
    }

    public static function withdraw(string $userId, string $walletId, string $accountNo, float $amount): void
    {
        self::assertOwnsWallet($userId, $walletId);
        self::assertOwnsAccount($userId, $accountNo);

        Wallet::withdraw($walletId, $accountNo, $amount);
    }

    /**
     * Transfers by the recipient's user ID (not a raw wallet ID) — nicer UX,
     * since a sender knows the other person's username, not their wallet's
     * internal ID.
     */
    public static function transferToUser(string $userId, string $recipientUserId, float $amount): void
    {
        $fromWallet = Wallet::findByUserId($userId);
        if (!$fromWallet) {
            throw new NotFoundException('You need to open a wallet first.');
        }

        $toWallet = Wallet::findByUserId($recipientUserId);
        if (!$toWallet) {
            throw new NotFoundException('That user does not have a wallet yet.');
        }

        $transferId = 'WTX' . date('YmdHis') . random_int(100, 999);
        Wallet::transfer($transferId, $fromWallet->walletId, $toWallet->walletId, $amount);
    }

    private static function assertOwnsWallet(string $userId, string $walletId): void
    {
        $wallet = Wallet::findById($walletId);
        if (!$wallet || $wallet->userId !== $userId) {
            throw new ValidationException('That is not your wallet.');
        }
    }

    private static function assertOwnsAccount(string $userId, string $accountNo): void
    {
        $account = Account::findByAccountNo($accountNo);
        if (!$account || $account->userId !== $userId) {
            throw new ValidationException('That is not your account.');
        }
    }
}
