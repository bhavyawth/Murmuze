import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Search } from "lucide-react";
import { formatMessageTime } from "../lib/util";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatSearchModal({ onClose }) {
  const { selectedUser, searchMessages } = useChatStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    const res = await searchMessages(selectedUser._id, query);
    setResults(res || []);
    setLoading(false);
    setSearched(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        className="bg-base-100 border-2 border-base-content/10 w-full max-w-md p-5 relative"
      >
        {/* Corner accents */}
        {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
          "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((cls, i) => (
          <span key={i} className={`absolute w-3 h-3 border-primary ${cls}`} />
        ))}

        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono tracking-widest opacity-40">// SEARCH MESSAGES</p>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-80"><X size={14} /></button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input autoFocus className="input input-sm flex-1 border-2 border-base-content/15 focus:border-primary bg-transparent"
            placeholder="search in this chat..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }} />
          <button type="submit" className="btn btn-primary btn-sm btn-square"><Search size={14} /></button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && <p className="text-center text-[10px] font-mono opacity-30 py-4">searching...</p>}
          {!loading && searched && results.length === 0 && (
            <p className="text-center text-[10px] font-mono opacity-30 py-4">// no results found</p>
          )}
          <AnimatePresence>
            {results.map((msg, i) => (
              <motion.div key={msg._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="border border-base-content/10 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                <p className="text-sm break-words">{msg.text}</p>
                <p className="text-[9px] font-mono opacity-30 mt-1">{formatMessageTime(msg.createdAt)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
