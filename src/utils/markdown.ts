import moment from "moment";
import type { WeekStartMode } from "../contracts";

export interface MarkdownSegment {
  type: "text" | "code";
  language?: string;
  content: string;
}

export function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n")) {
    return content;
  }

  const closingFenceIndex = content.indexOf("\n---\n", 4);
  if (closingFenceIndex === -1) {
    return content;
  }

  return content.slice(closingFenceIndex + 5);
}

function createWeekAwareMoment(referenceDate: Date, weekStart: WeekStartMode): moment.Moment {
  if (weekStart === "sunday") {
    return moment(referenceDate);
  }

  const baseLocale = moment.locale();
  const mondayLocale = `${baseLocale}-dynamic-prompt-monday`;
  if (!moment.locales().includes(mondayLocale)) {
    moment.defineLocale(mondayLocale, {
      parentLocale: baseLocale,
      week: { dow: 1, doy: 4 }
    });
  }

  return moment(referenceDate).locale(mondayLocale);
}

export function resolveDateTokens(content: string, referenceDate: Date, weekStart: WeekStartMode = "sunday"): string {
  return content.replace(/\{\{([^{}]+)\}\}/g, (_match, token: string) => {
    return createWeekAwareMoment(referenceDate, weekStart).format(token.trim());
  });
}

export function splitMarkdownSegments(markdown: string): MarkdownSegment[] {
  const lines = markdown.split("\n");
  const segments: MarkdownSegment[] = [];
  let textBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushText = () => {
    if (textBuffer.length > 0) {
      segments.push({ type: "text", content: textBuffer.join("\n") });
      textBuffer = [];
    }
  };

  const flushCode = () => {
    if (codeBuffer.length > 0) {
      segments.push({ type: "code", language: codeLanguage, content: codeBuffer.join("\n") });
      codeBuffer = [];
      codeLanguage = "";
    }
  };

  for (const line of lines) {
    if (!inCodeBlock) {
      const openingMatch = line.match(/^```([^\s`]*)/);
      if (openingMatch) {
        flushText();
        inCodeBlock = true;
        codeLanguage = openingMatch[1] ?? "";
        codeBuffer.push(line);
      } else {
        textBuffer.push(line);
      }
      continue;
    }

    codeBuffer.push(line);
    if (line.startsWith("```")) {
      inCodeBlock = false;
      flushCode();
    }
  }

  if (inCodeBlock) {
    textBuffer.push(codeBuffer.join("\n"));
  } else {
    flushCode();
  }
  flushText();
  return segments;
}

export function extractFenceBody(segmentContent: string): string {
  const lines = segmentContent.split("\n");
  if (lines.length <= 2) {
    return "";
  }

  return lines.slice(1, -1).join("\n").trim();
}

export function normalizeHeadingForMatch(heading: string): string {
  return heading.trim().replace(/\s+/g, " ").toLowerCase();
}

export function extractHeadingSection(markdownBody: string, heading: string): string | null {
  const lines = markdownBody.split("\n");
  const target = normalizeHeadingForMatch(heading);
  let startIndex = -1;
  let headingLevel = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(/^(#{1,6})\s+(.*)$/);
    if (!match) {
      continue;
    }

    const normalized = normalizeHeadingForMatch(match[2]);
    if (normalized === target) {
      startIndex = index;
      headingLevel = match[1].length;
      break;
    }
  }

  if (startIndex === -1) {
    return null;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = lines[index]?.match(/^(#{1,6})\s+(.*)$/);
    if (!match) {
      continue;
    }

    if (match[1].length <= headingLevel) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n").trimEnd();
}

export function warningCallout(message: string): string {
  return `> [!warning] ${message}`;
}
