export function normalizeRepository(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.toLowerCase().match(/^([a-z0-9_.-]+)\/([a-z0-9_.-]+)$/u);
  return match ? `${match[1]}/${match[2]}` : undefined;
}
