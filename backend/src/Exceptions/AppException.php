<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

/**
 * Base class for all expected/handled application errors.
 * Catch this (or a subclass) at the boundary layer to show
 * a friendly message instead of leaking internals to the user.
 */
class AppException extends Exception
{
}
