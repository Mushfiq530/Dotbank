import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function NotificationsPage() {
  const { actor } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications")
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-400">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Notifications</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">
                {notifications.length > 0 ? `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}` : "Bill payments, withdrawals, and loan decisions"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
                      <div className="h-2.5 w-1/3 rounded bg-black/5 dark:bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sunk dark:bg-surfaceDark-raised">
                <BellOff size={28} className="text-ink-muted/40 dark:text-inkDark-muted/40" />
              </div>
              <p className="font-semibold text-ink dark:text-inkDark mb-1">All caught up</p>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">No notifications yet — they'll appear here when you have activity.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <motion.div
                  key={n.notification_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`relative flex items-start gap-4 rounded-card border px-5 py-4 transition-all ${
                    n.is_read == 1
                      ? "border-black/5 dark:border-white/8 bg-white dark:bg-surfaceDark"
                      : "border-brand-blue/20 dark:border-brand-bluelight/20 bg-brand-blue/4 dark:bg-brand-bluelight/4"
                  }`}
                >
                  {n.is_read == 0 && (
                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-brand-blue dark:bg-brand-bluelight" />
                  )}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    n.is_read == 0 ? "bg-brand-blue/10 text-brand-blue dark:text-brand-bluelight" : "bg-surface-sunk dark:bg-surfaceDark-raised text-ink-muted dark:text-inkDark-muted"
                  }`}>
                    <Bell size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-inkDark leading-snug">{n.message}</p>
                    <p className="mt-1 text-xs text-ink-muted dark:text-inkDark-muted">
                      {new Date(n.created_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
