export const LOBSTER_COLORS = ['amber', 'cyan', 'red'] as const;

export type LobsterColor = typeof LOBSTER_COLORS[number];

/**
 * Simple string hash to ensure stable colors for tags.
 * hash(tag) % LOBSTER_COLORS.length
 */
export function getStableColorForTag(tag: string): LobsterColor {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LOBSTER_COLORS.length;
  return LOBSTER_COLORS[index];
}

export function getRandomLobsterColor(): LobsterColor {
  const randomIndex = Math.floor(Math.random() * LOBSTER_COLORS.length);
  return LOBSTER_COLORS[randomIndex];
}

export function getTagColorClasses(tag: string): string {
  const color = getStableColorForTag(tag);
  return getLobsterColorClasses(color);
}

export function getLobsterColorClasses(color: LobsterColor): string {
  switch (color) {
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/70';
    case 'cyan':
      return 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700';
    case 'red':
      return 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
    default:
      return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
  }
}
