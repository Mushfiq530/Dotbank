import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleQuestion, X, Send, Bot, User as UserIcon } from "lucide-react";
import { api } from "../../api/client";

const GREETING = "Hi! I'm the DotBank guide. Ask me how to do something, like opening an account or setting up 2FA.";

export default function GuideBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && suggestions.length === 0) {
      api.get("/assistant/suggestions").then((d) => setSuggestions(d.suggestions || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(question) {
    const q = (question ?? input).trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.post("/assistant/ask", { question: q });
      setMessages((m) => [...m, { from: "bot", text: data.answer }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Something went wrong — try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating launcher button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-lg"
        aria-label="Open guide bot"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircleQuestion size={24} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-[60] flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-surfaceDark shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2 bg-gradient-brand px-4 py-3">
              <Bot size={18} className="text-white" />
              <p className="text-sm font-bold text-white">DotBank Guide</p>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${m.from === "user" ? "bg-brand-blue/15 text-brand-blue" : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-inkDark-muted"}`}>
                    {m.from === "user" ? <UserIcon size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.from === "user"
                        ? "bg-gradient-brand text-white rounded-br-sm"
                        : "bg-black/5 dark:bg-white/8 text-ink dark:text-inkDark rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-ink-muted dark:text-inkDark-muted">
                    <Bot size={12} />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-black/5 dark:bg-white/8 px-3.5 py-2.5">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted dark:bg-inkDark-muted [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted dark:bg-inkDark-muted [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted dark:bg-inkDark-muted" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion chips (shown until the user sends their first message) */}
            {messages.length === 1 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-[11px] text-ink-muted dark:text-inkDark-muted hover:border-brand-blue/40 hover:text-brand-blue transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-black/5 dark:border-white/10 p-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-white outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
