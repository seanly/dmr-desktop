export function isLocalFilePath(text: string): boolean {
  return (
    text.startsWith('file://') ||
    text.startsWith('/') ||
    text.startsWith('~/')
  );
}

export function normalizeFilePath(path: string): string {
  if (path.startsWith('file://')) {
    return path.slice(7);
  }
  return path;
}

export function extractFileLinks(text: string): string[] {
  const patterns = [
    /file:\/\/[^\s)]+/g,
    /(?:^|\s)(\/[^\s)]+)/g,
    /(?:^|\s)(~\/[^\s)]+)/g,
  ];

  const links: string[] = [];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      links.push(match[0].trim());
    }
  }

  return links;
}
