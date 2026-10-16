export type Credential = {
  id: string
  candidateId: number
  name: string
  expirationDate: string
}


export const CREDENTIAL_STORAGE_KEY = 'psg-phase6-credentials'

export function loadCredentials(): Credential[] {
  try {
    const saved = localStorage.getItem(CREDENTIAL_STORAGE_KEY)
    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is Credential =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.candidateId === 'number' &&
        typeof item.name === 'string' &&
        typeof item.expirationDate === 'string'
    )
  } catch {
    return []
  }
}

export function credentialStatus(date: string) {
  if (!date) return 'Missing date'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiration = new Date(`${date}T00:00:00`)
  if (Number.isNaN(expiration.getTime())) return 'Missing date'

  const days = Math.round(
    (expiration.getTime() - today.getTime()) / 86400000
  )

  if (days < 0) return 'Expired'
  if (days <= 30) return 'Expiring soon'
  return 'Valid'
}
