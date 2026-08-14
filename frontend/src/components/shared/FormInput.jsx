export default function FormInput({ label, type = "text", placeholder, value, onChange, required }) {
  return (
    <label className="block group">
      <span className="mb-2 block text-sm font-medium text-ink dark:text-inkDark">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-black/10 dark:border-white/10
                   bg-surface-sunk dark:bg-surfaceDark-sunk
                   px-4 py-3 text-sm text-ink dark:text-inkDark
                   placeholder:text-ink-muted/50 dark:placeholder:text-inkDark-muted/50
                   focus:border-brand-blue dark:focus:border-brand-bluelight
                   focus:ring-4 focus:ring-brand-blue/8 dark:focus:ring-brand-bluelight/8
                   outline-none transition-all duration-200"
      />
    </label>
  );
}
