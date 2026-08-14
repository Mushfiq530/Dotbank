import { motion } from "framer-motion";

const accentMap = {
  blue: {
    icon: "bg-brand-blue/15 text-brand-bluelight dark:bg-brand-blue/20 dark:text-brand-bluelight",
    border: "border-brand-blue/10",
    glow: "hover:shadow-glowSm",
  },
  success: {
    icon: "bg-success/10 text-success dark:bg-successDark/15 dark:text-successDark",
    border: "border-success/10",
    glow: "",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/10",
    glow: "",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    border: "border-purple-500/10",
    glow: "",
  },
};

export default function StatCard({ icon: Icon, label, value, accent = "blue" }) {
  const a = accentMap[accent] || accentMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
      className={`rounded-card bg-white dark:bg-surfaceDark p-5 shadow-card dark:shadow-cardDark
                  border border-black/5 dark:border-white/8 transition-shadow ${a.glow}`}
    >
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${a.icon}`}>
        <Icon size={18} />
      </div>
      <p className="font-display text-3xl font-bold text-ink dark:text-inkDark">{value}</p>
      <p className="mt-1 text-xs font-medium text-ink-muted dark:text-inkDark-muted">{label}</p>
    </motion.div>
  );
}
