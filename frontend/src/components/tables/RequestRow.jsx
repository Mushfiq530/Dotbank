import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

/**
 * fields: [{ label, value }]  -- rendered as small label/value pairs
 * onApprove / onReject: optional handlers (no real logic needed yet)
 */
export default function RequestRow({ fields, onApprove, onReject }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex flex-wrap gap-6">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs text-ink-muted dark:text-inkDark-muted">{f.label}</p>
            <p className="text-sm font-medium text-ink dark:text-inkDark">{f.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onApprove}
          className="flex items-center gap-1 rounded-lg bg-success/10 dark:bg-successDark/10
                     px-3 py-1.5 text-xs font-medium text-success dark:text-successDark"
        >
          <Check size={13} /> Approve
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReject}
          className="flex items-center gap-1 rounded-lg bg-danger/10 dark:bg-dangerDark/10
                     px-3 py-1.5 text-xs font-medium text-danger dark:text-dangerDark"
        >
          <X size={13} /> Reject
        </motion.button>
      </div>
    </div>
  );
}
