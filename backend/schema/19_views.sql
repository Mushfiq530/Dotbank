-- Views for Dot Bank.
-- Depends on: user, officer_alert, user_log
-- (must run after those tables exist)
--
-- These replace JOIN queries that were previously written out by hand in
-- OfficerAlert::getAll() and UserLog::getAllLogs() every time those
-- methods ran. The JOIN logic now lives once in the database; PHP just
-- SELECTs from the view.

-- officer_alert_with_user: every officer_alert row plus the alerted
-- user's name, so the officer/admin alerts UI doesn't need a second
-- lookup per row. Used by OfficerAlert::getAll() and OfficerAlert::unreadCount().
CREATE VIEW officer_alert_with_user AS
SELECT
    oa.id,
    oa.user_id,
    oa.account_no,
    oa.message,
    oa.created_at,
    oa.is_read,
    u.name AS user_name
FROM officer_alert oa
LEFT JOIN user u ON u.user_id = oa.user_id;

-- user_log_with_user: every user_log row plus the affected user's name.
-- Used by UserLog::getAllLogs() for the officer/admin log viewer.
CREATE VIEW user_log_with_user AS
SELECT
    ul.id,
    ul.user_id,
    ul.account_no,
    ul.updated_by_type,
    ul.updated_by_id,
    ul.action_desc,
    ul.logged_at,
    u.name AS user_name
FROM user_log ul
LEFT JOIN user u ON u.user_id = ul.user_id;