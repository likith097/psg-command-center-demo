/** Navigation destinations available in the demo workspace. */
export type Page =
  | 'Overview'
  | 'Clients'
  | 'Recruitment'
  | 'Operations'
  | 'Integrations'
  | 'Analytics'

/** A fictional organization requesting staffing support. */
export type Client = {
  id: number
  name: string
  sector: string
  contact: string
  status: string
}

/** Number of positions and job category requested by a client. */
export type Request = {
  id: number
  clientId: number
  role: string
  openings: number
  priority: string
  status: string
}

/** Applicant information and optional staffing-request assignment. */
export type Candidate = {
  id: number
  name: string
  requestId: number | null
  role: string
  stage: string
}

/** Work item shared by operations and compliance teams. */
export type Task = {
  id: number
  label: string
  team: string
  priority: string
  done: boolean
  candidateId?: number
}

/** Recent user action shown in the workspace activity feed. */
export type Log = {
  id: number
  message: string
  time: string
}

/** Entire browser-local demo state. Not a backend data model. */
export type Workspace = {
  clients: Client[]
  requests: Request[]
  candidates: Candidate[]
  tasks: Task[]
  log: Log[]
}

export type Modal = 'client' | 'request' | 'candidate' | null
