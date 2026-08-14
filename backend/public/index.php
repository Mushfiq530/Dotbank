<?php

declare(strict_types=1);

require __DIR__ . '/autoload.php';

use App\Controllers\AdminController;
use App\Controllers\LoginController;
use App\Controllers\OfficerController;
use App\Controllers\TransactionController;
use App\Controllers\UserController;
use App\Config\Database;
use App\Exceptions\AppException;
use App\Support\SessionManager;
use App\Support\Validator;

// ---- tiny .env loader (Config\Env just reads getenv(), it doesn't parse the file) ----
$envPath = __DIR__ . '/../.env';
if (is_file($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
    }
}

// ---- CORS for the Vite dev server ----
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

SessionManager::start();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path) ?: '/';

$rawBody = file_get_contents('php://input');
$body = $rawBody ? (json_decode($rawBody, true) ?? []) : [];

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function genId(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(5));
}

function currentRole(): ?array
{
    if (isset($_SESSION['user_id'])) return ['role' => 'user', 'id' => $_SESSION['user_id']];
    if (isset($_SESSION['officer_id'])) return ['role' => 'officer', 'id' => $_SESSION['officer_id']];
    if (isset($_SESSION['admin_id'])) return ['role' => 'admin', 'id' => $_SESSION['admin_id']];
    return null;
}

// Turns a relative path stored in the DB (e.g. "profile_pictures/USR-1.jpg")
// into an absolute URL the frontend can drop straight into an <img src>,
// regardless of what host/port the backend is actually running on.
function profilePictureUrl(?string $relativePath): ?string
{
    if (!$relativePath) {
        return null;
    }
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    // Cache-bust with the file's own mtime so the URL only changes when the
    // picture is actually replaced, rather than on every single request.
    $absolutePath = __DIR__ . '/uploads/' . $relativePath;
    $version = is_file($absolutePath) ? filemtime($absolutePath) : time();
    return "{$scheme}://{$host}/uploads/{$relativePath}?v={$version}";
}

function requireRole(string $role): array
{
    $actor = currentRole();
    if (!$actor || $actor['role'] !== $role) {
        respond(['success' => false, 'message' => 'Not authorized'], 401);
    }
    return $actor;
}

