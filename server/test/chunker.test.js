const test = require('node:test');
const assert = require('node:assert');
const { chunkText } = require('../src/utils/chunker');
const { cosineSimilarity } = require('../src/utils/similarity');

test('chunkText returns nothing for empty input', () => {
  assert.deepStrictEqual(chunkText('   '), []);
});

test('chunkText keeps short text in a single chunk', () => {
  const text = 'This is a short document that easily fits in one chunk.';
  assert.deepStrictEqual(chunkText(text), [text]);
});

test('chunkText splits long text into overlapping chunks within the size limit', () => {
  const sentence = 'Retrieval augmented generation grounds answers in real documents. ';
  const chunks = chunkText(sentence.repeat(60), 900, 150);
  assert.ok(chunks.length > 1);
  chunks.forEach((c) => assert.ok(c.length <= 900));
  // Overlap: the start of chunk 2 appears at the end of chunk 1
  assert.ok(chunks[0].includes(chunks[1].slice(0, 40)));
});

test('cosineSimilarity is 1 for identical vectors and 0 for orthogonal ones', () => {
  assert.strictEqual(Math.round(cosineSimilarity([1, 2, 3], [1, 2, 3]) * 1000) / 1000, 1);
  assert.strictEqual(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.strictEqual(cosineSimilarity([0, 0], [1, 1]), 0);
});
