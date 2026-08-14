<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\AuthenticationException;
use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\Officer;
use App\Models\User;
use App\Services\OtpService;
use App\Support\Validator;

final class PasswordResetController
{
    public static function sendUserOtp(string $userId): void
    {
        $user = User::findById($userId);

        if (!$user) {
            throw new NotFoundException('User not found');
        }

        OtpService::createOtp('USER', $userId, $user->mobile);
    }

    public static function sendOfficerOtp(string $officerId): void
    {
        $officer = Officer::findById($officerId);

        if (!$officer) {
            throw new NotFoundException('Officer not found');
        }

        OtpService::createOtp('OFFICER', $officerId, $officer->mobile);
    }

    public static function resetUserPassword(
        string $userId,
        string $otp,
        string $newPassword,
        string $confirmPassword
    ): void {
        Validator::matches($newPassword, $confirmPassword, 'Passwords do not match');
        Validator::passwordStrength($newPassword);

        if (!OtpService::consumeOtp('USER', $userId, $otp)) {
            throw new AuthenticationException('Invalid or expired OTP');
        }

        $user = User::findById($userId);

        if (!$user) {
            throw new NotFoundException('User not found');
        }

        $user->resetPassword($newPassword);
    }

    public static function resetOfficerPassword(
        string $officerId,
        string $otp,
        string $newPassword,
        string $confirmPassword
    ): void {
        Validator::matches($newPassword, $confirmPassword, 'Passwords do not match');
        Validator::passwordStrength($newPassword);

        if (!OtpService::consumeOtp('OFFICER', $officerId, $otp)) {
            throw new AuthenticationException('Invalid or expired OTP');
        }

        $officer = Officer::findById($officerId);

        if (!$officer) {
            throw new NotFoundException('Officer not found');
        }

        $officer->resetPassword($newPassword);
    }
}
