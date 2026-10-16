import { seed } from '../data/demoData'
import type { Workspace } from '../types/workspace'

// Keep the original storage key so an existing demo browser can reuse its records.
export const WORKSPACE_STORAGE_KEY = 'psg-command-center-phase2'

/**
 * Clone the sample records for each fresh workspace.
 * This prevents changes to browser state from modifying the seed fixture.
 */
export function createDemoWorkspace(): Workspace {
  return structuredClone(seed)
}

/**
 * Load the last browser-local workspace. Invalid or inaccessible storage
 * falls back to fictional sample records instead of crashing the page.
 */
export function loadWorkspace(): Workspace {
  try {
    const value = localStorage.getItem(WORKSPACE_STORAGE_KEY)

    if (!value) {
      return createDemoWorkspace()
    }

    const data: unknown = JSON.parse(value)

    if (
      typeof data === 'object' &&
      data !== null &&
      'clients' in data && Array.isArray(data.clients) &&
      'requests' in data && Array.isArray(data.requests) &&
      'candidates' in data && Array.isArray(data.candidates) &&
      'tasks' in data && Array.isArray(data.tasks) &&
      'log' in data && Array.isArray(data.log)
    ) {
      return data as Workspace
    }
  } catch {
    // Storage may be disabled or the saved JSON may be malformed.
  }

  return createDemoWorkspace()
}

/**
 * Persist changes only in this browser. No server, synchronization,
 * authentication, or multi-user data protection is provided.
 */
export function saveWorkspace(data: Workspace): void {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Private browsing and restrictive browser settings can disable storage.
  }
}
