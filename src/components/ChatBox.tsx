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
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        if (!isOpen && messages.length > 0) {
            // Simple unread check: if last message wasn't from me
            const last = messages[messages.length - 1];
            if (last.senderId !== myPlayerId) {
                setHasUnread(true);
            }
        }
    }, [messages, isOpen, myPlayerId]);

    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className={clsx("fixed left-4 bottom-4 z-[900] flex items-end gap-2", className)}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, originY: 1, originX: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-black/80 backdrop-blur-md border border-white/10 w-80 h-96 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Chat Room</span>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
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
                        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/5">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-white/50 transition-colors"
                                placeholder="Message..."
                            />
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center text-xl shadow-lg hover:scale-105 active:scale-95 transition-all group relative"
            >
                💬
                {hasUnread && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                )}
            </button>
        </div>
    );
}
