<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Exceptions\NotFoundException;
use App\Exceptions\ValidationException;
use App\Models\Notification;
use App\Models\SupportMessage;
use App\Models\SupportTicket;

final class SupportController
{
    public static function createTicket(string $ticketId, string $userId, string $subject, string $body): void
    {
        $subject = trim($subject);
        $body = trim($body);

        if ($subject === '' || $body === '') {
            throw new ValidationException('Subject and message are required.');
        }

        SupportTicket::create($ticketId, $userId, $subject);
        SupportMessage::create($ticketId, 'USER', $userId, $body);
    }

    /**
     * A user or an officer/admin adding a message to an existing thread.
     * $senderType/$senderId identify who's replying; officer/admin replies
     * flip the ticket to ANSWERED, a user reply on an answered ticket
     * reopens it to OPEN so it resurfaces in the officer queue.
     */
    public static function reply(string $ticketId, string $senderType, string $senderId, string $body): void
    {
        $ticket = SupportTicket::requireById($ticketId);

        if ($ticket['status'] === 'CLOSED') {
            throw new ValidationException('This ticket is closed. Please open a new one.');
        }

        $body = trim($body);
        if ($body === '') {
            throw new ValidationException('Message cannot be empty.');
        }

        SupportMessage::create($ticketId, $senderType, $senderId, $body);

        if ($senderType === 'USER') {
            SupportTicket::updateStatus($ticketId, 'OPEN');
        } else {
            SupportTicket::updateStatus($ticketId, 'ANSWERED');
            Notification::create($ticket['user_id'], "An officer replied to your support ticket: \"{$ticket['subject']}\"");
        }

        SupportTicket::touch($ticketId);
    }

    public static function close(string $ticketId): void
    {
        SupportTicket::requireById($ticketId);
        SupportTicket::updateStatus($ticketId, 'CLOSED');
    }

    public static function getThread(string $ticketId): array
    {
        $ticket = SupportTicket::requireById($ticketId);
        return [
            'ticket' => $ticket,
            'messages' => SupportMessage::forTicket($ticketId),
        ];
    }
}
