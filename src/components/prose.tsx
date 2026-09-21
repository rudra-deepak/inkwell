import type { ReactNode } from "react";

/* A tiny, dependency-free markdown renderer. Supports headings, paragraphs,
   lists, quotes, fenced code, bold/italic, inline code and links. Inline HTML
   is never injected, so post bodies cannot script the page. */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${index++}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const link = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(token);
      nodes.push(
        <a key={key} href={link?.[2] ?? "#"} target="_blank" rel="noreferrer noopener">
          {link?.[1] ?? token}
        </a>,
      );
    } else {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function Prose({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text, `p-${blocks.length}`)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const key = `l-${blocks.length}`;
    blocks.push(
      list.ordered ? (
        <ol key={key}>
          {list.items.map((item, i) => (
            <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key}>
          {list.items.map((item, i) => (
            <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  const flushQuote = () => {
    if (!quote.length) return;
    const text = quote.join(" ");
    blocks.push(
      <blockquote key={`q-${blocks.length}`}>{renderInline(text, `q-${blocks.length}`)}</blockquote>,
    );
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");

    if (code) {
      if (line.trim().startsWith("```")) {
        blocks.push(
          <pre
            key={`c-${blocks.length}`}
            className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed text-slate-200"
          >
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      } else {
        code.push(rawLine);
      }
      continue;
    }

    if (line.trim().startsWith("```")) {
      flushAll();
      code = [];
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const text = heading[2];
      const key = `h-${blocks.length}`;
      if (level <= 1) blocks.push(<h2 key={key}>{renderInline(text, key)}</h2>);
      else if (level === 2) blocks.push(<h2 key={key}>{renderInline(text, key)}</h2>);
      else blocks.push(<h3 key={key}>{renderInline(text, key)}</h3>);
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  if (code) {
    blocks.push(
      <pre
        key={`c-${blocks.length}`}
        className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed text-slate-200"
      >
        <code>{code.join("\n")}</code>
      </pre>,
    );
  }
  flushAll();

  return <div className="article-body">{blocks}</div>;
}
