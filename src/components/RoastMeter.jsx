import React from 'react';
import { motion } from 'framer-motion';

function getScoreColor(score) {
    if (score <= 3) return 'var(--cringe-low)';
    if (score <= 5) return 'var(--cringe-medium)';
    if (score <= 7) return 'var(--cringe-high)';
    return 'var(--cringe-extreme)';
}

function getCringeLevel(score) {
    if (score <= 3) return { label: 'LOW', emoji: '😌', bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--cringe-low)' };
    if (score <= 5) return { label: 'MEDIUM', emoji: '😬', bg: 'rgba(234, 179, 8, 0.1)', color: 'var(--cringe-medium)' };
    if (score <= 7) return { label: 'HIGH', emoji: '🫣', bg: 'rgba(249, 115, 22, 0.1)', color: 'var(--cringe-high)' };
    return { label: 'EXTREME', emoji: '💀', bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--cringe-extreme)' };
}

export default function RoastMeter({ score }) {
    const color = getScoreColor(score);
    const cringe = getCringeLevel(score);

    return (
        <motion.div
            className="glass-card roast-meter-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="roast-meter-header">
                <span className="roast-meter-title">Roast Score</span>
                <span className="roast-meter-emoji">{cringe.emoji}</span>
            </div>

            <div className="roast-score-display">
                <motion.span
                    className="roast-score-number"
                    style={{ color }}
                    key={score}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    {score}
                </motion.span>
                <span className="roast-score-suffix">/ 10</span>
            </div>

            <div className="roast-bar">
                <motion.div
                    className="roast-bar-fill"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / 10) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>

            <div
                className="cringe-level"
                style={{ background: cringe.bg, color: cringe.color }}
            >
                Cringe Level: {cringe.label}
            </div>
        </motion.div>
    );
}
