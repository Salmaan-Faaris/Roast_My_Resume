import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CringeCard({ worstLine }) {
    return (
        <AnimatePresence mode="wait">
            {worstLine && (
                <motion.div
                    key={worstLine}
                    className="glass-card cringe-card"
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                >
                    <div className="cringe-card-header">
                        <span>😱</span>
                        <span className="cringe-card-title">Cringe of the Day</span>
                    </div>
                    <div className="cringe-card-text">"{worstLine}"</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
