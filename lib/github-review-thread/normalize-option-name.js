export function normalizeOptionName(value) {
  const segments = value.toLowerCase().split('-').filter(Boolean);
  let normalized = '';
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    normalized += index === 0
      ? segment
      : `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`;
  }
  return normalized;
}
