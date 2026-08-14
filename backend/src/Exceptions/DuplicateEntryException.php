<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown when a record with the same unique key already exists. */
class DuplicateEntryException extends AppException
{
}
