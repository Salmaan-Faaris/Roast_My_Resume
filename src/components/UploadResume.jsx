import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadResume({ onResumeParsed, isProcessing, processingStatus, resumeLoaded, fileName }) {
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFile = useCallback((file) => {
        setError(null);
        const name = file.name.toLowerCase();
        if (!name.endsWith('.pdf')) {
            setError('Unsupported format. Please upload a PDF file.');
            return;
        }
        onResumeParsed(file);
    }, [onResumeParsed]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragging(false), []);

    const handleClick = () => {
        if (!resumeLoaded && !isProcessing) {
            fileInputRef.current?.click();
        }
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleReplace = (e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    if (resumeLoaded) {
        return (
            <motion.div
                className="glass-card upload-card loaded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="upload-loaded-row">
                    <span className="upload-loaded-icon">📄</span>
                    <div className="upload-loaded-info">
                        <div className="upload-loaded-name">{fileName}</div>
                        <div className="upload-loaded-status">✅ Resume parsed & embedded</div>
                    </div>
                    <button className="upload-replace-btn" onClick={handleReplace}>
                        Replace
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleChange}
                />
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`glass-card upload-card ${dragging ? 'dragging' : ''}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            whileHover={!isProcessing ? { scale: 1.01 } : {}}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleChange}
            />

            {isProcessing ? (
                <>
                    <span className="upload-icon">⚙️</span>
                    <div className="upload-title">Processing Resume...</div>
                    <div className="upload-subtitle">{processingStatus || 'Hang tight...'}</div>
                    <div className="upload-progress">
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: '60%' }} />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <span className="upload-icon">📤</span>
                    <div className="upload-title">Drop your resume here</div>
                    <div className="upload-subtitle">or click to browse files</div>
                    <div className="upload-formats">
                        <span className="upload-format-badge">PDF</span>
                    </div>
                </>
            )}

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="upload-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
