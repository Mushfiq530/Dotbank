import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { adminNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { ScrollText, Users, ShieldCheck } from "lucide-react";

export default function AdminLogsPage() {
  const [tab, setTab] = useState("user"); // "user" | "officer"
  const [userLogs, setUserLogs] = useState([]);
  const [officerLogs, setOfficerLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/user-logs").catch(() => ({ logs: [] })),
      api.get("/officer-logs").catch(() => ({ logs: [] })),
    ]).then(([u, o]) => {
      setUserLogs(u.logs || []);
      setOfficerLogs(o.logs || []);
    }).finally(() => setLoading(false));
  }, []);

  const rows = tab === "user" ? userLogs : officerLogs;

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-violet-400">
              <ScrollText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Activity Logs</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">What users and officers have been doing</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("user")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === "user" ? "bg-brand-blue text-white" : "bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 text-ink-muted dark:text-inkDark-muted"
              }`}
            >
              <Users size={14} /> User Log
            </button>
            <button
              onClick={() => setTab("officer")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === "officer" ? "bg-brand-blue text-white" : "bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 text-ink-muted dark:text-inkDark-muted"
              }`}
            >
              <ShieldCheck size={14} /> Officer Log
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-10 text-center">
              <ScrollText size={28} className="mx-auto mb-3 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="text-ink-muted dark:text-inkDark-muted">Nothing logged yet.</p>
            </div>
          ) : (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden divide-y divide-black/4 dark:divide-white/4">
              {rows.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink dark:text-inkDark">
                      {tab === "user" ? (log.user_name || log.user_id) : log.officer_name}
                      {tab === "user" && log.account_no && (
                        <span className="ml-2 font-mono text-xs font-normal text-ink-muted dark:text-inkDark-muted">{log.account_no}</span>
                      )}
                    </p>
                    <span className="text-xs text-ink-muted dark:text-inkDark-muted shrink-0">
                      {new Date(log.logged_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted dark:text-inkDark-muted mt-1">{log.action_desc}</p>
                  {tab === "user" && (
                    <p className="text-[11px] text-ink-muted/70 dark:text-inkDark-muted/70 mt-1">
                      by {log.updated_by_type.toLowerCase()} {log.updated_by_id}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}