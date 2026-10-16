# PSG Command Center — Demo Edition

A browser-based prototype for ProValidus Service Group showing how client staffing requests, recruitment, compliance tasks, and analytics could share one workspace.

> **Demonstration only.** All included organizations, candidates, placements, and historical chart values are fictional. This application uses browser `localStorage` and has no authentication, secure server database, or live CRM/ATS integration. **Do not enter real candidate, patient, employee, credential, or other sensitive information.**

## Requirements

- Node.js compatible with Vite 8 (Node 20.19+ or 22.12+)
- npm

## Run locally

```powershell
Set-Location "D:\psg\PSG-Command-Center-Demo-Edition"
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed" }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }
npm.cmd run dev -- --host 127.0.0.1
```

Open the localhost address printed by Vite (normally http://localhost:5173).

## Project structure

```text
src/
  data/demoData.ts            Fictional seed records and sample chart data
  types/workspace.ts          Shared application data contracts
  utils/workspaceStorage.ts   Browser-local persistence and reset defaults
  credentialUtils.ts         Credential validation and expiration status
  CredentialTracker.tsx      Credential tracking UI
  Phase6Notifications.tsx    Cross-module alerts UI
  App.tsx                    Workspace pages, actions, and layout
  App.css                    Main interface styles
  CredentialTracker.css      Credential tracker styles
  Phase6Notifications.css    Notification styles
  index.css                  Base page styles
  main.tsx                   React entry point
```

## Functional review checklist

1. Open Overview and verify the KPI values agree with the request and candidate tables.
2. Add a client and staffing request; verify they appear in Clients and Overview.
3. Add a candidate, assign a request, and move the candidate through pipeline stages.
4. Move a candidate to Credentialing and confirm the operations/compliance task appears.
5. Mark a candidate Placed and confirm the fulfillment counts update.
6. Check credential expiry labels and notification-bell content.
7. Reload the browser and confirm demo changes persist in the same browser.
8. Use the Reset Demo action to restore fictional seed records.
9. Verify layout and keyboard focus on desktop and mobile widths.

## Build and deploy

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

A successful build creates `dist/`. Deploy **only** that static build output to a static host. Do not upload `.env` files, `node_modules`, Git history, or any real records. A public demo link is not a production release.

## Notes on local data

The release intentionally retains the previous workspace storage key (`psg-command-center-phase2`) so existing browser demo records can still appear after an upgrade. For a clean demonstration, use the app's Reset Demo control or a new browser profile. No records are bundled from your browser into this ZIP.

## Maintenance

- UTF-8 text and LF line endings are enforced through `.editorconfig` and `.gitattributes`.
- `npm run lint` checks TypeScript/React rules.
- `npm run build` runs TypeScript validation and creates the production bundle.
- Keep data contracts, seed fixtures, and storage code separate from the UI.
- Add explanatory comments for business rules and non-obvious behavior, not for every JSX tag.
