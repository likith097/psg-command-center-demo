import {
  CREDENTIAL_STORAGE_KEY,
  loadCredentials,
  credentialStatus,
  type Credential,
} from './credentialUtils'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

type Candidate = {
  id: number
  name: string
}

type Props = {
  candidates: Candidate[]
}

export default function CredentialTracker({ candidates }: Props) {
  const [credentials, setCredentials] = useState<Credential[]>(
    loadCredentials
  )

  const [candidateId, setCandidateId] = useState('')
  const [credentialName, setCredentialName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(
        CREDENTIAL_STORAGE_KEY,
        JSON.stringify(credentials)
      )
    } catch {
      // Browser storage may be unavailable.
    }
  }, [credentials])

  const counts = useMemo(() => ({
    expired: credentials.filter(
      item => credentialStatus(item.expirationDate) === 'Expired'
    ).length,
    expiring: credentials.filter(
      item => credentialStatus(item.expirationDate) === 'Expiring soon'
    ).length,
    valid: credentials.filter(
      item => credentialStatus(item.expirationDate) === 'Valid'
    ).length,
  }), [credentials])

  function addCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const selectedId = Number(candidateId)

    if (
      !candidates.some(candidate => candidate.id === selectedId) ||
      !credentialName.trim()
    ) return

    const newCredential: Credential = {
      id: crypto.randomUUID(),
      candidateId: selectedId,
      name: credentialName.trim(),
      expirationDate,
    }

    setCredentials(current => [...current, newCredential])
    setCredentialName('')
    setExpirationDate('')
  }

  function deleteCredential(id: string) {
    setCredentials(current =>
      current.filter(item => item.id !== id)
    )
  }

  return (
    <section className="panel credential-tracker">
      <div className="panel-head">
        <div>
          <h2>Credential expiration tracking</h2>
          <p>Monitor candidate credentials using fictional demo records.</p>
        </div>
        <span className="pill green">
          <ShieldCheck size={13} /> Demo tracking
        </span>
      </div>

      <div className="credential-summary">
        <div>
          <AlertTriangle size={19} />
          <strong>{counts.expired}</strong>
          <span>Expired</span>
        </div>
        <div>
          <CalendarClock size={19} />
          <strong>{counts.expiring}</strong>
          <span>Expiring soon</span>
        </div>
        <div>
          <CheckCircle2 size={19} />
          <strong>{counts.valid}</strong>
          <span>Valid</span>
        </div>
      </div>

      <form className="credential-form" onSubmit={addCredential}>
        <label>
          Candidate
          <select
            required
            value={candidateId}
            onChange={event => setCandidateId(event.target.value)}
          >
            <option value="">Select candidate</option>
            {candidates.map(candidate => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Credential name
          <input
            required
            value={credentialName}
            onChange={event => setCredentialName(event.target.value)}
            placeholder="RN License, CPR, BLS..."
          />
        </label>

        <label>
          Expiration date
          <input
            type="date"
            value={expirationDate}
            onChange={event => setExpirationDate(event.target.value)}
          />
        </label>

        <button type="submit" className="primary-btn">
          <Plus size={16} /> Add credential
        </button>
      </form>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>CANDIDATE</th>
              <th>CREDENTIAL</th>
              <th>EXPIRATION</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map(item => {
              const status = credentialStatus(item.expirationDate)
              const candidate = candidates.find(
                person => person.id === item.candidateId
              )

              return (
                <tr key={item.id}>
                  <td className="strong">
                    {candidate?.name ?? 'Unknown candidate'}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.expirationDate || 'Not provided'}</td>
                  <td>
                    <span className={`credential-status ${status === 'Expired'
                      ? 'expired'
                      : status === 'Expiring soon'
                        ? 'expiring'
                        : status === 'Valid'
                          ? 'valid'
                          : 'missing'
                      }`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="credential-delete"
                      onClick={() => deleteCredential(item.id)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {credentials.length === 0 && (
          <p className="empty">
            No credentials recorded yet. Add a fictional credential
            to test expiration tracking.
          </p>
        )}
      </div>
    </section>
  )
}
