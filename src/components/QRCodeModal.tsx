import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRCodeModalProps {
    url: string;
    onClose: () => void;
}

export function QRCodeModal({ url, onClose }: QRCodeModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900">JOIN ROOM</h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">Scan to play on mobile</p>
                </div>

                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner">
                    <QRCodeSVG value={url} size={200} level="H" includeMargin />
                </div>

                <div className="w-full">
                    <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 font-mono truncate flex-1">{url}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(url);
                                // Optional: simple toast or feedback
                            }}
                            className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition"
                        >
                            COPY
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                    CLOSE
                </button>
            </motion.div>
        </motion.div>
    );
}
