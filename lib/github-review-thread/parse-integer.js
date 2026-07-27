export function parseInteger(raw, label) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/u.test(raw)) {
    throw new Error(`Expected positive integer for ${label}.`);
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid integer for ${label}: ${raw}`);
  }
  return value;
}
