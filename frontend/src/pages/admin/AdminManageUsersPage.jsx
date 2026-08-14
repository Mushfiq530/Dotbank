import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Users, Search, AlertTriangle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function AdminManageUsersPage() {
  const { actor } = useAuth();
  const [users, setUsers] = useState([]);
  const [confirming, setConfirming] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/users").then((d) => {
      const byUser = new Map();
      for (const row of d.users || []) {
        if (!byUser.has(row.user_id)) byUser.set(row.user_id, { ...row, accountCount: 0 });
        if (row.account_no) byUser.get(row.user_id).accountCount += 1;
      }
      setUsers([...byUser.values()]);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (userId) => {
    await api.del(`/users/${userId}`);
    setConfirming(null);
    load();
  };

  const filtered = users.filter((u) =>
    !search || u.user_id?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-600">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Manage Users</h1>
                <p className="text-sm text-ink-muted dark:text-inkDark-muted">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-surfaceDark px-4 py-3 focus-within:border-brand-blue dark:focus-within:border-brand-bluelight transition-colors">
            <Search size={16} className="text-ink-muted dark:text-inkDark-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or name…"
              className="w-full bg-transparent text-sm text-ink dark:text-inkDark outline-none placeholder:text-ink-muted/50 dark:placeholder:text-inkDark-muted/50"
            />
          </div>

          <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
            {loading ? (
              <div className="divide-y divide-black/4 dark:divide-white/4">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                    <div className="flex gap-8">
                      <div className="space-y-2"><div className="h-3 w-20 rounded bg-black/5 dark:bg-white/5" /><div className="h-2.5 w-16 rounded bg-black/5 dark:bg-white/5" /></div>
                      <div className="space-y-2"><div className="h-3 w-24 rounded bg-black/5 dark:bg-white/5" /><div className="h-2.5 w-20 rounded bg-black/5 dark:bg-white/5" /></div>
                    </div>
                    <div className="h-8 w-20 rounded-xl bg-black/5 dark:bg-white/5" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={28} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
                <p className="text-sm text-ink-muted dark:text-inkDark-muted">No users found.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/4 dark:divide-white/4">
                {filtered.map((u) => (
                  <div key={u.user_id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex flex-wrap gap-6 sm:gap-8">
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Username</p>
                        <p className="text-sm font-bold text-ink dark:text-inkDark">{u.user_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">NID</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{u.nid}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{u.mobile}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Accounts</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{u.accountCount}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {confirming === u.user_id ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <AlertTriangle size={14} className="text-dangerDark" />
                          <span className="text-xs font-medium text-dangerDark">Delete permanently?</span>
                          <button onClick={() => remove(u.user_id)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-danger/90 transition-colors">Confirm</button>
                          <button onClick={() => setConfirming(null)} className="rounded-lg bg-surface-sunk dark:bg-surfaceDark-raised px-3 py-1.5 text-xs font-medium text-ink-muted dark:text-inkDark-muted hover:text-ink dark:hover:text-inkDark transition-colors">Cancel</button>
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => setConfirming(u.user_id)}
                          className="flex items-center gap-1.5 rounded-xl bg-dangerDark/8 px-3.5 py-2 text-xs font-semibold text-dangerDark hover:bg-dangerDark/15 transition-colors"
                        >
                          <Trash2 size={13} /> Remove
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
