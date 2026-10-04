import React from "react";

type AiResponseTextProps = {
  content: string;
  className?: string;
};

/**
 * Keeps model output safe as plain text while giving common Markdown-like
 * structure (headings, bullets and paragraphs) a readable treatment.
 */
export const AiResponseText: React.FC<AiResponseTextProps> = ({ content, className }) => {
  const lines = content.trim().split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      blocks.push(<h3 key={`heading-${index}`}>{heading[1]}</h3>);
      index += 1;
      continue;
    }

    if (/^(?:[-*•]|\d+[.)])\s+/.test(line)) {
      const items: string[] = [];
      const start = index;
      while (index < lines.length && /^(?:[-*•]|\d+[.)])\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ""));
        index += 1;
      }
      blocks.push(<ul key={`list-${start}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>);
      continue;
    }

    const paragraph: string[] = [];
    const start = index;
    while (index < lines.length && lines[index].trim() && !/^(?:#{1,3}\s+|[-*•]|\d+[.)])\s+/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`paragraph-${start}`}>{paragraph.join(" ")}</p>);
  }

  return <div className={`ai-response-text${className ? ` ${className}` : ""}`}>{blocks}</div>;
};
