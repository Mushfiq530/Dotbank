<?php

declare(strict_types=1);

namespace App\Services;

/**
 * A small rule-based guide bot: no external API, no LLM call, no API key
 * to manage. Each FAQ entry has a set of trigger keywords; an incoming
 * question is scored against every entry by counting keyword overlap,
 * and the highest-scoring entry above a minimum threshold is returned.
 *
 * This is intentionally simple rather than "smart" — it's meant to answer
 * the handful of questions that actually recur (how do I open an account,
 * why is my account frozen, etc.), not to have an open-ended conversation.
 * Anything it can't confidently match falls through to a message pointing
 * the user at Support instead of guessing.
 */
final class AssistantService
{
    private const MIN_SCORE = 1;

    /**
     * @return array<int, array{keywords: string[], answer: string}>
     */
    private static function knowledgeBase(): array
    {
        return [
            [
                'keywords' => ['open', 'create', 'new', 'account', 'register', 'signup', 'sign'],
                'answer' => "To open an account: register from the landing page, log in, then go to Open Account and submit a request. An officer or admin needs to approve it before it's active — you'll see it appear on your Dashboard once approved.",
            ],
            [
                'keywords' => ['frozen', 'freeze', 'locked', 'blocked', 'lockout', 'suspended'],
                'answer' => "Accounts get frozen automatically after several failed login attempts, as a security measure. If this happened to you, contact an officer to review and unfreeze it — you can also open a Support ticket and we'll take a look.",
            ],
            [
                'keywords' => ['password', 'forgot', 'reset', 'change'],
                'answer' => "You can reset your password from the login screen using the 'Forgot password' option, which sends a one-time code to verify it's you. If you're already logged in, you can change it from your Profile page instead.",
            ],
            [
                'keywords' => ['withdraw', 'withdrawal', 'cash', 'money', 'out'],
                'answer' => "Go to Withdraw, enter the amount, and confirm — it's processed instantly against your account balance. There's no approval queue for withdrawals, so you'll see the result right away.",
            ],
            [
                'keywords' => ['deposit', 'depositing'],
                'answer' => "Deposits are handled at the counter: an officer records your walk-in cash deposit, and a second officer or admin matches it to your account and approves it. Once approved, the balance updates and you'll get a notification.",
            ],
            [
                'keywords' => ['bill', 'pay', 'payment', 'biller'],
                'answer' => "Go to Pay Bill, choose the biller type, and enter the amount. It's deducted from your account balance immediately, same as a withdrawal.",
            ],
            [
                'keywords' => ['loan', 'borrow', 'lending'],
                'answer' => "Go to Loan Request, enter the amount you need, and submit it. An officer or admin will review and approve or deny the request — you'll get a notification either way.",
            ],
            [
                'keywords' => ['transfer', 'send', 'mobile', 'bkash', 'bank-to-bank'],
                'answer' => "You can transfer money either bank-to-bank (to another DotBank account number) or bank-to-mobile, from your Dashboard. Both are processed immediately.",
            ],
            [
                'keywords' => ['2fa', 'two-factor', 'two', 'factor', 'authenticator', 'security', 'otp'],
                'answer' => "You can turn on two-factor authentication from the Security page in your account menu — scan the QR code with an authenticator app like Google Authenticator, then confirm with the 6-digit code it shows you.",
            ],
            [
                'keywords' => ['statement', 'history', 'transactions', 'mini'],
                'answer' => "Your Mini Statement page shows a monthly breakdown of your real transaction history — deposits, withdrawals, bill payments, and transfers, grouped by month.",
            ],
            [
                'keywords' => ['officer', 'become', 'add'],
                'answer' => "Officer accounts aren't self-registered — an Admin creates them from the Add Officer page and shares a one-time temporary password with the new officer.",
            ],
            [
                'keywords' => ['human', 'support', 'help', 'agent', 'talk', 'contact', 'ticket'],
                'answer' => "If I couldn't answer your question, you can open a Support ticket and an officer will get back to you directly.",
            ],
            [
                'keywords' => ['large', 'limit', 'maximum', 'big'],
                'answer' => "Large transactions above a certain threshold are flagged for officer review before they go through, as an extra safeguard — you'll see it as pending until an officer approves it.",
            ],
        ];
    }

    public static function ask(string $question): array
    {
        $normalized = strtolower(trim($question));
        $words = preg_split('/[^a-z0-9]+/', $normalized, -1, PREG_SPLIT_NO_EMPTY);

        $bestScore = 0;
        $bestAnswer = null;

        foreach (self::knowledgeBase() as $entry) {
            $score = count(array_intersect($words, $entry['keywords']));
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestAnswer = $entry['answer'];
            }
        }

        if ($bestAnswer === null || $bestScore < self::MIN_SCORE) {
            return [
                'answer' => "I'm not sure about that one — try rephrasing, or open a Support ticket and an officer can help directly.",
                'matched' => false,
            ];
        }

        return ['answer' => $bestAnswer, 'matched' => true];
    }

    /** A handful of example prompts shown as quick-tap chips in the widget. */
    public static function suggestions(): array
    {
        return [
            'How do I open an account?',
            'Why is my account frozen?',
            'How do I set up two-factor authentication?',
            'How do deposit requests work?',
        ];
    }
}
