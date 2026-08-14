import { motion } from "framer-motion";

export default function QuickActionButton({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -3, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className={`flex flex-col items-center gap-2 rounded-card bg-white dark:bg-surfaceDark
                  px-5 py-4 shadow-card dark:shadow-cardDark border border-black/5 dark:border-white/10
                  ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 dark:bg-brand-bluelight/10">
        {Icon && <Icon size={18} className="text-brand-blue dark:text-brand-bluelight" />}
      </div>
      <span className="text-xs font-medium text-ink dark:text-inkDark">{label}</span>
    </motion.button>
  );
}
