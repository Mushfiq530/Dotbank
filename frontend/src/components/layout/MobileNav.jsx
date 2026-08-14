import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export default function MobileNav({ items }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-surfaceDark/95 backdrop-blur-xl px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {items.slice(0, 6).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 transition-all ${
                  isActive ? "text-brand-bluelight" : "text-inkDark-muted"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-brand-blue/20" : ""
                }`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label.split(" ")[0]}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
