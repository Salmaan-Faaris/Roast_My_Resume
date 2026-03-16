import React from 'react';
import { motion } from 'framer-motion';

const INTENSITIES = [
    { value: 'mild', label: 'Mild', emoji: '😌' },
    { value: 'medium', label: 'Medium', emoji: '😏' },
    { value: 'savage', label: 'Savage', emoji: '💀' },
];

export default function RoastSlider({ intensity, onChange }) {
    return (
        <div className="glass-card roast-slider-card">
            <div className="roast-slider-title">Roast Intensity</div>
            <div className="roast-slider-options">
                {INTENSITIES.map((opt) => (
                    <motion.button
                        key={opt.value}
                        className={`roast-slider-option ${intensity === opt.value ? 'active' : ''}`}
                        onClick={() => onChange(opt.value)}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ y: -2 }}
                    >
                        <span className="roast-slider-emoji">{opt.emoji}</span>
                        {opt.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
