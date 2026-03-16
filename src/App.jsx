import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import UploadResume from './components/UploadResume';
import ChatInterface from './components/ChatInterface';
import RoastMeter from './components/RoastMeter';
import RoastSlider from './components/RoastSlider';

// ─── Backend API call for chat ──────────────────────────
async function generateResponse(systemPrompt, userMessage) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userMessage }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'AI service error: ' + response.status);
    }
    const data = await response.json();
    return data.response;
}

// ─── Lazy-loaded utils ──────────────────────────────────
// We lazy-load the heavy modules to avoid blocking the initial render
let parseResumeModule = null;
let searchModule = null;

async function getParseResume() {
    if (!parseResumeModule) {
        parseResumeModule = await import('./utils/parseResume');
    }
    return parseResumeModule.parseResume;
}



async function getSearch() {
    if (!searchModule) {
        searchModule = await import('./utils/search');
    }
    return searchModule;
}

// Chunk text is lightweight, can import directly
import { chunkText } from './utils/chunkText';

// ─── Prompt Builder ─────────────────────────────────────
function buildSystemPrompt(intensity, contextChunks) {
    const toneMap = {
        mild: 'You are a slightly sassy but helpful recruiter. Add light humor but be constructive. Keep roasts mild — more teasing than burning.',
        medium: 'You are a brutally honest recruiter who doesn\'t sugarcoat anything. Mix genuine advice with pointed roasts. Be direct about weaknesses.',
        savage: 'You are the most SAVAGE, MERCILESS recruiter on the planet. Absolutely DESTROY this resume while still being oddly helpful. No mercy. Use dramatic language. Make them question their career choices.',
    };

    const context = contextChunks.map((c) =>
        `[${c.section}] ${c.text}`
    ).join('\n\n');

    return `${toneMap[intensity] || toneMap.medium}

You are reviewing someone's resume. Here are the most relevant excerpts from their resume:

---
${context}
---

RULES:
1. Always reference SPECIFIC things from the resume excerpts above.
2. Give a Roast Score from 0-10 (0 = perfect resume, 10 = absolute disaster). Write it as "ROAST_SCORE: X/10".
3. Identify the cringiest line and write it as "WORST_LINE: <the exact text>".
4. After roasting, give ONE actually useful piece of advice.
5. Keep answers to 3-5 paragraphs max.
6. Use emojis sparingly but effectively.`;
}

