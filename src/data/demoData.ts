import type { Workspace } from '../types/workspace'

/** Fictional records used only when the browser has no saved workspace. */
export const stages = ['Applied', 'Screening', 'Interview', 'Credentialing', 'Placed']

export const seed: Workspace = {
  clients: [
    { id: 1, name: 'Northstar Medical Center', sector: 'Healthcare', contact: 'A. Morgan', status: 'Active' },
    { id: 2, name: 'Summit Care Network', sector: 'Healthcare', contact: 'J. Davis', status: 'Active' },
    { id: 3, name: 'Civic Support Agency', sector: 'Government', contact: 'R. Parker', status: 'Onboarding' },
    { id: 4, name: 'Evergreen Health Partners', sector: 'Healthcare', contact: 'M. Chen', status: 'Active' },
  ],
  requests: [
    { id: 101, clientId: 1, role: 'Registered Nurse', openings: 12, priority: 'High', status: 'Open' },
    { id: 102, clientId: 2, role: 'Medical Assistant', openings: 8, priority: 'Medium', status: 'Open' },
    { id: 103, clientId: 3, role: 'Administrative Specialist', openings: 5, priority: 'Medium', status: 'Open' },
    { id: 104, clientId: 4, role: 'Care Coordinator', openings: 6, priority: 'High', status: 'Open' },
  ],
  candidates: [
    { id: 201, name: 'Jordan Ellis', requestId: 101, role: 'Registered Nurse', stage: 'Screening' },
    { id: 202, name: 'Taylor Brooks', requestId: 102, role: 'Medical Assistant', stage: 'Interview' },
    { id: 203, name: 'Alex Rivera', requestId: 104, role: 'Care Coordinator', stage: 'Credentialing' },
    { id: 204, name: 'Morgan Lee', requestId: 103, role: 'Administrative Specialist', stage: 'Placed' },
    { id: 205, name: 'Casey Bennett', requestId: 101, role: 'Registered Nurse', stage: 'Applied' },
  ],
  tasks: [
    { id: 301, label: 'Verify credential documents — Alex Rivera', team: 'Compliance', priority: 'High', done: false, candidateId: 203 },
    { id: 302, label: 'Review new staffing requests', team: 'Account Management', priority: 'High', done: false },
    { id: 303, label: 'Coordinate candidate interviews', team: 'Recruitment', priority: 'Medium', done: true },
    { id: 304, label: 'Prepare onboarding packets', team: 'Operations', priority: 'Medium', done: false },
  ],
  log: [{ id: 1, message: 'Demo workspace initialized', time: 'Sample activity' }],
}

/** Illustrative history; these values are not derived from live records. */
export const chartData = [
  { month: 'May', placements: 18 }, { month: 'Jun', placements: 24 },
  { month: 'Jul', placements: 22 }, { month: 'Aug', placements: 31 },
  { month: 'Sep', placements: 36 }, { month: 'Oct', placements: 42 },
]
