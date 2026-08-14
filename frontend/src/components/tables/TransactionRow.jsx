import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionRow({ transaction }) {
  const isCredit = transaction.type === "credit";
  const date = new Date(transaction.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(23,104,172,0.05)" }}
      className="flex items-center justify-between rounded-lg px-3 py-3"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full
            ${isCredit ? "bg-success/10 text-success dark:bg-successDark/10 dark:text-successDark"
                       : "bg-danger/10 text-danger dark:bg-dangerDark/10 dark:text-dangerDark"}`}
        >
          {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
        </div>
        <div>
          <p className="text-sm font-medium text-ink dark:text-inkDark">{transaction.description}</p>
          <p className="text-xs text-ink-muted dark:text-inkDark-muted">{date}</p>
        </div>
      </div>
      <span
        className={`font-mono text-sm font-semibold
          ${isCredit ? "text-success dark:text-successDark" : "text-danger dark:text-dangerDark"}`}
      >
        {isCredit ? "+" : "-"}${transaction.amount.toFixed(2)}
      </span>
    </motion.div>
  );
}
