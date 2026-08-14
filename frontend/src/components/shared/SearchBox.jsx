import { Search } from "lucide-react";

export default function SearchBox({ placeholder, value, onChange, onSubmit }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
      className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10
                 bg-surface-sunk dark:bg-surfaceDark-sunk px-4 py-3 focus-within:border-brand-blue
                 dark:focus-within:border-brand-bluelight focus-within:ring-4
                 focus-within:ring-brand-blue/8 dark:focus-within:ring-brand-bluelight/8 transition-all"
    >
      <Search size={16} className="shrink-0 text-ink-muted dark:text-inkDark-muted" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink dark:text-inkDark outline-none
                   placeholder:text-ink-muted/50 dark:placeholder:text-inkDark-muted/50"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Search
      </button>
    </form>
  );
}
