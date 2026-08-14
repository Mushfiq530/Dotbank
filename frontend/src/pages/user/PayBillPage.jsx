import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap as Bolt, Wifi, CheckCircle2, XCircle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

const bills = [
  { type: "Gas", icon: Flame, color: "from-orange-500 to-red-500", bg: "bg-orange-500/10", text: "text-orange-500" },
  { type: "Electricity", icon: Bolt, color: "from-yellow-400 to-amber-500", bg: "bg-yellow-400/10", text: "text-yellow-500" },
  { type: "WiFi", icon: Wifi, color: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10", text: "text-blue-500" },
];

export default function PayBillPage() {
  const { actor, accounts, account, refreshAccount } = useAuth();
  const [selectedNo, setSelectedNo] = useState(account?.account_no || "");
  const [selected, setSelected] = useState("Gas");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account?.account_no && !selectedNo) setSelectedNo(account.account_no);
  }, [account, selectedNo]);

  const selectedAccount = accounts.find((a) => a.account_no === selectedNo) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const data = await api.post("/pay-bill", {
        accountNo: selectedNo, billType: selected, amount: Number(amount),
      });
      setResult({ success: true, message: data.message });
      setAmount("");
      refreshAccount();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedBill = bills.find((b) => b.type === selected);

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedBill?.color}`}>
              {selectedBill && <selectedBill.icon size={20} className="text-white" />}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Pay a Bill</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">
                {selectedAccount
                  ? <>Balance: <span className="font-mono font-semibold">${Number(selectedAccount.balance).toFixed(2)}</span></>
                  : "No approval needed"}
              </p>
            </div>
          </div>

          {/* Account selector */}
          {accounts.length > 1 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">From Account</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button key={a.account_no} onClick={() => setSelectedNo(a.account_no)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                      selectedNo === a.account_no
                        ? "border-brand-blue/40 bg-brand-blue/8 dark:border-brand-bluelight/30 dark:bg-brand-bluelight/8"
                        : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark"
                    }`}
                  >
                    <div className="font-semibold text-ink dark:text-inkDark">{a.account_type}</div>
                    <div className="font-mono text-ink-muted dark:text-inkDark-muted">{a.account_no}</div>
                    <div className="font-mono font-bold text-ink dark:text-inkDark">${Number(a.balance).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
                  result.success
                    ? "border-successDark/25 bg-successDark/8 text-successDark"
                    : "border-dangerDark/25 bg-dangerDark/8 text-dangerDark"
                }`}
              >
                {result.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                <span className="text-sm font-medium">{result.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bill type selector */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {bills.map(({ type, icon: Icon, color, bg, text }) => (
              <motion.button
                key={type}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelected(type)}
                className={`flex flex-col items-center gap-3 rounded-2xl border px-3 py-5 text-xs font-semibold transition-all ${
                  selected === type
                    ? `border-transparent bg-gradient-to-br ${color} text-white shadow-card`
                    : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark text-ink-muted dark:text-inkDark-muted hover:border-black/15 dark:hover:border-white/15"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  selected === type ? "bg-white/20" : `${bg}`
                }`}>
                  <Icon size={18} className={selected === type ? "text-white" : text} />
                </div>
                {type}
              </motion.button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4">
            <FormInput label={`${selected} bill amount`} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedNo || loading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing…
                </span>
              ) : `Pay ${selected} Bill`}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
