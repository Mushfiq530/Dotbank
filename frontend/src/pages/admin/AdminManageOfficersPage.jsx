import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function AdminManageOfficersPage() {
  const { actor } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [confirming, setConfirming] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get("/officers").then((d) => setOfficers(d.officers || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await api.del(`/officers/${id}`);
    setConfirming(null);
    load();
  };

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-400">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Manage Officers</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">{officers.length} active officer{officers.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
            {loading ? (
              <div className="divide-y divide-black/4 dark:divide-white/4">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                    <div className="flex gap-8">
                      {[80, 100, 120].map((w) => (
                        <div key={w} className="space-y-2">
                          <div className="h-3 rounded bg-black/5 dark:bg-white/5" style={{ width: w }} />
                          <div className="h-2.5 rounded bg-black/5 dark:bg-white/5" style={{ width: w * 0.7 }} />
                        </div>
                      ))}
                    </div>
                    <div className="h-8 w-20 rounded-xl bg-black/5 dark:bg-white/5" />
                  </div>
                ))}
              </div>
            ) : officers.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck size={28} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
                <p className="text-sm text-ink-muted dark:text-inkDark-muted">No officers yet. Add one from the sidebar.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/4 dark:divide-white/4">
                {officers.map((o, i) => (
                  <motion.div
                    key={o.officer_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex flex-wrap gap-6 sm:gap-8">
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Officer ID</p>
                        <p className="text-sm font-bold text-ink dark:text-inkDark">{o.officer_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Full name</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{o.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Email</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{o.email}</p>
                      </div>
                    </div>

                    {confirming === o.officer_id ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-dangerDark" />
                        <span className="text-xs font-medium text-dangerDark">Remove officer?</span>
                        <button onClick={() => remove(o.officer_id)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-danger/90 transition-colors">Confirm</button>
                        <button onClick={() => setConfirming(null)} className="rounded-lg bg-surface-sunk dark:bg-surfaceDark-raised px-3 py-1.5 text-xs font-medium text-ink-muted dark:text-inkDark-muted hover:text-ink dark:hover:text-inkDark transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setConfirming(o.officer_id)}
                        className="flex items-center gap-1.5 rounded-xl bg-dangerDark/8 px-3.5 py-2 text-xs font-semibold text-dangerDark hover:bg-dangerDark/15 transition-colors"
                      >
                        <Trash2 size={13} /> Remove
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
