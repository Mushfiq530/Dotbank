<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown when a withdrawal/transfer/payment exceeds the available balance. */
class InsufficientFundsException extends AppException
{
}
