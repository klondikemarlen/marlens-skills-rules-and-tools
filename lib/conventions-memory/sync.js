import { Mnemopi } from "@oh-my-pi/pi-mnemopi"
import { IMPORT_OWNER } from "./source.js"

function metadata(record) {
  try {
    return JSON.parse(record.metadata_json ?? "{}")
  } catch {
    return {}
  }
}

function isOwned(record) {
  return (
    record.source === IMPORT_OWNER &&
    record.session_id === IMPORT_OWNER &&
    metadata(record).owner === IMPORT_OWNER
  )
}

export function synchronizeConventions(database, captured) {
  const memory = new Mnemopi({
    dbPath: database,
    sessionId: IMPORT_OWNER,
    noEmbeddings: true,
    llm: false,
    proactiveLinking: false,
    reconcile: false,
  })
  try {
    return memory.db.transaction(() => {
      const exported = memory.beam.exportToDict()
      const existing = new Map(exported.working_memory.map((record) => [record.id, record]))
      const episodicIds = new Set(exported.episodic_memory.map((record) => record.id))
      const desiredIds = new Set(captured.records.map((record) => record.id))
      const changes = []
      const counts = { inserted: 0, updated: 0, retired: 0, unchanged: 0 }

      for (const desired of captured.records) {
        const prior = existing.get(desired.id)
        if (episodicIds.has(desired.id) || (prior && !isOwned(prior))) {
          throw new Error(`Memory identity collision; refusing to overwrite ${desired.id}`)
        }
        if (
          prior &&
          prior.content === desired.content &&
          prior.metadata_json === desired.metadata_json &&
          !prior.valid_until &&
          !prior.superseded_by
        ) {
          counts.unchanged++
          continue
        }
        changes.push(desired)
        if (prior) counts.updated++
        else counts.inserted++
      }

      const retiredAt = new Date().toISOString()
      for (const prior of existing.values()) {
        if (!isOwned(prior) || desiredIds.has(prior.id) || prior.valid_until || prior.superseded_by)
          continue

        changes.push({ ...prior, valid_until: retiredAt })
        counts.retired++
      }
      if (changes.length > 0) {
        memory.beam.importFromDict({ working_memory: changes }, true)
      }
      return { ...counts, revision: captured.revision, sections: captured.records.length, database }
    })()
  } finally {
    memory.close()
  }
}
