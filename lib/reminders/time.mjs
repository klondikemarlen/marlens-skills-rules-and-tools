function wallParts(instant, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant)

  const entries = parts
    .filter((part) => part.type !== "literal")
    .map((part) => {
      const value = Number(part.value)
      return [part.type, value]
    })
  return Object.fromEntries(entries)
}

function wallStamp(parts) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second ?? 0
  )
}

export function resolveDue(
  input,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date()
) {
  wallParts(now, timezone)
  const tomorrow = /^tomorrow at ([01]\d|2[0-3]):([0-5]\d)$/u.exec(input)
  let due

  if (tomorrow) {
    const local = wallParts(now, timezone)
    const nextDay = new Date(Date.UTC(local.year, local.month - 1, local.day + 1))
    const year = nextDay.getUTCFullYear()
    const month = nextDay.getUTCMonth() + 1
    const day = nextDay.getUTCDate()
    const hour = Number(tomorrow[1])
    const minute = Number(tomorrow[2])
    const target = {
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
    }
    const targetStamp = wallStamp(target)
    const offsets = new Set()

    for (let hours = -36; hours <= 36; hours += 6) {
      const sample = targetStamp + hours * 3_600_000
      offsets.add(wallStamp(wallParts(new Date(sample), timezone)) - sample)
    }

    const candidates = [...offsets]
      .map((offset) => targetStamp - offset)
      .filter((stamp) => wallStamp(wallParts(new Date(stamp), timezone)) === targetStamp)

    if (candidates.length !== 1) {
      throw new Error(
        "That local time is nonexistent or ambiguous at a clock change. Use an ISO date/time with an explicit offset."
      )
    }

    due = new Date(candidates[0])
  } else {
    const iso =
      /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u.exec(
        input
      )
    if (!iso)
      throw new Error(
        "Use exactly 'tomorrow at HH:MM' or YYYY-MM-DDTHH:MM[:SS]Z / ±HH:MM. Include an IANA timezone for tomorrow when needed."
      )

    const calendar = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    if (
      calendar.getUTCFullYear() !== Number(iso[1]) ||
      calendar.getUTCMonth() + 1 !== Number(iso[2]) ||
      calendar.getUTCDate() !== Number(iso[3])
    ) {
      throw new Error("Invalid calendar date.")
    }

    due = new Date(input)
  }

  if (!Number.isFinite(due.getTime()) || due <= now)
    throw new Error("The reminder must be in the future.")
  const dueAt = due.toISOString()
  const localTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "long",
  }).format(due)

  return {
    dueAt,
    timezone,
    localTime,
  }
}
