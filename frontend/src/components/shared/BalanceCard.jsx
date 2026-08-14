import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function BalanceCard({ balance = 0, accountType = "Savings", accountNo = "", trend = null }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const from = displayValue;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(from + (balance - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  const formatted = hidden
    ? "••••••"
    : displayValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maskedNo = accountNo
    ? `•••• ${accountNo.slice(-4)}`
    : "•••• ••••";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl2 p-6 text-white"
      style={{
        background: "linear-gradient(135deg, #1a2d6b 0%, #0E1523 40%, #1a0e3d 100%)",
        boxShadow: "0 8px 40px rgba(67,97,238,0.3), 0 1px 0 rgba(255,255,255,0.08) inset",
      }}
    >
      {/* Shine overlay */}
      <div className="card-shine absolute inset-0 pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/50">{accountType}</p>
          <p className="mt-0.5 text-xs font-mono text-white/40">{maskedNo}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium text-white/40 tracking-wide uppercase"></span>
        </div>
      </div>

      {/* Balance */}
      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Available Balance</p>
          <motion.div
            key={balance}
            className="font-display text-4xl font-bold tracking-tight"
          >
            <span className="text-white/40 text-2xl mr-0.5">$</span>
            <span>{formatted}</span>
          </motion.div>
        </div>
        <button
          onClick={() => setHidden((h) => !h)}
          className="mb-1 rounded-lg p-1.5 text-white/40 hover:text-white/70 transition-colors"
        >
          {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>

      {/* Trend */}
      {trend !== null && (
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          trend >= 0 ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"
        }`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% this month
        </div>
      )}

      {/* Dot Bank watermark at bottom-right */}
      <div className="absolute bottom-4 right-5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Dot Bank
      </div>
    </motion.div>
  );
}