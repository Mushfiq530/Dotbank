import { motion } from "framer-motion";

export default function RoleButton({ icon: Icon, label, sublabel, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="flex w-48 flex-col items-center gap-3 rounded-card bg-white dark:bg-surfaceDark
                 px-6 py-8 shadow-card dark:shadow-cardDark border border-black/5 dark:border-white/10"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue/10 dark:bg-brand-bluelight/10">
        <Icon size={26} className="text-brand-blue dark:text-brand-bluelight" />
      </div>
      <div className="text-center">
        <p className="font-display text-base font-semibold text-ink dark:text-inkDark">{label}</p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-ink-muted dark:text-inkDark-muted">{sublabel}</p>
        )}
      </div>
    </motion.button>
  );
}
