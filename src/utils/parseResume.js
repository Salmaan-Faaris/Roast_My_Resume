/**
 * Parses a resume PDF by sending it to the backend server.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function parseResume(file) {
    const name = file.name.toLowerCase();

    if (!name.endsWith('.pdf')) {
        throw new Error(`Unsupported file type: ${name.split('.').pop()}. Please upload a PDF file.`);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.text || data.text.trim().length === 0) {
        throw new Error('Could not extract text from PDF. The file might be scanned/image-based.');
    }

    return data.text;
}
