import { motion } from "framer-motion";
import { Trash2, Snowflake, Sun } from "lucide-react";

/**
 * fields: [{ label, value }]
 * action: "remove" | "freeze"
 * frozen: only relevant when action === "freeze"
 */
export default function ListRow({ fields, action = "remove", frozen = false, onAction, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex flex-wrap gap-6">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs text-ink-muted dark:text-inkDark-muted">{f.label}</p>
            <p className="text-sm font-medium text-ink dark:text-inkDark">{f.value}</p>
          </div>
        ))}
      </div>

      {action === "remove" ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
          className="flex items-center gap-1 rounded-lg bg-danger/10 dark:bg-dangerDark/10
                     px-3 py-1.5 text-xs font-medium text-danger dark:text-dangerDark"
        >
          <Trash2 size={13} /> Remove
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium
            ${
              frozen
                ? "bg-success/10 text-success dark:bg-successDark/10 dark:text-successDark"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
        >
          {frozen ? <Sun size={13} /> : <Snowflake size={13} />}
          {frozen ? "Unfreeze" : "Freeze"}
        </motion.button>
      )}
    </div>
  );
}
