import type { Candidate, Modal, Page, Request, Workspace } from './types/workspace'
import { chartData, stages } from './data/demoData'
import { createDemoWorkspace, loadWorkspace, saveWorkspace } from './utils/workspaceStorage'
import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Cloud, Command, Database, LayoutDashboard, Menu, Plus, Search, Settings2, ShieldCheck, TrendingUp, Users, Workflow, X, RotateCcw, Link2, Clock3 } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './App.css'
import CredentialTracker from './CredentialTracker'
import './CredentialTracker.css'
import Phase6Notifications from './Phase6Notifications'

/** Sidebar destinations and their icons. */
const nav: { title: Page; icon: typeof LayoutDashboard }[] = [
  { title: 'Overview', icon: LayoutDashboard }, { title: 'Clients', icon: Building2 },
  { title: 'Recruitment', icon: Users }, { title: 'Operations', icon: ClipboardList },
  { title: 'Integrations', icon: Workflow }, { title: 'Analytics', icon: Activity },
]
/**
 * Top-level demo workspace.
 *
 * This component coordinates navigation and browser-local state. The shared
 * contracts, seed records, and persistence logic live in separate modules.
 * The interface is a prototype, not a production healthcare system.
 */
function App() {
  // Navigation, demo records, and form state.
  const [page, setPage] = useState<Page>('Overview')
  const [data, setData] = useState<Workspace>(loadWorkspace)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [name, setName] = useState('')
  const [detail, setDetail] = useState('')
  const [selectedClient, setSelectedClient] = useState('1')
  const [selectedRequest, setSelectedRequest] = useState('')
  const [openings, setOpenings] = useState('1')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    saveWorkspace(data)
  }, [data])
  // Derived staffing counts are recalculated whenever demo records change.
  const clientName = (id: number) => data.clients.find(c => c.id === id)?.name ?? 'Unknown client'
  const requestById = (id: number | null) => data.requests.find(r => r.id === id)
  const candidateClient = (c: Candidate) => c.requestId === null ? 'Unassigned' : clientName(requestById(c.requestId)?.clientId ?? -1)
  const openRequests = data.requests.filter(r => r.status === 'Open')
  const totalOpenings = openRequests.reduce((sum, r) => sum + r.openings, 0)
  const assigned = data.candidates.filter(c => c.requestId !== null).length
  const placedOnRequests = data.candidates.filter(c => c.stage === 'Placed' && c.requestId !== null).length
  const totalRequested = data.requests.reduce((sum, r) => sum + r.openings, 0)
  const fulfillment = totalRequested ? Math.round(placedOnRequests / totalRequested * 100) : 0
  const requestMetrics = (r: Request) => {
    const linked = data.candidates.filter(c => c.requestId === r.id)
    const filled = linked.filter(c => c.stage === 'Placed').length
    return { assigned: linked.length, filled, percentage: r.openings ? Math.min(100, Math.round(filled / r.openings * 100)) : 0 }
  }
  const inPipeline = data.candidates.filter(c => c.stage !== 'Placed').length
  // User actions update the local workspace and append an activity entry.
  const toast = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3500) }
  const update = (message: string, change: (current: Workspace) => Workspace) => {
    setData(current => ({ ...change(current), log: [{ id: Date.now(), message, time: new Date().toLocaleString() }, ...current.log].slice(0, 30) }))
    toast(message)
  }
  const go = (next: Page) => { setPage(next); setQuery(''); setMobileMenu(false) }
  const showModal = (kind: Modal, clientId?: number) => {
    setName(''); setDetail(''); setOpenings('1')
    setSelectedClient(String(clientId ?? data.clients[0]?.id ?? ''))
    setSelectedRequest(String(openRequests[0]?.id ?? ''))
    setModal(kind)
  }
  const addRecord = () => {
    if (!name.trim() || !modal) return
    const id = Date.now()
    if (modal === 'client') update(`Client added: ${name.trim()}`, d => ({ ...d, clients: [...d.clients, { id, name: name.trim(), sector: detail.trim() || 'Healthcare', contact: 'Unassigned', status: 'Onboarding' }] }))
    if (modal === 'request') {
      const clientId = Number(selectedClient)
      if (!data.clients.some(c => c.id === clientId)) return
      const count = Math.max(1, Math.floor(Number(openings) || 1))
      update(`Staffing request created: ${name.trim()} for ${clientName(clientId)}`, d => ({ ...d, requests: [...d.requests, { id, clientId, role: name.trim(), openings: count, priority: 'Medium', status: 'Open' }] }))
    }
    if (modal === 'candidate') {
      const req = data.requests.find(r => r.id === Number(selectedRequest))
      update(`Candidate added: ${name.trim()}`, d => ({ ...d, candidates: [...d.candidates, { id, name: name.trim(), requestId: req?.id ?? null, role: req?.role ?? (detail.trim() || 'Unassigned'), stage: 'Applied' }] }))
    }
    setModal(null)
  }
  const changeStage = (candidate: Candidate, stage: string) => {
    if (candidate.stage === stage) return
    update(`${candidate.name} moved to ${stage}`, d => {
      const tasks = stage === 'Credentialing' && !d.tasks.some(t => t.candidateId === candidate.id)
        ? [...d.tasks, { id: Date.now(), label: `Verify credential documents — ${candidate.name}`, team: 'Compliance', priority: 'High', done: false, candidateId: candidate.id }]
        : d.tasks
      return { ...d, candidates: d.candidates.map(c => c.id === candidate.id ? { ...c, stage } : c), tasks }
    })
  }
  const assignCandidate = (candidate: Candidate, requestValue: string) => {
    const requestId = requestValue === '' ? null : Number(requestValue)
    const request = data.requests.find(r => r.id === requestId)
    if (requestId !== null && (!request || request.status !== 'Open')) return
    if (candidate.requestId === requestId) return
    const destination = request ? `${clientName(request.clientId)} — ${request.role} (#${request.id})` : 'Unassigned'
    update(`${candidate.name} assigned to ${destination}`, d => ({
      ...d,
      candidates: d.candidates.map(c => c.id === candidate.id
        ? { ...c, requestId, role: request?.role ?? c.role }
        : c),
    }))
  }
  const filteredClients = useMemo(() => data.clients.filter(c => `${c.name} ${c.sector} ${c.contact}`.toLowerCase().includes(query.toLowerCase())), [data.clients, query])
  const filteredCandidates = data.candidates.filter(c => `${c.name} ${c.role} ${c.stage} ${candidateClient(c)}`.toLowerCase().includes(query.toLowerCase()))
  // Reusable visual sections shared across overview and analytics pages.
  const graph = <div className="graph">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 12, right: 14, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2179d6" stopOpacity={0.24} />
            <stop offset="100%" stopColor="#2179d6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e9edf3" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a95a5', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a95a5', fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="placements" name="Illustrative placements" stroke="#2478cf" strokeWidth={3} fill="url(#areaFill)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
  const candidateTable = (items: Candidate[]) => <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>CANDIDATE</th>
          <th>ROLE</th>
          <th>CLIENT</th>
          <th>STAFFING REQUEST / ASSIGNMENT</th>
          <th>PIPELINE STAGE</th>
        </tr>
      </thead>
      <tbody>{items.map(c => <tr key={c.id}>
        <td>
          <div className="person">
            <span className="avatar">{c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span className="strong">{c.name}</span>
          </div>
        </td>
        <td>{c.role}</td>
        <td>{candidateClient(c)}</td>
        <td>
          <select aria-label={`Staffing request for ${c.name}`} className="stage-select assignment-select" value={c.requestId ?? ''} onChange={e => assignCandidate(c, e.target.value)}>
            <option value="">Unassigned</option>{data.requests.filter(r => r.status === 'Open' || r.id === c.requestId).map(r => <option key={r.id} value={r.id}>#{r.id} · {clientName(r.clientId)} — {r.role} · {requestMetrics(r).assigned}/{r.openings} assigned · {requestMetrics(r).filled} placed</option>)}</select>
        </td>
        <td>
          <select aria-label={`Stage for ${c.name}`} className="stage-select" value={c.stage} onChange={e => changeStage(c, e.target.value)}>{stages.map(s => <option key={s}>{s}</option>)}</select>
        </td>
      </tr>)}</tbody>
    </table>{items.length === 0 && <p className="empty">No candidates match.</p>}</div>
  const requestTable = (items: Request[]) => <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>CLIENT / REQUEST</th>
          <th>REQUESTED ROLE</th>
          <th>POSITIONS</th>
          <th>ASSIGNED</th>
          <th>PLACED</th>
          <th>FULFILLMENT</th>
          <th>STATUS</th>
        </tr>
      </thead>
      <tbody>{items.map(r => {
        const m = requestMetrics(r); return <tr key={r.id}>
          <td>
            <div className="request-client">
              <span className="strong">{clientName(r.clientId)}</span>
              <small>Request #{r.id}</small>
            </div>
          </td>
          <td>{r.role}</td>
          <td>{r.openings}</td>
          <td>{m.assigned}</td>
          <td>
            <strong>{m.filled}</strong>
          </td>
          <td>
            <div className="fulfillment-cell">
              <strong>{m.percentage}%</strong>
              <span className="fulfillment-track" role="progressbar" aria-label={`Fulfillment for request ${r.id}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.percentage}>
                <span style={{ width: `${m.percentage}%` }} />
              </span>
              <small>{m.filled} of {r.openings} positions filled</small>
            </div>
          </td>
          <td>
            <select className="stage-select" aria-label={`Status for request ${r.id}`} value={r.status} onChange={e => update(`Request #${r.id}: ${e.target.value}`, d => ({ ...d, requests: d.requests.map(x => x.id === r.id ? { ...x, status: e.target.value } : x) }))}>
              <option>Open</option>
              <option>On Hold</option>
              <option>Closed</option>
            </select>
          </td>
        </tr>
      })}</tbody>
    </table>{items.length === 0 && <p className="empty">No staffing requests yet.</p>}</div>
  const fulfillmentSummary = <section className="panel">
    <div className="panel-head">
      <div>
        <h2>Request fulfillment</h2>
        <p>Calculated from linked candidate placements in this demo workspace</p>
      </div>
      <span className="pill green">Live demo metrics</span>
    </div>
    <div className="fulfillment-summary">
      <div>
        <small>Requested positions</small>
        <strong>{totalRequested}</strong>
      </div>
      <div>
        <small>Assigned candidates</small>
        <strong>{assigned}</strong>
      </div>
      <div>
        <small>Placed on requests</small>
        <strong>{placedOnRequests}</strong>
      </div>
      <div>
        <small>Overall fulfillment</small>
        <strong>{fulfillment}%</strong>
      </div>
    </div>{requestTable(data.requests)}</section>
  // Application shell, page content, and add-record dialog.
  return <div className="shell">
    <aside className={`sidebar ${mobileMenu ? 'visible' : ''}`}>
      <div className="brand">
        <span className="brand-symbol">
          <Command size={22} />
        </span>
        <span>
          <strong>provalidus<span className="brand-dot">.</span>
          </strong>
          <small>COMMAND CENTER</small>
        </span>
      </div>
      <div className="workspace">
        <span className="workspace-icon">P</span>
        <span>
          <strong>PSG Workspace</strong>
          <small>Enterprise demo</small>
        </span>
        <ChevronDown size={15} />
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.title} className={`nav-link ${page === item.title ? 'selected' : ''}`} onClick={() => go(item.title)}>
        <item.icon size={18} />{item.title}{page === item.title && <span className="nav-indicator" />}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="demo-note">
          <ShieldCheck size={19} />
          <strong>Demo environment</strong>
          <p>Fictional records only. No live client or patient data.</p>
        </div>
        <button className="nav-link" onClick={() => { if (window.confirm('Reset all fictional demo records to their defaults?')) { setData(createDemoWorkspace()); toast('Demo records reset') } }}>
          <RotateCcw size={18} />Reset demo</button>
        <button className="nav-link" onClick={() => toast('Concept demonstration; no live integrations')}>
          <CircleHelp size={18} />Help & support</button>
        <button className="nav-link" onClick={() => toast('Settings are not available in this prototype')}>
          <Settings2 size={18} />Settings</button>
      </div>
    </aside>
    {mobileMenu && <div className="overlay" onClick={() => setMobileMenu(false)} />}

    <div className="main">
      <header className="topbar">
        <div className="top-left">
          <button
            className="icon-btn mobile-toggle"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb">Workspace</span>
          <span className="slash">/</span>
          <strong>{page}</strong>
        </div>

        <div className="top-right">
          <span className="demo-badge">
            <span className="dot" /> DEMO MODE
          </span>

          <Phase6Notifications
            clients={data.clients}
            requests={data.requests}
            candidates={data.candidates}
            tasks={data.tasks}
            onNavigate={go}
          />

          <span className="profile">PS</span>
        </div>
      </header>
      <main className="content">
        <div className="heading">
          <div>
            <p className="eyebrow">PROVALIDUS SERVICE GROUP / WORKSPACE</p>
            <h1>{page === 'Overview' ? 'Executive overview' : page}</h1>
            <p className="subtitle">{page === 'Overview' ? 'A unified view of staffing, clients, and operations.' : page === 'Clients' ? 'Manage clients and their linked staffing requests.' : page === 'Recruitment' ? 'Track candidates across shared staffing requests.' : page === 'Operations' ? 'Coordinate recruitment, compliance, and service delivery.' : page === 'Integrations' ? 'A proposed architecture for connected departments.' : 'Explore live demo metrics and illustrative staffing trends.'}</p>
          </div>
          <div className="heading-actions">{page === 'Clients' && <button className="primary-btn" onClick={() => showModal('client')}>
            <Plus size={17} /> Add client</button>}{page === 'Recruitment' && <button className="primary-btn" onClick={() => showModal('candidate')}>
              <Plus size={17} /> Add candidate</button>}{page === 'Overview' && <button className="primary-btn" onClick={() => go('Recruitment')}>View pipeline <ArrowUpRight size={17} />
              </button>}</div>
        </div>
        {page === 'Overview' && <>
          <section className="medical-hero" aria-label="Healthcare operations overview">
            <div className="medical-hero-copy">
              <span className="medical-hero-kicker">
                <span className="medical-live-dot" /> HEALTHCARE WORKFORCE INTELLIGENCE</span>
              <h2>Connected care starts with connected teams.</h2>
              <p>From staffing requests to placements, every workflow moves together.</p>
            </div>
            <div className="medical-ecg" aria-hidden="true">
              <svg viewBox="0 0 480 110" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="ecgGlow" x1="0" x2="1">
                    <stop offset="0" stopColor="#47d8cb" stopOpacity=".12" />
                    <stop offset=".45" stopColor="#75f1dd" />
                    <stop offset="1" stopColor="#47d8cb" stopOpacity=".35" />
                  </linearGradient>
                </defs>
                <path className="ecg-gridline" d="M0 56 H480" />
                <path className="ecg-path" d="M0 56 H100 L120 56 L136 42 L151 76 L172 13 L194 98 L214 56 H280 L296 48 L309 56 H480" />
              </svg>
              <span className="ecg-sweep" />
            </div>
          </section>
          <div className="stats">
            <div className="stat">
              <span className="stat-icon blue">
                <Building2 size={19} />
              </span>
              <span className="stat-label">Active clients</span>
              <strong>{data.clients.filter(c => c.status === 'Active').length}</strong>
              <small>Live demo records</small>
            </div>
            <div className="stat">
              <span className="stat-icon purple">
                <BriefcaseBusiness size={19} />
              </span>
              <span className="stat-label">Open staffing positions</span>
              <strong>{totalOpenings}</strong>
              <small>Across open client requests</small>
            </div>
            <div className="stat">
              <span className="stat-icon orange">
                <Users size={19} />
              </span>
              <span className="stat-label">Candidates in pipeline</span>
              <strong>{inPipeline}</strong>
              <small>Currently being processed</small>
            </div>
            <div className="stat">
              <span className="stat-icon green-icon">
                <CheckCircle2 size={19} />
              </span>
              <span className="stat-label">Confirmed placements</span>
              <strong>{placedOnRequests}</strong>
              <small>Placed on staffing requests</small>
            </div>
          </div>{fulfillmentSummary}<div className="two-col">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Placement activity</h2>
                  <p>Illustrative six-month trend, not live data</p>
                </div>
                <span className="legend">
                  <i /> Placements</span>
              </div>{graph}</section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Recruitment pipeline</h2>
                  <p>Current candidate distribution</p>
                </div>
              </div>
              <div className="pipeline-list">{stages.map(s => {
                const count = data.candidates.filter(c => c.stage === s).length; return <div className="pipeline-row" key={s}>
                  <div>
                    <span>{s}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${data.candidates.length ? count / data.candidates.length * 100 : 0}%` }} />
                  </div>
                </div>
              })}</div>
              <button className="text-link" onClick={() => go('Recruitment')}>Manage recruitment <ArrowUpRight size={15} />
              </button>
            </section>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Recent candidates</h2>
                <p>Updates flow directly into this overview</p>
              </div>
              <button className="light-btn" onClick={() => go('Recruitment')}>View all <ArrowUpRight size={15} />
              </button>
            </div>{candidateTable(data.candidates.slice(-4))}</section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Recent workspace activity</h2>
                <p>Cross-department changes in this browser</p>
              </div>
            </div>
            <div className="activity-feed">{data.log.slice(0, 5).map(item => <div className="activity-entry" key={item.id}>
              <Clock3 size={16} />
              <span>{item.message}</span>
              <small>{item.time}</small>
            </div>)}</div>
          </section></>}
        {page === 'Clients' && <>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Client directory</h2>
                <p>{data.clients.length} demo organizations</p>
              </div>
              <div className="search-box">
                <Search size={16} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients..." aria-label="Search clients" />
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CLIENT</th>
                    <th>SECTOR</th>
                    <th>CONTACT</th>
                    <th>OPEN POSITIONS</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>{filteredClients.map(c => <tr key={c.id}>
                  <td className="strong">{c.name}</td>
                  <td>{c.sector}</td>
                  <td>{c.contact}</td>
                  <td>{openRequests.filter(r => r.clientId === c.id).reduce((sum, r) => sum + r.openings, 0)}</td>
                  <td>
                    <span className={`pill ${c.status === 'Active' ? 'green' : 'amber'}`}>{c.status}</span>
                  </td>
                  <td>
                    <button className="light-btn" onClick={() => showModal('request', c.id)}>
                      <Plus size={14} /> Staffing request</button>
                  </td>
                </tr>)}</tbody>
              </table>{filteredClients.length === 0 && <p className="empty">No clients match your search.</p>}</div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Staffing requests</h2>
                <p>Shared with Recruitment and the executive dashboard</p>
              </div>
              <button className="primary-btn" onClick={() => showModal('request')}>
                <Plus size={16} /> New request</button>
            </div>{requestTable(data.requests)}</section></>}
        {page === 'Recruitment' && <>
          <div className="stage-cards">{stages.map(s => <div className="stage-card" key={s}>
            <small>{s}</small>
            <strong>{data.candidates.filter(c => c.stage === s).length}</strong>
          </div>)}</div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Candidate pipeline</h2>
                <p>Moving a candidate to Credentialing creates a compliance task</p>
              </div>
              <div className="search-box">
                <Search size={16} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search candidates..." aria-label="Search candidates" />
              </div>
            </div>{candidateTable(filteredCandidates)}</section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Available staffing requests</h2>
                <p>Candidates are assigned to these client requests</p>
              </div>
              <button className="light-btn" onClick={() => go('Clients')}>Manage requests <ArrowUpRight size={15} />
              </button>
            </div>{requestTable(openRequests)}</section></>}
        {page === 'Operations' && <>
          <div className="info-banner">
            <ClipboardList size={22} />
            <div>
              <strong>Cross-team workflow coordination</strong>
              <p>Recruitment stage changes can create credentialing tasks automatically. Completing tasks updates the shared workspace.</p>
            </div>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Operational task board</h2>
                <p>{data.tasks.filter(t => t.done).length} of {data.tasks.length} tasks completed</p>
              </div>
            </div>
            <div className="tasks">{data.tasks.map(t => <label className="task" key={t.id}>
              <input type="checkbox" checked={t.done} onChange={() => update(`${t.done ? 'Reopened' : 'Completed'} task: ${t.label}`, d => ({ ...d, tasks: d.tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x) }))} />
              <span className="task-title">
                <strong className={t.done ? 'completed' : ''}>{t.label}</strong>
                <small>{t.team}</small>
              </span>
              <span className={`pill ${t.priority === 'High' ? 'amber' : 'neutral'}`}>{t.priority}</span>
            </label>)}</div>
          </section>
          <CredentialTracker candidates={data.candidates} /></>}
        {page === 'Integrations' && <>
          <div className="info-banner">
            <Cloud size={22} />
            <div>
              <strong>One workspace, connected departments</strong>
              <p>This demo shares data between its own modules. No external CRM, ATS, credentialing, payroll, or marketing platforms are connected.</p>
            </div>
          </div>
          <div className="integration-grid">{[{ name: 'Sales CRM', desc: 'Client accounts and staffing demand', icon: Building2 }, { name: 'Recruitment / ATS', desc: 'Candidates, interviews, and placements', icon: Users }, { name: 'Credentialing', desc: 'Verification and compliance workflows', icon: ShieldCheck }, { name: 'Payroll & HR', desc: 'Employee and pay workflows', icon: Database }, { name: 'Marketing', desc: 'Lead generation and campaign attribution', icon: TrendingUp }, { name: 'Operations', desc: 'Tasks, service delivery, and approvals', icon: Workflow }].map(x => <div className="integration-card" key={x.name}>
            <span className="stat-icon blue">
              <x.icon size={20} />
            </span>
            <h3>{x.name}</h3>
            <p>{x.desc}</p>
            <span className="pill neutral">
              <Link2 size={12} /> Proposed external integration</span>
          </div>)}</div></>}
        {page === 'Analytics' && <>
          <div className="stats">
            <div className="stat">
              <span className="stat-label">Active demo clients</span>
              <strong>{data.clients.filter(c => c.status === 'Active').length}</strong>
              <small>Workspace records</small>
            </div>
            <div className="stat">
              <span className="stat-label">Open positions</span>
              <strong>{totalOpenings}</strong>
              <small>Open staffing requests</small>
            </div>
            <div className="stat">
              <span className="stat-label">Candidates in pipeline</span>
              <strong>{inPipeline}</strong>
              <small>Not yet placed</small>
            </div>
            <div className="stat">
              <span className="stat-label">Demo placement share</span>
              <strong>{fulfillment}%</strong>
              <small>Placed candidates / all requested positions</small>
            </div>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Illustrative staffing trend</h2>
                <p>Historical chart is fictional and independent of current demo records</p>
              </div>
            </div>{graph}</section>{fulfillmentSummary}</>}
        <footer className="footer">PSG Command Center · Concept prototype · Fictional data only <span>Browser-local storage · No live third-party connections</span>
        </footer>
      </main>
    </div>
    {notice && <div className="toast">
      <CheckCircle2 size={18} />{notice}</div>}
    {modal && <div className="modal-overlay" onClick={() => setModal(null)}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Add ${modal}`}>
        <div className="modal-head">
          <h2>{modal === 'client' ? 'Add client' : modal === 'request' ? 'New staffing request' : 'Add candidate'}</h2>
          <button className="icon-btn" aria-label="Close dialog" onClick={() => setModal(null)}>
            <X size={19} />
          </button>
        </div>
        <p>Fictional demo records are stored locally in this browser.</p>
        <form onSubmit={e => { e.preventDefault(); addRecord() }}>
          <label>{modal === 'client' ? 'Organization name' : modal === 'request' ? 'Requested role' : 'Candidate name'}<input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={modal === 'client' ? 'Example Health Partners' : modal === 'request' ? 'Registered Nurse' : 'First Last'} />
          </label>{modal === 'client' && <label>Sector<input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Healthcare" />
          </label>}{modal === 'request' && <>
            <label>Client<select required value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>{data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </label>
            <label>Number of positions<input type="number" min="1" max="999" required value={openings} onChange={e => setOpenings(e.target.value)} />
            </label></>}{modal === 'candidate' && <label>Assign to open staffing request<select value={selectedRequest} onChange={e => setSelectedRequest(e.target.value)}>
              <option value="">Unassigned</option>{openRequests.map(r => <option key={r.id} value={r.id}>{clientName(r.clientId)} — {r.role}</option>)}</select>
            </label>}<div className="modal-actions">
            <button type="button" className="light-btn" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="primary-btn">
              <Plus size={16} /> Add record</button>
          </div>
        </form>
      </div>
    </div>}
  </div>
}
export default App
