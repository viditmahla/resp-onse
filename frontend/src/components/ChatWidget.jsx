import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendChatMessage, fetchChatHistory } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchChatHistory("default").then(history => {
      if (history && history.length > 0) {
        setMessages(history.map(m => ({ role: m.role, content: m.content })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await sendChatMessage(userMsg, "default");
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p className="font-medium text-slate-500 mb-1">Ask about ERW data</p>
            <p className="text-xs">e.g. "Which region has highest CDR potential?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
              data-testid={`chat-message-${msg.role}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="border-t border-slate-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask about the data..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          data-testid="chat-input"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-40 transition-all active:scale-95"
          data-testid="chat-send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
