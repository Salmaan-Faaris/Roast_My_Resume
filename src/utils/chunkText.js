/**
 * Section keywords used to auto-tag chunks.
 */
const SECTION_PATTERNS = [
    { regex: /\b(skills?|technologies|tech stack|proficiencies)\b/i, section: 'Skills' },
    { regex: /\b(experience|work history|employment|positions?)\b/i, section: 'Experience' },
    { regex: /\b(education|academic|university|college|degree|gpa)\b/i, section: 'Education' },
    { regex: /\b(projects?|portfolio)\b/i, section: 'Projects' },
    { regex: /\b(certifications?|certificates?|licenses?)\b/i, section: 'Certifications' },
    { regex: /\b(summary|objective|profile|about)\b/i, section: 'Summary' },
    { regex: /\b(awards?|honors?|achievements?)\b/i, section: 'Awards' },
    { regex: /\b(publications?|research)\b/i, section: 'Publications' },
    { regex: /\b(volunteer|community)\b/i, section: 'Volunteer' },
    { regex: /\b(contact|email|phone|address|linkedin|github)\b/i, section: 'Contact' },
];

/**
 * Detect the most likely section for a chunk of text.
 */
function detectSection(text) {
    for (const { regex, section } of SECTION_PATTERNS) {
        if (regex.test(text)) return section;
    }
    return 'General';
}

/**
 * Splits raw resume text into overlapping chunks of ~200-300 characters.
 * @param {string} text - The full resume text.
 * @param {number} chunkSize - Target chunk size in characters (default: 250).
 * @param {number} overlap - Overlap between chunks (default: 50).
 * @returns {Array<{text: string, section: string, index: number}>}
 */
export function chunkText(text, chunkSize = 250, overlap = 50) {
    if (!text || text.trim().length === 0) return [];

    // Clean up whitespace
    const clean = text.replace(/\s+/g, ' ').trim();
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < clean.length) {
        let end = Math.min(start + chunkSize, clean.length);

        // Try to break at a sentence or word boundary
        if (end < clean.length) {
            const slice = clean.slice(start, end);
            const lastPeriod = slice.lastIndexOf('.');
            const lastNewline = slice.lastIndexOf('\n');
            const lastSpace = slice.lastIndexOf(' ');

            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > chunkSize * 0.5) {
                end = start + breakPoint + 1;
            } else if (lastSpace > chunkSize * 0.5) {
                end = start + lastSpace;
            }
        }

        const chunkText = clean.slice(start, end).trim();
        if (chunkText.length > 0) {
            chunks.push({
                text: chunkText,
                section: detectSection(chunkText),
                index: index++,
            });
        }

        // Advance start, using overlap for context continuity
        const nextStart = end - overlap;
        // If we haven't advanced or we've reached the end, stop
        if (nextStart <= start || end >= clean.length) break;
        start = nextStart;
    }

    return chunks;
}
