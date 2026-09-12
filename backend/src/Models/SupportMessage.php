<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;

final class SupportMessage
{
    public static function create(string $ticketId, string $senderType, string $senderId, string $body): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO support_message (ticket_id, sender_type, sender_id, body)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$ticketId, $senderType, $senderId, $body]);
    }

    /** Full thread for a ticket, oldest first (natural reading order). */
    public static function forTicket(string $ticketId): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM support_message WHERE ticket_id = ? ORDER BY created_at ASC, message_id ASC'
        );
        $stmt->execute([$ticketId]);
        return $stmt->fetchAll();
    }
}
