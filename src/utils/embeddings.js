/**
 * Embeddings module — DISABLED.
 * Using lightweight keyword-based search instead to avoid OOM errors.
 * The @xenova/transformers model is no longer loaded.
 */

export async function initEmbeddingsModel() {
    // No-op: embeddings model removed to save memory
    return;
}

export async function embedTexts(texts) {
    // Return empty arrays — search.js now uses keyword matching instead
    return texts.map(() => []);
}

export async function embedSingle(text) {
    return [];
}
