import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Player } from '@/types/game';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSend: (content: string) => void;
    myPlayerId?: string;
    className?: string; // For positioning
}

export function ChatBox({ messages, onSend, myPlayerId, className }: ChatBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null); // Restored
    const [hasUnread, setHasUnread] = useState(false); // Restored
    const [lastUnreadMessage, setLastUnreadMessage] = useState<ChatMessage | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        if (!isOpen && messages.length > 0) {
            const last = messages[messages.length - 1];
            if (last.senderId !== myPlayerId) {
                setHasUnread(true);
                setLastUnreadMessage(last);

                // Auto-hide bubble after 3 seconds
                const timer = setTimeout(() => {
                    setLastUnreadMessage(null);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [messages, isOpen, myPlayerId]);

    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
            setLastUnreadMessage(null);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className={clsx("fixed left-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[900] flex flex-col items-start gap-4 pointer-events-none", className)}>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, originX: 0, originY: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 w-[85vw] max-w-[320px] h-96 rounded-2xl flex flex-col overflow-hidden shadow-2xl mb-2 origin-bottom-left"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
                            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Chat Room</span>
                            <button className="text-white/50 hover:text-white">✕</button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                            {messages.map(msg => {
                                const isMe = msg.senderId === myPlayerId;
                                return (
                                    <div key={msg.id} className={clsx("flex flex-col text-sm", isMe ? "items-end" : "items-start")}>
                                        {!isMe && !msg.isSystem && (
                                            <span className="text-[10px] text-white/40 mb-0.5 ml-1">{msg.senderName}</span>
                                        )}
                                        <div className={clsx(
                                            "px-3 py-2 rounded-xl max-w-[85%] break-words",
                                            msg.isSystem ? "bg-transparent text-white/50 text-xs italic w-full text-center" :
                                                isMe ? "bg-white text-black rounded-tr-none font-medium" :
                                                    "bg-white/10 text-white rounded-tl-none border border-white/10"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div className="text-center text-white/20 text-xs mt-4">No messages yet. Say hi! 👋</div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/20 rounded-full px-4 py-2 text-base text-white focus:outline-none focus:border-white/50 transition-colors"
                                placeholder="Message..."
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-white text-slate-900 rounded-full w-10 h-10 flex items-center justify-center font-bold hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ➤
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Icon Area */}
            <div className="relative pointer-events-auto">
                {/* Speech Bubble */}
                <AnimatePresence>
                    {!isOpen && lastUnreadMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 20 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute bottom-full left-0 mb-3 bg-white text-slate-900 px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl min-w-[180px] max-w-[240px] border border-slate-100"
                        >
                            <div className="text-[10px] font-bold text-slate-400 mb-0.5">{lastUnreadMessage.senderName}</div>
                            <div className="text-xs font-medium line-clamp-2 leading-tight">
                                {lastUnreadMessage.content}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button */}
                <motion.button
                    layout
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-2xl shadow-2xl hover:bg-black transition-colors relative z-50 text-white"
                >
                    {isOpen ? '✕' : '💬'}

                    {/* Unread Dot */}
                    {!isOpen && hasUnread && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    )}
                </motion.button>
            </div>
        </div>
    );
}
