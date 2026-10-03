/**
 * Splits text into overlapping chunks, preferring to cut at sentence ends.
 * Overlap keeps an idea that straddles a boundary retrievable from both sides.
 */
function chunkText(text, size = 900, overlap = 150) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);

    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
      if (lastBreak > size * 0.5) end = start + lastBreak + 1;
    }

    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 30);
}

module.exports = { chunkText };
