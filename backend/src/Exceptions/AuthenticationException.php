<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown for bad credentials, locked accounts, expired OTPs, etc. */
class AuthenticationException extends AppException
{
}
