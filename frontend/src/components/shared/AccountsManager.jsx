import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ListRow from "../tables/ListRow";
import { api } from "../../api/client";

export default function AccountsManager() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/users").then((d) => setRows(d.users || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleFreeze = async (row) => {
    const action = row.status === "BLOCKED" ? "unfreeze" : "freeze";
    await api.post(`/accounts/${row.account_no}/${action}`, {});
    load();
    setSelected(null);
  };

  if (loading) return <p className="text-sm text-ink-muted dark:text-inkDark-muted">Loading...</p>;

  return (
    <div>
      <div className="rounded-card bg-white dark:bg-surfaceDark shadow-card dark:shadow-cardDark
                      border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10">
        {rows.map((r) => (
          <ListRow
            key={r.account_no ?? `${r.user_id}-no-account`}
            onClick={() => r.account_no && setSelected(r)}
            fields={[
              { label: "User ID", value: r.user_id },
              { label: "Full name", value: r.name },
              { label: "Account no.", value: r.account_no ?? "—" },
              { label: "Type", value: r.account_type ?? "—" },
              { label: "Status", value: r.account_no ? (r.status === "BLOCKED" ? "Frozen" : "Active") : "No account" },
            ]}
            action="freeze"
            frozen={r.status === "BLOCKED"}
            onAction={() => r.account_no && toggleFreeze(r)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ type: "spring", stiffness: 350, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-card bg-white dark:bg-surfaceDark p-6 shadow-card dark:shadow-cardDark
                         border border-black/5 dark:border-white/10"
            >
              <h3 className="mb-4 font-display text-base font-semibold text-ink dark:text-inkDark">{selected.name}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted dark:text-inkDark-muted">Account number</span>
                  <span className="font-mono text-ink dark:text-inkDark">{selected.account_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted dark:text-inkDark-muted">Account type</span>
                  <span className="text-ink dark:text-inkDark">{selected.account_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted dark:text-inkDark-muted">Balance</span>
                  <span className="font-mono text-ink dark:text-inkDark">${Number(selected.balance).toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => toggleFreeze(selected)}
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold
                  ${selected.status === "BLOCKED"
                    ? "bg-success/10 text-success dark:bg-successDark/10 dark:text-successDark"
                    : "bg-danger/10 text-danger dark:bg-dangerDark/10 dark:text-dangerDark"}`}
              >
                {selected.status === "BLOCKED" ? "Unfreeze account" : "Freeze account"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}