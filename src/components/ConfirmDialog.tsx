'use client';

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'default';
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = "確認",
    cancelText = "キャンセル",
    onConfirm,
    onCancel,
    variant = 'default'
}: ConfirmDialogProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 pointer-events-auto">
                            {/* Title */}
                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                {title}
                            </h3>

                            {/* Message */}
                            <div className="text-slate-600 mb-6 text-sm leading-relaxed">
                                {message}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-3 px-4 font-bold rounded-xl transition-colors ${variant === 'danger'
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-slate-900 hover:bg-black text-white'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
