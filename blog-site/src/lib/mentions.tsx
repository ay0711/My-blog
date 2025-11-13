import Link from 'next/link';

/**
 * Parse text and convert @mentions to clickable links
 * @param text - The text content to parse
 * @returns JSX with linked mentions
 */
export function parseMentions(text: string): React.ReactNode {
  if (!text) return text;

  // Match @username (alphanumeric + underscore, 3-20 chars)
  const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the mention as a link
    const username = match[1];
    parts.push(
      <Link
        key={`mention-${match.index}`}
        href={`/user/${username.toLowerCase()}`}
        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Extract all @mentions from text
 * @param text - The text to extract mentions from
 * @returns Array of usernames (without @)
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Highlight @mentions in text (for textarea/input previews)
 * @param text - The text to highlight
 * @returns HTML string with highlighted mentions
 */
export function highlightMentions(text: string): string {
  if (!text) return text;

  const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g;
  return text.replace(
    mentionRegex,
    '<span class="text-indigo-600 dark:text-indigo-400 font-medium">@$1</span>'
  );
}
