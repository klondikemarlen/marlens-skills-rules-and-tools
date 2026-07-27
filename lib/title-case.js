const DEFAULT_PRESERVED_WORDS = ['GitHub'];
const MINOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'nor',
  'of',
  'on',
  'or',
  'the',
  'to',
  'via',
  'up',
  'with',
]);
export function isTitleCase(title, { preserve = [] } = {}) {
  const preservedWords = new Set([...DEFAULT_PRESERVED_WORDS, ...preserve]);
  if (typeof title !== 'string' || title.trim() === '') return false;

  const words = title.trim().split(/\s+/u);
  return words.every((word, index) => {
    if (preservedWords.has(word)) return true;

    const parts = word.split('-');
    return parts.every((part, partIndex) => isTitleCasePart(
      part,
      index === 0 && partIndex === 0,
      index === words.length - 1 && partIndex === parts.length - 1,
      preservedWords,
    ));
  });
}

function isTitleCasePart(part, isFirst, isLast, preserve) {
  const punctuation = part.match(/^(?<prefix>[^\p{L}\p{N}]*)(?<word>[\p{L}\p{N}][\p{L}\p{N}'’._/]*)(?<suffix>[^\p{L}\p{N}]*)$/u);
  if (!punctuation) return false;

  const { word } = punctuation.groups;
  if (preserve.has(word) || isAcronym(word)) return true;
  if (!/[\p{L}]/u.test(word)) return true;

  const lower = word.toLocaleLowerCase('en-US');
  if (!isFirst && !isLast && MINOR_WORDS.has(lower)) return word === lower;

  return word[0] === word[0].toLocaleUpperCase('en-US')
    && word.slice(1) === word.slice(1).toLocaleLowerCase('en-US');
}

function isAcronym(word) {
  return /[A-Z]/u.test(word) && word === word.toLocaleUpperCase('en-US');
}
