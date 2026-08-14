import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

export default function SuccessModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-card bg-white dark:bg-surfaceDark p-8 text-center shadow-card dark:shadow-cardDark border border-black/5 dark:border-white/8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-ink-muted dark:text-inkDark-muted hover:bg-surface-sunk dark:hover:bg-surfaceDark-raised transition-colors"
            >
              <X size={16} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-successDark/10 dark:bg-successDark/15"
            >
              <CheckCircle2 size={32} className="text-successDark" />
            </motion.div>

            <h3 className="font-display text-xl font-bold text-ink dark:text-inkDark">{title}</h3>
            <p className="mt-2 text-sm text-ink-muted dark:text-inkDark-muted leading-relaxed">{message}</p>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
