/**
 * Lightweight keyword-based search (TF-IDF-like) — no ML model needed.
 * This replaces the heavy @xenova/transformers embeddings to avoid OOM errors.
 */

/**
 * Tokenize text into lowercase words, stripping punctuation.
 */
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

/**
 * Build a term-frequency map for an array of tokens.
 */
function termFrequency(tokens) {
    const tf = {};
    for (const t of tokens) {
        tf[t] = (tf[t] || 0) + 1;
    }
    // Normalize
    const len = tokens.length || 1;
    for (const t in tf) {
        tf[t] /= len;
    }
    return tf;
}

/**
 * Compute cosine similarity between two TF maps.
 */
function cosineSimilarityTF(tfA, tfB) {
    const allTerms = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
    let dot = 0, normA = 0, normB = 0;
    for (const t of allTerms) {
        const a = tfA[t] || 0;
        const b = tfB[t] || 0;
        dot += a * b;
        normA += a * a;
        normB += b * b;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for the top-K most relevant chunks given a query.
 * Uses lightweight keyword matching — no ML model required.
 * @param {string} query
 * @param {Array<{text: string, section: string}>} chunks
 * @param {number} k
 * @returns {Array<{text: string, section: string, score: number}>}
 */
export function searchTopK(query, chunks, k = 3) {
    const queryTokens = tokenize(query);
    const queryTF = termFrequency(queryTokens);

    const scored = chunks.map(chunk => {
        const chunkTokens = tokenize(chunk.text);
        const chunkTF = termFrequency(chunkTokens);
        return {
            text: chunk.text,
            section: chunk.section,
            score: cosineSimilarityTF(queryTF, chunkTF),
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
}
