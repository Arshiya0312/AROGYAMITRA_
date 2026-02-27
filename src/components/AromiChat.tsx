import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, Sparkles, Bot, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { chatWithAI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function AromiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/ai/chat-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChat(res.data);
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  };

  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear your chat history?")) return;
    try {
      await axios.delete('/api/ai/chat-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChat([]);
    } catch (e) {
      console.error("Failed to clear chat history", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message;
    setMessage('');
    setChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Save user message to history
      await axios.post('/api/ai/chat-history', { role: 'user', content: userMsg }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const aiResponse = await chatWithAI(userMsg, profile) || "I'm sorry, I couldn't generate a response.";
      
      setChat(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Save assistant message to history
      await axios.post('/api/ai/chat-history', { role: 'assistant', content: aiResponse }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e: any) {
      console.error("Chat error:", e);
      let errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again later.";
      
      const serverError = e.response?.data?.error;
      if (serverError) {
        errorMsg = `AROMI encountered a server error: ${serverError}.`;
      } else if (e.message === "AI configuration missing") {
        errorMsg = "AROMI is currently offline because the AI configuration is missing. Please check your environment settings.";
      } else if (e.message?.includes("Invalid API Key")) {
        errorMsg = "AROMI is having trouble with the API key. Please ensure your Gemini API key is valid and has billing enabled if required.";
      } else if (e.message) {
        errorMsg = `AROMI encountered an error: ${e.message}. Please try again later.`;
      }
      
      setChat(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:bg-emerald-700 transition-colors"
      >
        <MessageCircle size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[90vw] md:w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold">AROMI</h3>
                  <p className="text-xs text-emerald-100 flex items-center gap-1">
                    <Sparkles size={10} /> AI Health Coach
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearHistory} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-emerald-100 hover:text-white"
                  title="Clear History"
                >
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
              {chat.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} />
                  </div>
                  <p className="text-stone-500 text-sm px-8">
                    Hi! I'm AROMI. How can I help you with your fitness journey today?
                  </p>
                </div>
              )}
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none shadow-sm'
                  }`}>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-stone-100 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask AROMI anything..."
                  className="w-full pl-4 pr-12 py-3 bg-stone-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
            {/* Exit AROMI Button */}
<div className="p-3 border-t border-stone-100 bg-white text-center">
  <button
    onClick={() => setIsOpen(false)}
    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl transition-colors"
  >
    Exit AROMI
  </button>
</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
