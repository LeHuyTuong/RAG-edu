const TECHNICAL_METADATA_PATTERNS = [
  /\(\s*sourceType\s*(?:=|:)\s*[^)]*\)/gi,
  /\(\s*sourceId\s*(?:=|:)\s*[^)]*\)/gi,
  /\bsourceType\s*(?:=|:)\s*[A-Za-z0-9_./-]+/gi,
  /\bsourceId\s*(?:=|:)\s*[A-Za-z0-9_./-]+/gi,
];

/**
 * Converts agent output into user-facing plain text without changing its meaning.
 * Technical source metadata stays available in the citation objects and is only
 * removed from the text shown inside the chat bubble.
 */
export function normalizeAgentResponse(value: string): string {
  let normalized = value;

  for (const pattern of TECHNICAL_METADATA_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  return normalized
    .replace(/```(?:[\w+-]+)?\s*([\s\S]*?)```/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^\s*([-*_]){3,}\s*$/gm, "")
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}
