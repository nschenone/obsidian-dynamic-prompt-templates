export interface MarkdownSegment {
  type: "text" | "code";
  language?: string;
  content: string;
}

export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return match ? content.slice(match[0].length) : content;
}

export function splitMarkdownSegments(markdown: string): MarkdownSegment[] {
  const lines = markdown.split("\n");
  const segments: MarkdownSegment[] = [];
  let textBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;
  const flushText = () => { if (textBuffer.length) { segments.push({ type: "text", content: textBuffer.join("\n") }); textBuffer = []; } };
  const flushCode = () => { if (codeBuffer.length) { segments.push({ type: "code", language: codeLanguage, content: codeBuffer.join("\n") }); codeBuffer = []; codeLanguage = ""; } };
  for (const line of lines) {
    if (!inCodeBlock) {
      const openingMatch = line.match(/^```([^\s`]*)/);
      if (openingMatch) { flushText(); inCodeBlock = true; codeLanguage = openingMatch[1] ?? ""; codeBuffer.push(line); }
      else textBuffer.push(line);
    } else {
      codeBuffer.push(line);
      if (line.startsWith("```")) { inCodeBlock = false; flushCode(); }
    }
  }
  if (inCodeBlock) textBuffer.push(codeBuffer.join("\n")); else flushCode();
  flushText();
  return segments;
}

export function extractFenceBody(segmentContent: string): string {
  const lines = segmentContent.split("\n");
  return lines.length <= 2 ? "" : lines.slice(1, -1).join("\n").trim();
}

export function warningCallout(message: string): string { return `> [!warning] ${message}`; }
