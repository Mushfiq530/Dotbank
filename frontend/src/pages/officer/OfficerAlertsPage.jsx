import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { officerNavItems, adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { BellRing, ShieldAlert, CheckCheck } from "lucide-react";

export default function OfficerAlertsPage() {
  const { actor } = useAuth();
  const navItems = actor?.role === "admin" ? adminNavItems : officerNavItems;
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/officer-alerts")
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/officer-alerts/${id}/read`, {});
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)));
    } catch {
      // ignore — not critical if this silently fails
    }
  };

  const unreadCount = alerts.filter((a) => !Number(a.is_read)).length;

  return (
    <AppLayout navItems={navItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">
                Account Alerts
                {unreadCount > 0 && (
                  <span className="ml-2 align-middle inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-dangerDark/15 px-2 text-xs font-bold text-dangerDark">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Accounts auto-frozen after repeated failed logins</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-10 text-center">
              <BellRing size={28} className="mx-auto mb-3 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="text-ink-muted dark:text-inkDark-muted">No alerts yet.</p>
            </div>
          ) : (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden divide-y divide-black/4 dark:divide-white/4">
              {alerts.map((alert, i) => {
                const isRead = Boolean(Number(alert.is_read));
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-start justify-between gap-3 px-5 py-4 ${isRead ? "" : "bg-amber-500/5"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink dark:text-inkDark">
                        {alert.user_name || alert.user_id}
                        {alert.account_no && (
                          <span className="ml-2 font-mono text-xs font-normal text-ink-muted dark:text-inkDark-muted">{alert.account_no}</span>
                        )}
                      </p>
                      <p className="text-sm text-ink-muted dark:text-inkDark-muted mt-1">{alert.message}</p>
                      <p className="text-[11px] text-ink-muted/70 dark:text-inkDark-muted/70 mt-1">
                        {new Date(alert.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-ink-muted dark:text-inkDark-muted hover:text-brand-blue dark:hover:text-brand-bluelight hover:border-brand-blue/30 transition-colors"
                      >
                        <CheckCheck size={13} /> Mark read
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}