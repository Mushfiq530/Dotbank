<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown when a deposit/withdrawal is attempted on a BLOCKED (frozen) account. */
class AccountFrozenException extends AppException
{
}