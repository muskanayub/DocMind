const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { extractPages } = require('../src/services/rag');

const fixture = (name) => fs.readFileSync(path.join(__dirname, name));

test('extractPages reads a PDF page by page with page numbers', async () => {
  const pages = await extractPages(fixture('sample.pdf'), '.pdf');
  assert.strictEqual(pages.length, 2);
  assert.strictEqual(pages[0].page, 1);
  assert.match(pages[0].text, /30 days of delivery/);
  assert.strictEqual(pages[1].page, 2);
  assert.match(pages[1].text, /five business days/);
});

test('extractPages reads DOCX text', async () => {
  const pages = await extractPages(fixture('sample.docx'), '.docx');
  assert.strictEqual(pages.length, 1);
  assert.strictEqual(pages[0].page, null);
  assert.match(pages[0].text, /launch date is moved to March/);
});

test('extractPages reads plain text', async () => {
  const pages = await extractPages(Buffer.from('Hello from a text file'), '.txt');
  assert.strictEqual(pages[0].text, 'Hello from a text file');
});
