export function normalizeOptionName(value) {
  return value
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .map((segment, index) => (index === 0 ? segment : `${segment[0]?.toUpperCase() ?? ''}${segment.slice(1)}`))
    .join('');
}
