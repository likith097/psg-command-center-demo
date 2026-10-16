
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Users,
  X,
} from 'lucide-react'
import {
  loadCredentials,
  credentialStatus,
} from './credentialUtils'
import './Phase6Notifications.css'

type Candidate = {
  id: number
  name: string
  requestId: number | null
  role: string
  stage: string
}

type StaffingRequest = {
  id: number
  clientId: number
  role: string
  openings: number
  priority: string
  status: string
}

type Client = {
  id: number
  name: string
}

type Task = {
  id: number
  label: string
  team: string
  priority: string
  done: boolean
  candidateId?: number
}

type Props = {
  clients: Client[]
  requests: StaffingRequest[]
  candidates: Candidate[]
  tasks: Task[]
  onNavigate: (page: 'Clients' | 'Recruitment' | 'Operations') => void
}

type Alert = {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium'
  page: 'Clients' | 'Recruitment' | 'Operations'
}

const DISMISSED_KEY = 'psg-phase6-dismissed'

function readDismissed(): string[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(DISMISSED_KEY) || '[]'
    )

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

export default function Phase6Notifications({
  clients,
  requests,
  candidates,
  tasks,
  onNavigate,
}: Props) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>(readDismissed)
  const [credentialVersion, setCredentialVersion] = useState(0)

  // Refresh credential alerts when the notification panel opens.
  function toggleNotifications() {
    if (!open) {
      setCredentialVersion(value => value + 1)
    }
    setOpen(value => !value)
  }

  const alerts = useMemo<Alert[]>(() => {
    const results: Alert[] = []

    // 1. Compliance tasks awaiting action
    for (const task of tasks) {
      if (task.done) continue

      if (task.team === 'Compliance') {
        results.push({
          id: `compliance-${task.id}`,
          title: 'Credential verification required',
          description: task.label,
          severity: 'high',
          page: 'Operations',
        })
      } else if (task.priority === 'High') {
        results.push({
          id: `task-${task.id}`,
          title: 'High-priority task pending',
          description: task.label,
          severity: 'high',
          page: 'Operations',
        })
      }
    }

    // 2. Open staffing requests with unfilled positions
    for (const request of requests) {
      if (request.status !== 'Open') continue

      const placed = candidates.filter(
        candidate =>
          candidate.requestId === request.id &&
          candidate.stage === 'Placed'
      ).length

      const unfilled = Math.max(0, request.openings - placed)

      if (unfilled === 0) continue

      const client = clients.find(
        item => item.id === request.clientId
      )

      results.push({
        id: `staffing-${request.id}-${unfilled}`,
        title: `${unfilled} unfilled staffing position${unfilled === 1 ? '' : 's'}`,
        description: `${client?.name ?? 'Unknown client'} — ${request.role}`,
        severity: request.priority === 'High' ? 'high' : 'medium',
        page: 'Clients',
      })
    }

    // 3. Candidates requiring recruitment follow-up
    for (const candidate of candidates) {
      if (
        candidate.stage !== 'Applied' &&
        candidate.stage !== 'Screening'
      ) continue

      results.push({
        id: `recruitment-${candidate.id}-${candidate.stage}`,
        title: 'Recruitment follow-up',
        description: `${candidate.name} — ${candidate.stage}`,
        severity: 'medium',
        page: 'Recruitment',
      })
    }

    // 4. Candidate credential expiration alerts
    const credentials = credentialVersion >= 0 ? loadCredentials() : []

    for (const credential of credentials) {
      const status = credentialStatus(credential.expirationDate)

      if (status === 'Valid') continue

      const candidate = candidates.find(
        person => person.id === credential.candidateId
      )

      const candidateName = candidate?.name ?? 'Unknown candidate'

      results.push({
        id: `credential-alert-${credential.id}-${credential.expirationDate}`,
        title:
          status === 'Expired'
            ? 'Expired credential'
            : status === 'Expiring soon'
              ? 'Credential expiring soon'
              : 'Credential expiration date missing',
        description: `${candidateName} — ${credential.name}${credential.expirationDate
          ? ` (expires ${credential.expirationDate})`
          : ''
          }`,
        severity: status === 'Expired' ? 'high' : 'medium',
        page: 'Operations',
      })
    }
    return results.sort(
      (a, b) =>
        Number(b.severity === 'high') -
        Number(a.severity === 'high')
    )
  }, [clients, requests, candidates, tasks, credentialVersion])

  const activeAlerts = alerts.filter(
    alert => !dismissed.includes(alert.id)
  )

  const highPriority = activeAlerts.filter(
    alert => alert.severity === 'high'
  ).length

  function dismiss(id: string) {
    const next = [...new Set([...dismissed, id])]
    setDismissed(next)

    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
    } catch {
      // Browser storage may be unavailable.
    }
  }

  function resetDismissed() {
    setDismissed([])

    try {
      localStorage.removeItem(DISMISSED_KEY)
    } catch {
      // Browser storage may be unavailable.
    }
  }

  function navigate(page: Alert['page']) {
    setOpen(false)
    onNavigate(page)
  }

  return (
    <div className="psg-notifications">
      <button
        type="button"
        className="psg-notification-trigger"
        aria-label={`Notifications: ${activeAlerts.length} active`}
        aria-expanded={open}
        onClick={toggleNotifications}
      >
        <Bell size={20} />

        {activeAlerts.length > 0 && (
          <span className="psg-notification-count">
            {activeAlerts.length > 99 ? '99+' : activeAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="psg-notification-panel">
          <div className="psg-notification-header">
            <div>
              <h3>Notification Center</h3>
              <p>Automated demo workflow alerts</p>
            </div>

            <button
              type="button"
              className="psg-notification-close"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="psg-notification-summary">
            <div>
              <Bell size={16} />
              <strong>{activeAlerts.length}</strong>
              <span>Active</span>
            </div>

            <div>
              <AlertTriangle size={16} />
              <strong>{highPriority}</strong>
              <span>High priority</span>
            </div>
          </div>

          <div className="psg-notification-list">
            {activeAlerts.length === 0 ? (
              <div className="psg-notification-empty">
                <CheckCircle2 size={30} />
                <strong>All caught up</strong>
                <p>No active workflow alerts.</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div
                  className="psg-notification-item"
                  key={alert.id}
                >
                  <div
                    className={`psg-notification-icon ${alert.severity}`}
                  >
                    {alert.page === 'Clients' ? (
                      <ClipboardList size={18} />
                    ) : alert.page === 'Recruitment' ? (
                      <Users size={18} />
                    ) : (
                      <CalendarClock size={18} />
                    )}
                  </div>

                  <div className="psg-notification-details">
                    <strong>{alert.title}</strong>
                    <p>{alert.description}</p>

                    <div className="psg-notification-actions">
                      <button
                        type="button"
                        onClick={() => navigate(alert.page)}
                      >
                        Review
                      </button>

                      <button
                        type="button"
                        onClick={() => dismiss(alert.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="psg-notification-footer">
            <span>Updates from local workspace records</span>

            <button
              type="button"
              onClick={resetDismissed}
            >
              Restore dismissed
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
