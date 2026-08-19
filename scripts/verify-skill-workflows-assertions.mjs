export function requireText(text, requiredText, message, fail) {
  if (!text.includes(requiredText)) fail(message);
}

export function requireEvery(text, requiredTexts, messageFor, fail) {
  for (const requiredText of requiredTexts) {
    requireText(text, requiredText, messageFor(requiredText), fail);
  }
}
