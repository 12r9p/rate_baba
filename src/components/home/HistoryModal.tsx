import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: number[];
}

export function HistoryModal({ isOpen, onClose, history }: HistoryModalProps) {
    if (!isOpen) return null;

    // Prepare data for Recharts
    // history is [oldest, ..., newest] (already reversed in Repository) ?
    // Repository: `historyRows.map(r => r.rate_after).reverse();` -> resulting in [newest, ..., oldest] usually if ORDER BY id DESC.
    // Wait, let's check repo logic:
    // `SELECT rate_after FROM player_history ... ORDER BY id DESC LIMIT 20`
    // Returns [Newest ... Oldest]
    // `reverse()` -> [Oldest ... Newest]
    // Creating chart data:
    const data = history.map((rate, index) => ({
        game: index + 1,
        rate,
    }));

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
            >
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full pointer-events-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">📈 Rate History</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {history.length < 2 ? (
                        <div className="py-12 text-center text-slate-400 font-bold">
                            NOT ENOUGH DATA
                        </div>
                    ) : (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="game"
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        stroke="#0f172a"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#0f172a", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 6, fill: "#3b82f6" }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}
