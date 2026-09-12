<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use App\Exceptions\NotFoundException;

final class SupportTicket
{
    public static function create(string $ticketId, string $userId, string $subject): void
    {
        $stmt = Database::getConnection()->prepare(
            'INSERT INTO support_ticket (ticket_id, user_id, subject, status)
             VALUES (?, ?, ?, \'OPEN\')'
        );
        $stmt->execute([$ticketId, $userId, $subject]);
    }

    public static function findById(string $ticketId): ?array
    {
        $stmt = Database::getConnection()->prepare('SELECT * FROM support_ticket WHERE ticket_id = ?');
        $stmt->execute([$ticketId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function requireById(string $ticketId): array
    {
        $ticket = self::findById($ticketId);
        if (!$ticket) {
            throw new NotFoundException('Ticket not found.');
        }
        return $ticket;
    }

    /** Tickets belonging to one user, most recently updated first. */
    public static function listForUser(string $userId): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM support_ticket WHERE user_id = ? ORDER BY updated_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    /**
     * All tickets, for the officer/admin queue. Any officer or admin can see
     * and respond to any ticket — tickets aren't assigned to a specific
     * officer, matching how account/loan/deposit requests already work in
     * this project (whoever acts first handles it).
     */
    public static function listAll(?string $status = null): array
    {
        $conn = Database::getConnection();

        if ($status !== null) {
            $stmt = $conn->prepare(
                'SELECT t.*, u.name AS user_name FROM support_ticket t
                 JOIN user u ON u.user_id = t.user_id
                 WHERE t.status = ?
                 ORDER BY t.updated_at DESC'
            );
            $stmt->execute([$status]);
        } else {
            $stmt = $conn->query(
                'SELECT t.*, u.name AS user_name FROM support_ticket t
                 JOIN user u ON u.user_id = t.user_id
                 ORDER BY t.updated_at DESC'
            );
        }

        return $stmt->fetchAll();
    }

    public static function updateStatus(string $ticketId, string $status): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE support_ticket SET status = ? WHERE ticket_id = ?'
        );
        $stmt->execute([$status, $ticketId]);
    }

    /** Bumps updated_at so the ticket resurfaces at the top of either queue. */
    public static function touch(string $ticketId): void
    {
        $stmt = Database::getConnection()->prepare(
            'UPDATE support_ticket SET updated_at = NOW() WHERE ticket_id = ?'
        );
        $stmt->execute([$ticketId]);
    }
}