// ─── Response Parser ────────────────────────────────────
function parseResponseText(text) {
    let score = null;
    let worstLine = null;

    const scoreMatch = text.match(/ROAST_SCORE:\s*(\d+)\s*\/\s*10/i);
    if (scoreMatch) score = Math.min(10, Math.max(0, parseInt(scoreMatch[1])));

    const worstMatch = text.match(/WORST_LINE:\s*(.+?)(?:\n|$)/i);
    if (worstMatch) worstLine = worstMatch[1].replace(/^["']|["']$/g, '').trim();

    let cleanText = text
        .replace(/ROAST_SCORE:\s*\d+\s*\/\s*10/gi, '')
        .replace(/WORST_LINE:\s*.+?(?:\n|$)/gi, '')
        .trim();

    return { cleanText, score, worstLine };
}

// ─── App Component ──────────────────────────────────────
export default function App() {
    // Pipeline state
    const [chunks, setChunks] = useState([]);
    const [resumeLoaded, setResumeLoaded] = useState(false);
    const [fileName, setFileName] = useState('');
    const [textLength, setTextLength] = useState(0);

    // Processing state
    const [isProcessingResume, setIsProcessingResume] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    // Chat state
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // Roast state
    const [roastScore, setRoastScore] = useState(0);
    const [roastIntensity, setRoastIntensity] = useState('medium');
    const [worstLine, setWorstLine] = useState(null);
    const [matchedChunks, setMatchedChunks] = useState([]);

    // ─── Resume upload pipeline ─────────────────────────
    const handleFileUpload = useCallback(async (file) => {
        console.log('[UPLOAD] handleFileUpload called with:', file.name, file.size, 'bytes');
        setIsProcessingResume(true);
        setResumeLoaded(false);
        setFileName(file.name);
        setChatHistory([]);
        setRoastScore(0);
        setWorstLine(null);
        setMatchedChunks([]);

        try {
            // 1. Parse
            console.log('[UPLOAD] Step 1: Parsing resume...');
            setProcessingStatus('📄 Parsing resume...');
            const parseResume = await getParseResume();
            console.log('[UPLOAD] parseResume function loaded, calling...');
            const text = await parseResume(file);
            console.log('[UPLOAD] Parse complete. Text length:', text.length);
            setTextLength(text.length);

            // 2. Chunk
            console.log('[UPLOAD] Step 2: Chunking...');
            setProcessingStatus('✂️ Splitting into chunks...');
            const chunked = chunkText(text);
            console.log('[UPLOAD] Chunking complete. Chunks:', chunked.length);
            setChunks(chunked);

            console.log('[UPLOAD] Setting resumeLoaded=true');
            setResumeLoaded(true);
            setProcessingStatus('');
        } catch (err) {
            console.error('[UPLOAD] ERROR:', err);
            setProcessingStatus(`❌ Error: ${err.message}`);
            setTimeout(() => {
                setIsProcessingResume(false);
                setProcessingStatus('');
            }, 3000);
            return;
        }

        console.log('[UPLOAD] Complete, setting isProcessingResume=false');
        setIsProcessingResume(false);
    }, []);

    // ─── Ask Bot ────────────────────────────────────────
    const askBot = useCallback(async (question) => {
        setChatHistory(prev => [...prev, { role: 'user', text: question }]);
        setIsTyping(true);

        try {
            const { searchTopK } = await getSearch();
            const topChunks = searchTopK(question, chunks, 3);
            setMatchedChunks(topChunks);

            const systemPrompt = buildSystemPrompt(roastIntensity, topChunks);
            const rawResponse = await generateResponse(systemPrompt, question);
            const { cleanText, score, worstLine: wl } = parseResponseText(rawResponse);

            if (score !== null) setRoastScore(score);
            if (wl) setWorstLine(wl);

            setChatHistory(prev => [...prev, { role: 'bot', text: cleanText }]);
        } catch (err) {
            console.error('Bot error:', err);
            setChatHistory(prev => [...prev, {
                role: 'bot',
                text: '\u26a0\ufe0f ' + err.message
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [chunks, roastIntensity]);

    // ─── Render ─────────────────────────────────────────
    const showInitialState = !resumeLoaded && !isProcessingResume;
    const chatDisabled = !resumeLoaded;

    return (
        <>
            <div className="app-container">
                <header className="app-header">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        🔥 Roast My Resume
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Upload your resume and get brutally honest AI feedback
                    </motion.p>

                    <motion.div
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            marginTop: 12, padding: '6px 16px', borderRadius: 20,
                            background: 'rgba(255, 69, 0, 0.1)',
                            border: '1px solid rgba(255, 69, 0, 0.2)',
                            fontSize: '0.8rem', color: '#ff4500', fontWeight: 600,
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        🔥 Ready to Roast
                    </motion.div>
                </header>

                {showInitialState && (
                    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
                        <UploadResume
                            onResumeParsed={handleFileUpload}
                            isProcessing={isProcessingResume}
                            processingStatus={processingStatus}
                            resumeLoaded={resumeLoaded}
                            fileName={fileName}
                        />

                        <motion.div
                            className="initial-hero"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            style={{ marginTop: 20 }}
                        >
                            <span className="initial-hero-emoji">🔥</span>
                            <h2 className="initial-hero-title">Ready to Get Roasted?</h2>
                            <p className="initial-hero-subtitle">
                                Drop your resume above and our AI recruiter will tear it apart with
                                brutal honesty. Get a roast score, cringe highlights, and actually
                                useful advice.
                            </p>
                        </motion.div>
                    </div>
                )}

                {isProcessingResume && (
                    <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
                        <UploadResume
                            onResumeParsed={handleFileUpload}
                            isProcessing={isProcessingResume}
                            processingStatus={processingStatus}
                            resumeLoaded={resumeLoaded}
                            fileName={fileName}
                        />
                    </div>
                )}

                {resumeLoaded && (
                    <div className="app-main">
                        <div className="app-left">
                            <UploadResume
                                onResumeParsed={handleFileUpload}
                                isProcessing={isProcessingResume}
                                processingStatus={processingStatus}
                                resumeLoaded={resumeLoaded}
                                fileName={fileName}
                            />
                            <ChatInterface
                                chatHistory={chatHistory}
                                onSend={askBot}
                                disabled={chatDisabled}
                                isTyping={isTyping}
                            />
                        </div>

                        <div className="app-right">
                            <RoastSlider intensity={roastIntensity} onChange={setRoastIntensity} />
                            <RoastMeter score={roastScore} />


                            <div className="stats-row">
                                <div className="glass-card stat-card">
                                    <div className="stat-value">{chatHistory.filter(m => m.role === 'bot').length}</div>
                                    <div className="stat-label">Roasts Given</div>
                                </div>
                                <div className="glass-card stat-card">
                                    <div className="stat-value">{textLength}</div>
                                    <div className="stat-label">Chars Parsed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {worstLine && (
                    <footer className="app-footer">
                        <div className="app-footer-inner">
                            <span>😱</span>
                            <span className="footer-cringe-title">Cringe of the Day</span>
                            <span className="footer-cringe-text">"{worstLine}"</span>
                        </div>
                    </footer>
                )}
            </div>
        </>
    );
}
