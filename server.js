import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── PDF parse ──────────────────────────────────────────
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        if (!req.file.originalname.toLowerCase().endsWith('.pdf'))
            return res.status(400).json({ error: 'Only PDF files are supported' });
        const data = new Uint8Array(req.file.buffer);
        const pdf = await getDocument({ data }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            let lines = [], currentLine = '', lastY = null;
            for (const item of content.items) {
                const str = item.str;
                if (!str && str !== '') continue;
                const y = item.transform ? item.transform[5] : null;
                if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
                    if (currentLine.trim()) lines.push(currentLine.trim());
                    currentLine = str;
                } else {
                    currentLine += (currentLine && str && !currentLine.endsWith(' ') && !str.startsWith(' ')) ? ' ' + str : str;
                }
                if (y !== null) lastY = y;
            }
            if (currentLine.trim()) lines.push(currentLine.trim());
            pages.push(lines.join('\n'));
        }
        const text = pages.join('\n\n');
        console.log('Parsed PDF:', req.file.originalname, pdf.numPages, 'pages,', text.length, 'chars');
        res.json({ text, pages: pdf.numPages });
    } catch (err) {
        console.error('PDF parse error:', err);
        res.status(500).json({ error: 'Failed to parse PDF: ' + err.message });
    }
});

// ─── Chat / Roast endpoint ─────
app.post('/api/chat', async (req, res) => {
    try {
        const { systemPrompt, userMessage } = req.body;
        if (!userMessage) return res.status(400).json({ error: 'No message provided' });

        const url = 'https://text.pollinations.ai/openai';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                model: 'openai',
                seed: Math.floor(Math.random() * 100000)
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('AI API Error:', response.status, errText);
            return res.status(500).json({ error: 'AI service error: ' + response.status });
        }

        const data = await response.json();
        
        // Pollinations returns OpenAI-compatible JSON formats when using the /openai endpoint
        let responseText = '';
        if (data.choices && data.choices[0] && data.choices[0].message) {
            responseText = data.choices[0].message.content;
        } else if (typeof data === 'string') {
            responseText = data;
        } else {
            responseText = JSON.stringify(data);
        }

        console.log('AI response generated:', responseText.length, 'chars');
        res.json({ response: responseText.trim() });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: 'Chat failed: ' + err.message });
    }
});

const PORT = 3001;
app.listen(PORT, function() { console.log('Backend running on http://localhost:' + PORT); });