try {
    switch (true) {

        // ---------- AUTH ----------
        case $path === '/register' && $method === 'POST':
            $user = UserController::register(
                $body['userId'] ?? '',
                $body['nid'] ?? '',
                $body['fullName'] ?? '',
                $body['email'] ?? '',
                $body['phone'] ?? '',
                $body['password'] ?? ''
            );
            respond(['success' => true, 'userId' => $user->userId]);

        case $path === '/login/user' && $method === 'POST':
            $ok = LoginController::userLogin($body['username'] ?? '', $body['password'] ?? '', $body['deviceId'] ?? 'web');
            respond($ok ? ['success' => true] : ['success' => false, 'message' => 'Invalid username or password'], $ok ? 200 : 401);

        case $path === '/login/officer' && $method === 'POST':
            $ok = LoginController::officerLogin($body['username'] ?? '', $body['password'] ?? '', $body['deviceId'] ?? 'web');
            respond($ok ? ['success' => true] : ['success' => false, 'message' => 'Invalid officer ID or password'], $ok ? 200 : 401);

        case $path === '/login/admin' && $method === 'POST':
            $ok = LoginController::adminLogin($body['username'] ?? '', $body['password'] ?? '', $body['deviceId'] ?? 'web');
            respond($ok ? ['success' => true] : ['success' => false, 'message' => 'Invalid admin ID or password'], $ok ? 200 : 401);

        case $path === '/logout' && $method === 'POST':
            SessionManager::logout();
            respond(['success' => true]);

        case $path === '/me' && $method === 'GET':
            $actor = currentRole();
            if (!$actor) respond(['success' => false], 401);
            $extra = [];
            if ($actor['role'] === 'user') {
                $user = \App\Models\User::findById($actor['id']);
                $extra['profilePictureUrl'] = profilePictureUrl($user?->profilePicture);
            }
            respond(['success' => true] + $actor + $extra);

        case $path === '/profile-picture' && $method === 'POST':
            $actor = requireRole('user');
            if (!isset($_FILES['picture'])) {
                respond(['success' => false, 'message' => 'No picture was uploaded.'], 400);
            }
            $relativePath = UserController::uploadProfilePicture(
                $actor['id'],
                $_FILES['picture'],
                __DIR__ . '/uploads/profile_pictures'
            );
            respond(['success' => true, 'profilePictureUrl' => profilePictureUrl($relativePath)]);

        // ---------- OFFICER: change own password ----------
        case $path === '/officer/change-password' && $method === 'POST':
            $actor = requireRole('officer');
            $officer = \App\Models\Officer::findById($actor['id']);

            if (!$officer || !$officer->verifyPassword($body['currentPassword'] ?? '')) {
                respond(['success' => false, 'message' => 'Current password is incorrect.'], 401);
            }

            Validator::matches(
                $body['newPassword'] ?? '',
                $body['confirmPassword'] ?? '',
                'New passwords do not match.'
            );
            Validator::passwordStrength($body['newPassword'] ?? '');

            $officer->resetPassword($body['newPassword'] ?? '');
            respond(['success' => true, 'message' => 'Password changed successfully.']);

        // ---------- USER: account ----------
        case $path === '/account' && $method === 'GET':
            $actor = requireRole('user');
            $stmt = Database::getConnection()->prepare('SELECT * FROM account WHERE user_id = ?');
            $stmt->execute([$actor['id']]);
            $account = $stmt->fetch();
            respond(['success' => true, 'account' => $account ?: null]);
        case $path === '/accounts' && $method === 'GET':
            $actor = requireRole('user');
            $stmt = Database::getConnection()->prepare('SELECT * FROM account WHERE user_id = ? ORDER BY account_no');
            $stmt->execute([$actor['id']]);
            respond(['success' => true, 'accounts' => $stmt->fetchAll()]);

        case $path === '/account-request' && $method === 'POST':
            $actor = requireRole('user');
            UserController::requestAccount(genId('AR'), $actor['id'], $body['accountType'] ?? '', (float) ($body['initialDeposit'] ?? 0));
            respond(['success' => true, 'message' => 'Account request submitted.']);

        // ---------- OFFICER/ADMIN: account requests ----------
        case $path === '/account-requests' && $method === 'GET':
            respond(['requests' => Database::getConnection()->query('SELECT * FROM account_request')->fetchAll()]);

        case preg_match('#^/account-requests/([\w-]+)/(approve|deny)$#', $path, $m) === 1 && $method === 'POST':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            $m[2] === 'approve'
                ? OfficerController::approveAccount($m[1], $actor['id'], $body['actorName'] ?? $actor['id'])
                : OfficerController::denyAccount($m[1], $actor['id'], $body['actorName'] ?? $actor['id']);
            respond(['success' => true]);

        // ---------- USER: loans ----------
        case $path === '/loan-request' && $method === 'POST':
            $actor = requireRole('user');
            UserController::requestLoan(genId('LN'), $body['accountNo'] ?? '', (float) ($body['amount'] ?? 0));
            respond(['success' => true, 'message' => 'Loan request submitted.']);

        case $path === '/loan-requests' && $method === 'GET':
            respond(['requests' => Database::getConnection()->query('SELECT * FROM loan_request')->fetchAll()]);

        case preg_match('#^/loan-requests/([\w-]+)/(approve|deny)$#', $path, $m) === 1 && $method === 'POST':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            $m[2] === 'approve'
                ? OfficerController::approveLoan($m[1], $actor['id'], $body['actorName'] ?? $actor['id'])
                : OfficerController::denyLoan($m[1], $actor['id'], $body['actorName'] ?? $actor['id']);
            respond(['success' => true]);

        // ---------- USER: my loans + repayment ----------
        case $path === '/my-loans' && $method === 'GET':
            $actor = requireRole('user');
            respond(['loans' => \App\Models\LoanReq::findAllForUser($actor['id'])]);

        case preg_match('#^/loan-requests/([\w-]+)/repay$#', $path, $m) === 1 && $method === 'POST':
            $actor = requireRole('user');
            \App\Models\LoanReq::repay($m[1], $actor['id']);

            $loanStmt = Database::getConnection()->prepare('SELECT account_no, amount FROM loan_request WHERE loan_id = ?');
            $loanStmt->execute([$m[1]]);
            $loanRow = $loanStmt->fetch();

            if ($loanRow) {
                try {
                    \App\Models\UserLog::log($actor['id'], $loanRow['account_no'], 'USER', $actor['id'], "Repaid loan {$m[1]}");
                } catch (\Throwable $e) {
                    error_log('UserLog::log failed: ' . $e->getMessage());
                }
                try {
                    \App\Models\Notification::create($actor['id'], "You repaid loan {$m[1]} ({$loanRow['amount']}). Thank you!");
                } catch (\Throwable $e) {
                    error_log('Notification::create failed: ' . $e->getMessage());
                }
            }

            respond(['success' => true, 'message' => 'Loan repaid successfully.']);

        // ---------- USER: withdraw / pay bill ----------
        case $path === '/withdraw' && $method === 'POST':
            $actor = requireRole('user');
            if (($body['type'] ?? '') === 'Bank-to-Bank') {
                $message = TransactionController::transferBank(
                    genId('TB'), $body['accountNo'] ?? '', $body['receiverBank'] ?? 'Dot Bank',
                    $body['receiverAccount'] ?? '', (float) ($body['amount'] ?? 0), $actor['id']
                );
            } else {
                $message = TransactionController::transferMobile(
                    genId('TM'), $body['accountNo'] ?? '', $body['mobile'] ?? '',
                    $body['provider'] ?? 'bKash', (float) ($body['amount'] ?? 0), $actor['id']
                );
            }
            respond(['success' => true, 'message' => $message]);

        case $path === '/pay-bill' && $method === 'POST':
            $actor = requireRole('user');
            $message = TransactionController::payBill(
                genId('BP'), $body['accountNo'] ?? '', $body['billType'] ?? '',
                (float) ($body['amount'] ?? 0), $actor['id']
            );
            respond(['success' => true, 'message' => $message]);

        // ---------- TRANSACTIONS (statement / mini-statement) ----------
        case $path === '/transactions' && $method === 'GET':
            $accountNo = $_GET['accountNo'] ?? '';
            $stmt = Database::getConnection()->prepare(
                'SELECT * FROM transaction WHERE account_no = ? ORDER BY transaction_time DESC'
            );
            $stmt->execute([$accountNo]);
            respond(['transactions' => $stmt->fetchAll()]);

        // ---------- USER: notifications ----------
        case $path === '/notifications' && $method === 'GET':
            $actor = requireRole('user');
            respond(['notifications' => \App\Models\Notification::getUserNotifications($actor['id'])]);

        // ---------- LOGS ----------
        case $path === '/user-logs' && $method === 'GET':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            respond(['logs' => \App\Models\UserLog::getAllLogs((int) ($_GET['limit'] ?? 200))]);

        case $path === '/officer-logs' && $method === 'GET':
            requireRole('admin');
            respond(['logs' => \App\Models\OfficerLog::getLogs((int) ($_GET['limit'] ?? 200))]);

        // ---------- OFFICER/ADMIN: system alerts (e.g. auto-freeze notices) ----------
        case $path === '/officer-alerts' && $method === 'GET':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            respond([
                'alerts' => \App\Models\OfficerAlert::getAll((int) ($_GET['limit'] ?? 100)),
                'unreadCount' => \App\Models\OfficerAlert::unreadCount(),
            ]);

        case preg_match('#^/officer-alerts/(\d+)/read$#', $path, $m) === 1 && $method === 'POST':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            \App\Models\OfficerAlert::markAsRead((int) $m[1]);
            respond(['success' => true]);

        // ---------- OFFICER/ADMIN: large transactions needing approval ----------
        case $path === '/large-transaction-requests' && $method === 'GET':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            respond(['requests' => TransactionController::getPendingLargeTransactions()]);

        case preg_match('#^/large-transaction-requests/(\d+)/(approve|deny)$#', $path, $m) === 1 && $method === 'POST':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            $m[2] === 'approve'
                ? TransactionController::approveLargeTransaction((int) $m[1], $actor['id'])
                : TransactionController::denyLargeTransaction((int) $m[1], $actor['id']);
            respond(['success' => true]);

        // ---------- ADMIN/OFFICER: recent transactions ----------
        case $path === '/admin/transactions' && $method === 'GET':
            $actor = currentRole();
            if (!$actor || !in_array($actor['role'], ['officer', 'admin'], true)) respond(['success' => false], 401);
            respond(['transactions' => Database::getConnection()->query(
                'SELECT * FROM transaction ORDER BY transaction_time DESC LIMIT 20'
            )->fetchAll()]);

        // ---------- ADMIN: officers ----------
        case $path === '/officers' && $method === 'GET':
            requireRole('admin');
            respond(['officers' => AdminController::getAllOfficers()]);

        case $path === '/officers' && $method === 'POST':
            requireRole('admin');
            $result = AdminController::createOfficer(
                $body['officerId'] ?? '', $body['fullName'] ?? '', $body['email'] ?? '', $body['phone'] ?? ''
            );
            respond(['success' => true, 'temporaryPassword' => $result['temporaryPassword']]);

        case preg_match('#^/officers/([\w-]+)$#', $path, $m) === 1 && $method === 'DELETE':
            requireRole('admin');
            AdminController::removeOfficer($m[1]);
            respond(['success' => true]);
        case preg_match('#^/users/([\w-]+)$#', $path, $m) === 1 && $method === 'DELETE':
            requireRole('admin');
            AdminController::removeUser($m[1]);
            respond(['success' => true]);
        // ---------- ADMIN: users + shared accounts manager ----------
        case $path === '/users' && $method === 'GET':
            $rows = Database::getConnection()->query(
                'SELECT u.user_id, u.nid, u.name, u.mobile, a.account_no, a.account_type, a.balance, a.status
                 FROM user u LEFT JOIN account a ON a.user_id = u.user_id'
            )->fetchAll();
            respond(['users' => $rows]);

        case preg_match('#^/accounts/([\w-]+)/(freeze|unfreeze)$#', $path, $m) === 1 && $method === 'POST':
            $account = \App\Models\Account::findByAccountNo($m[1]);
            if (!$account) respond(['success' => false, 'message' => 'Account not found'], 404);
            $m[2] === 'freeze' ? $account->block() : $account->activate();
            respond(['success' => true]);

        default:
            respond(['success' => false, 'message' => 'Not found'], 404);
    }
} catch (AppException $e) {
    respond(['success' => false, 'message' => $e->getMessage()], 400);
} catch (\Throwable $e) {
    error_log($e->getMessage());
    $isProd = \App\Config\Env::isProduction();
    respond([
        'success' => false,
        'message' => $isProd ? 'Server error' : $e->getMessage(),
        'debug' => $isProd ? null : [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ],
    ], 500);
}