import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingOverlay({ visible, text, subtext }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="loading-spinner" />
                    <div className="loading-text">{text || 'Loading...'}</div>
                    {subtext && <div className="loading-subtext">{subtext}</div>}
                    <div className="loading-progress-bar">
                        <div className="loading-progress-fill" style={{ width: '100%' }} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
