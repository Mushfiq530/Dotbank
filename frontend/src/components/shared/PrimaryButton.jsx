import { motion } from "framer-motion";

export default function PrimaryButton({ children, onClick, type = "button", full = true, disabled = false }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`rounded-lg bg-brand-blue dark:bg-brand-bluelight px-5 py-2.5 text-sm font-semibold
                  text-white dark:text-brand-navy shadow-card dark:shadow-cardDark
                  ${full ? "w-full" : ""}
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </motion.button>
  );
}