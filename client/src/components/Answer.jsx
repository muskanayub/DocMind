// Renders the model's answer: paragraphs, bullet/numbered lists, **bold**, and clickable [n] citation chips.
const INLINE = /(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/g;
const CITE = /^\[(\d+(?:\s*,\s*\d+)*)\]$/;
const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

function Inline({ text, onCite }) {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;

    const match = part.match(CITE);
    if (match) {
      return match[1].split(',').map((raw, j) => {
        const n = Number(raw.trim());
        return (
          <button
            key={`${i}-${j}`}
            type="button"
            onClick={() => onCite(n)}
            aria-label={`Show source ${n}`}
            className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-mark px-1 font-sans text-[11px] font-semibold text-ink hover:ring-2 hover:ring-brand/40"
          >
            {n}
          </button>
        );
      });
    }
    return part;
  });
}

function toBlocks(text) {
  const blocks = [];
  let list = null;

  for (const line of text.split('\n')) {
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      if (!list || list.ordered !== ordered) {
        list = { type: 'list', ordered, items: [] };
        blocks.push(list);
      }
      list.items.push(line.replace(BULLET, '').replace(NUMBERED, ''));
    } else if (line.trim()) {
      list = null;
      blocks.push({ type: 'p', text: line.trim() });
    } else {
      list = null;
    }
  }
  return blocks;
}

export default function Answer({ text, onCite }) {
  return (
    <div className="space-y-3 font-serif text-[17px] leading-relaxed">
      {toBlocks(text).map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i}>
              <Inline text={block.text} onCite={onCite} />
            </p>
          );
        }
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag key={i} className={`space-y-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} onCite={onCite} />
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
