export function parseSetting(line) {
  const trimmedLine = line.trim()

  if (trimmedLine.length > 0) {
    if (!trimmedLine.startsWith("#")) {
      const separatorIndex = trimmedLine.indexOf("=")

      if (separatorIndex !== -1) {
        const key = trimmedLine.slice(0, separatorIndex).trim()

        if (key.length > 0) {
          const value = trimmedLine.slice(separatorIndex + 1).trim()

          return {
            key,
            value,
          }
        }

        throw new Error("Missing setting key")
      }

      throw new Error("Missing setting separator")
    }

    return null
  }

  return null
}

export default parseSetting
