<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown when a lookup (by id, account no, etc.) finds nothing. */
class NotFoundException extends AppException
{
}
