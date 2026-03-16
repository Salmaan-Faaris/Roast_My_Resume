import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatInterface({ chatHistory, onSend, disabled, isTyping }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || disabled || isTyping) return;
        onSend(trimmed);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="glass-card chat-container">
            <div className="chat-messages">
                {chatHistory.length === 0 && !disabled ? (
                    <div className="chat-empty">
                        <span className="chat-empty-icon">💬</span>
                        <div className="chat-empty-text">
                            Ask me anything about your resume.<br />
                            I'll roast it with brutal honesty. 🔥
                        </div>
                    </div>
                ) : chatHistory.length === 0 && disabled ? (
                    <div className="chat-empty">
                        <span className="chat-empty-icon">📄</span>
                        <div className="chat-empty-text">
                            Upload a resume first to start the roasting session.
                        </div>
                    </div>
                ) : null}

                <AnimatePresence initial={false}>
                    {chatHistory.map((msg, i) => (
                        <motion.div
                            key={i}
                            className={`chat-bubble ${msg.role}`}
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            <span className="sender">{msg.role === 'user' ? 'You' : '🔥 Roast Bot'}</span>
                            <div className="message-text">{msg.text}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
                <textarea
                    ref={inputRef}
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={disabled ? 'Upload a resume to start chatting...' : 'Ask about the resume...'}
                    disabled={disabled || isTyping}
                    rows={1}
                    id="chat-input"
                />
                <button
                    className="chat-send-btn"
                    type="submit"
                    disabled={disabled || isTyping || !input.trim()}
                    id="chat-send-btn"
                >
                    🔥
                </button>
            </form>
        </div>
    );
}
