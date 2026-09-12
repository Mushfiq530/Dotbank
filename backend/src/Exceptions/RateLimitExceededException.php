<?php

declare(strict_types=1);

namespace App\Exceptions;

/** Thrown when a caller exceeds the allowed request rate for a given bucket. */
class RateLimitExceededException extends AppException
{
    public function __construct(string $message, public readonly int $retryAfterSeconds)
    {
        parent::__construct($message);
    }
}
