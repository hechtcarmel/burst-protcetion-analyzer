# Electron App Migration Plan

## Executive Summary

This document outlines the comprehensive plan to package the Burst Protection Analysis Dashboard as an Electron desktop application with a secure pre-launch configuration window for Vertica credentials. The approach uses modern Electron best practices with **contextBridge** for secure IPC, Next.js 15 dual-mode configuration, and electron-builder for cross-platform packaging.

### Key Innovation: Dual-Mode Architecture

This plan implements a **dual-mode configuration** that maintains 100% backward compatibility with your existing Next.js workflow while adding Electron as an additional build target:

**Regular Next.js Mode (Default - Unchanged):**
```bash
pnpm dev          # Development server with hot reload
pnpm build        # Production build with SSR + API routes
pnpm start        # Production server
# Docker deployment unchanged
```

**Electron Mode (New - Additional Target):**
```bash
pnpm electron:dev           # Electron app with Next.js dev server
pnpm electron:build         # Standalone desktop app
# Shared business logic via DRY pattern
```

**Benefits:**
- ✅ Zero breaking changes to existing development workflow
- ✅ Single source of truth for business logic (DRY principle)
- ✅ Easy to maintain - fix bugs once, benefits both modes
- ✅ Gradual migration - refactor one API route at a time
- ✅ Type-safe across both platforms

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Why Custom Setup](#why-custom-setup)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [Pre-Launch Configuration Window](#pre-launch-configuration-window)
6. [Environment Variable Management](#environment-variable-management)
7. [Security Implementation (contextBridge)](#security-implementation-contextbridge)
8. [Dual-Mode Configuration](#dual-mode-configuration)
9. [Build & Packaging Strategy](#build--packaging-strategy)
10. [Development Workflow](#development-workflow)
11. [Implementation Steps](#implementation-steps)
12. [Testing Strategy](#testing-strategy)
13. [Production Considerations](#production-considerations)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron App                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐       ┌────────────────────────┐        │
│  │ Config Window │──────▶│   Main Dashboard       │        │
│  │  (Preload)    │       │   (Next.js Static)     │        │
│  └───────────────┘       └────────────────────────┘        │
│         │                            │                       │
│         │   contextBridge IPC        │                       │
│         │                            │                       │
│  ┌──────▼────────────────────────────▼─────────────┐       │
│  │           Main Process (Node.js)                 │       │
│  │  - Electron window management                    │       │
│  │  - Secure credential storage (electron-store)    │       │
│  │  - Environment variable injection                │       │
│  │  - Next.js server (dev) / Static files (prod)    │       │
│  └──────────────────────────────────────────────────┘       │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                      ┌──────▼──────┐
                      │   Vertica   │
                      │   Database  │
                      └─────────────┘
```

### Process Model

1. **Main Process**: Node.js runtime that runs Electron's main script
   - Creates and manages browser windows
   - Handles IPC communication from renderer processes
   - Manages secure credential storage
   - Serves Next.js content (development) or static files (production)

2. **Renderer Process (Config Window)**: Chromium-based window for credential entry
   - Sandboxed environment with `contextIsolation: true`
   - Accesses Main Process APIs only via contextBridge
   - Displays configuration form

3. **Renderer Process (Dashboard)**: Chromium-based window for the dashboard
   - Loads Next.js static export pages
   - No direct Node.js access (security)
   - Communicates with Main Process for data operations

---

## Why Custom Setup

### Nextron Limitations

While Nextron is popular, it has critical limitations for this project:

1. **Next.js Version**: Ships with Next.js 13.5.6 (as of v8.15.0), not Next.js 15
2. **App Router Support**: Limited support for Next.js App Router and React Server Components
3. **API Routes**: Cannot handle Next.js API routes properly in production
4. **Customization**: Opinionated structure limits flexibility for pre-launch windows

### Custom Approach Benefits

1. **Full Control**: Complete control over Electron lifecycle, IPC, and configuration
2. **Next.js 15 Support**: Use latest Next.js features with Turbopack
3. **Security First**: Implement contextBridge with minimal API surface
4. **Credential Management**: Secure pre-launch configuration window
5. **Production Ready**: Proper static export with all features intact

---

## Directory Structure

```
burst-protection-analysis/
├── electron/                          # Electron-specific code
│   ├── main.ts                       # Main process entry point
│   ├── preload/                      # Preload scripts
│   │   ├── configPreload.ts         # Config window preload
│   │   └── dashboardPreload.ts      # Dashboard window preload
│   ├── windows/                      # Window management
│   │   ├── configWindow.ts          # Config window creation
│   │   └── dashboardWindow.ts       # Dashboard window creation
│   ├── ipc/                          # IPC handlers
│   │   ├── configHandlers.ts        # Config-related IPC
│   │   └── dbHandlers.ts            # Database-related IPC
│   ├── config/                       # Configuration management
│   │   ├── store.ts                 # electron-store wrapper
│   │   └── crypto.ts                # Credential encryption
│   ├── server/                       # Express API server
│   │   └── api.ts                   # API endpoints for Electron
│   ├── static/                       # Static assets for Electron windows
│   │   └── config.html              # Config window HTML
│   └── utils/                        # Electron utilities
│       ├── env.ts                   # Environment variable injection
│       └── security.ts              # Security utilities
│
├── src/                              # Next.js application
│   ├── app/                          # App Router
│   │   └── api/                     # API routes (thin wrappers)
│   ├── components/                   # React components
│   ├── lib/
│   │   ├── api/                     # ⭐ NEW: Shared business logic
│   │   │   ├── burstProtection.ts  # Data fetching logic
│   │   │   ├── metrics.ts          # Metrics logic
│   │   │   ├── advertisers.ts      # Advertisers logic
│   │   │   └── campaigns.ts        # Campaigns logic
│   │   ├── config/                  # Configuration
│   │   │   └── api.ts              # ⭐ NEW: API base URL detection
│   │   ├── db/                      # Database layer
│   │   ├── hooks/                   # React hooks (updated to use API_BASE_URL)
│   │   └── ...
│   └── types/
│
├── out/                              # Next.js static export output (Electron mode)
├── dist/                             # Electron build output
│
├── next.config.ts                    # Updated for dual-mode
├── electron-builder.yml              # Electron Builder config
├── tsconfig.electron.json            # TypeScript config for Electron
└── package.json                      # Updated scripts
```

**Key additions:**
- `electron/server/` - Express API server for Electron production mode
- `src/lib/api/` - Shared business logic used by both Next.js and Electron
- `src/lib/config/api.ts` - Runtime detection of API base URL

---

## Core Components

### 1. Main Process (`electron/main.ts`)

**Responsibilities:**
- Initialize Electron app
- Create config window on first launch or missing credentials
- Create dashboard window after successful configuration
- Handle IPC communication
- Manage secure credential storage
- Inject environment variables for Next.js
- Serve Next.js static export

**Key Features:**
```typescript
// Pseudo-code structure
app.on('ready', async () => {
  // Check if credentials exist
  const hasCredentials = await configStore.hasCredentials();

  if (!hasCredentials) {
    // Show config window
    await createConfigWindow();
  } else {
    // Load credentials and inject into environment
    await loadCredentials();
    // Show dashboard window
    await createDashboardWindow();
  }
});
```

### 2. Config Window (`electron/windows/configWindow.ts`)

**Purpose:** Pre-launch window for Vertica credential entry

**Features:**
- Modern, clean UI with validation
- Real-time connection testing
- Secure credential storage with encryption
- "Remember credentials" option
- "Test Connection" button
- Error handling and user feedback

**Security:**
```typescript
const configWindow = new BrowserWindow({
  width: 600,
  height: 700,
  webPreferences: {
    nodeIntegration: false,           // ✅ Disabled
    contextIsolation: true,            // ✅ Enabled
    sandbox: true,                     // ✅ Enabled
    preload: path.join(__dirname, 'preload/configPreload.js')
  }
});
```

### 3. Dashboard Window (`electron/windows/dashboardWindow.ts`)

**Purpose:** Main application window loading Next.js dashboard

**Features:**
- Full-screen capable
- Loads Next.js static export from `out/` directory
- No direct Node.js access
- Minimal IPC surface (only for logout/settings)

**Configuration:**
```typescript
const dashboardWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, 'preload/dashboardPreload.js')
  }
});

// Production: load static files
dashboardWindow.loadFile('out/index.html');

// Development: load dev server
// dashboardWindow.loadURL('http://localhost:3000');
```

### 4. Preload Scripts (contextBridge)

#### Config Preload (`electron/preload/configPreload.ts`)

**Exposes secure API to config window:**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Type-safe IPC API
contextBridge.exposeInMainWorld('electronAPI', {
  // Save credentials
  saveCredentials: async (credentials: VerticaCredentials) => {
    return ipcRenderer.invoke('config:save', credentials);
  },

  // Test database connection
  testConnection: async (credentials: VerticaCredentials) => {
    return ipcRenderer.invoke('config:test', credentials);
  },

  // Close config window (cancel)
  cancel: () => {
    ipcRenderer.send('config:cancel');
  }
});
```

#### Dashboard Preload (`electron/preload/dashboardPreload.ts`)

**Minimal API surface for dashboard:**

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // Open settings to reconfigure credentials
  openSettings: () => {
    ipcRenderer.send('dashboard:openSettings');
  },

  // Get app version
  getAppVersion: () => {
    return ipcRenderer.invoke('app:version');
  }
});
```

**Important:** Dashboard should NOT have access to sensitive operations. All data fetching happens via Next.js API routes using the injected environment variables.

---

## Pre-Launch Configuration Window

### UI Design

**Window Layout:**

```
┌─────────────────────────────────────────────────┐
│  Burst Protection Analysis - Configuration      │
├─────────────────────────────────────────────────┤
│                                                  │
│  Configure Vertica Database Connection          │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Host:     [office-vrt.taboolasyndica...] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Port:     [5433                        ] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Database: [taboola_prod                ] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Username: [your_username               ] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Password: [••••••••••••                ] │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [ ] Remember credentials securely               │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Test Connection  │  │   Save & Launch   │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                  │
│  Status: [                                  ]   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Implementation File (`electron/static/config.html`)

**HTML/CSS/JavaScript:**
- Vanilla HTML with inline CSS for simplicity
- Real-time validation
- Loading states during connection test
- Clear error messages
- Uses `window.electronAPI` exposed by preload script

**Example Structure:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Database Configuration</title>
  <style>
    /* Tailwind-inspired styles */
  </style>
</head>
<body>
  <div class="container">
    <h1>Configure Vertica Connection</h1>
    <form id="configForm">
      <input id="host" placeholder="Host" required />
      <input id="port" placeholder="Port" type="number" required />
      <input id="database" placeholder="Database" required />
      <input id="username" placeholder="Username" required />
      <input id="password" type="password" placeholder="Password" required />
      <label>
        <input type="checkbox" id="remember" />
        Remember credentials securely
      </label>
      <button type="button" id="testBtn">Test Connection</button>
      <button type="submit">Save & Launch</button>
    </form>
    <div id="status"></div>
  </div>

  <script>
    // Uses window.electronAPI from preload
    document.getElementById('testBtn').addEventListener('click', async () => {
      const credentials = getFormData();
      const result = await window.electronAPI.testConnection(credentials);
      showStatus(result);
    });

    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const credentials = getFormData();
      await window.electronAPI.saveCredentials(credentials);
    });
  </script>
</body>
</html>
```

### Credential Validation

**Client-side:**
- Required field validation
- Port number range check
- Host format validation

**Server-side (Main Process):**
- Zod schema validation (reuse `EnvSchema` from `vertica.ts`)
- Actual connection test to Vertica
- Error handling with user-friendly messages

---

## Environment Variable Management

### Challenge

Next.js reads environment variables at build/startup time from `.env.local`. In Electron, we need to inject credentials dynamically from the config window.

### Solution: Runtime Environment Injection

**Implementation in `electron/utils/env.ts`:**

```typescript
import { app } from 'electron';
import Store from 'electron-store';
import { decrypt } from '../config/crypto';

export async function injectEnvironmentVariables() {
  const store = new Store();
  const encryptedCreds = store.get('credentials');

  if (!encryptedCreds) {
    throw new Error('No credentials found');
  }

  const credentials = decrypt(encryptedCreds);

  // Inject into process.env BEFORE Next.js loads
  process.env.VERTICA_HOST = credentials.host;
  process.env.VERTICA_PORT = credentials.port.toString();
  process.env.VERTICA_DATABASE = credentials.database;
  process.env.VERTICA_USER = credentials.username;
  process.env.VERTICA_PASSWORD = credentials.password;

  console.log('Environment variables injected successfully');
}
```

**Call this function:**
- After credentials are saved (first launch)
- Before creating the dashboard window
- Before starting Next.js server (development)

### Development vs Production

**Development:**
```typescript
// Still load .env.local for dev convenience
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: '.env.local' });
}

// But allow overrides from electron-store
await injectEnvironmentVariables();
```

**Production:**
```typescript
// Only use electron-store credentials
await injectEnvironmentVariables();
```

---

## Security Implementation (contextBridge)

### Why contextBridge?

**Security Principles:**
1. **Context Isolation**: Renderer processes cannot access Node.js or Electron APIs directly
2. **Minimal API Surface**: Expose only specific, validated functions
3. **No Raw IPC**: Never expose `ipcRenderer` directly to renderer
4. **Input Validation**: Validate all data from renderer before processing

### Implementation Pattern

#### ❌ Unsafe Pattern (DO NOT USE)

```typescript
// DANGEROUS: Exposes entire ipcRenderer module
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer  // ⚠️ Security vulnerability
});
```

#### ✅ Safe Pattern (USE THIS)

```typescript
// SAFE: Exposes specific, validated functions
contextBridge.exposeInMainWorld('electronAPI', {
  saveCredentials: async (credentials: VerticaCredentials) => {
    // Validate input (Zod schema)
    const validated = CredentialsSchema.parse(credentials);
    return ipcRenderer.invoke('config:save', validated);
  }
});
```

### IPC Channel Naming Convention

**Format:** `<context>:<action>`

Examples:
- `config:save` - Save credentials
- `config:test` - Test database connection
- `config:cancel` - Cancel configuration
- `dashboard:openSettings` - Open settings from dashboard
- `app:version` - Get application version

### Type Safety

**Create shared types in `electron/types/ipc.ts`:**

```typescript
export interface VerticaCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  remember: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}

// Type-safe IPC API for renderer
export interface ElectronAPI {
  saveCredentials: (creds: VerticaCredentials) => Promise<void>;
  testConnection: (creds: VerticaCredentials) => Promise<TestConnectionResult>;
  cancel: () => void;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### Credential Encryption

**Create `electron/config/store.ts` using `electron-store` with `safeStorage`:**

```typescript
import Store from 'electron-store';
import { safeStorage } from 'electron';
import log from 'electron-log';

interface VerticaCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  remember: boolean;
}

// Initialize electron-store
const store = new Store({
  name: 'burst-protection-config',
  // Optional: use built-in encryption (basic obfuscation)
  // encryptionKey: 'your-app-specific-key',
});

/**
 * Save credentials with OS-level encryption
 */
export function saveCredentials(creds: VerticaCredentials): void {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      log.warn('OS-level encryption not available, using basic storage');
      store.set('credentials', creds);
      return;
    }

    const json = JSON.stringify(creds);
    const encrypted = safeStorage.encryptString(json);

    // Store as base64 string for JSON compatibility
    store.set('credentials', encrypted.toString('base64'));
    log.info('Credentials saved with OS-level encryption');
  } catch (error) {
    log.error('Failed to save credentials:', error);
    throw error;
  }
}

/**
 * Load and decrypt credentials
 */
export function loadCredentials(): VerticaCredentials | null {
  try {
    const encrypted = store.get('credentials');
    if (!encrypted) {
      return null;
    }

    // Handle unencrypted fallback
    if (typeof encrypted === 'object') {
      log.warn('Loading unencrypted credentials (legacy format)');
      return encrypted as VerticaCredentials;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      log.warn('OS-level encryption not available for decryption');
      return null;
    }

    const buffer = Buffer.from(encrypted as string, 'base64');
    const json = safeStorage.decryptString(buffer);
    const creds = JSON.parse(json);

    log.info('Credentials loaded successfully');
    return creds;
  } catch (error) {
    log.error('Failed to load credentials:', error);
    return null;
  }
}

/**
 * Check if credentials exist
 */
export function hasCredentials(): boolean {
  return store.has('credentials');
}

/**
 * Delete stored credentials
 */
export function deleteCredentials(): void {
  store.delete('credentials');
  log.info('Credentials deleted');
}
```

**Benefits of `electron-store` + `safeStorage`:**
- ✅ **electron-store**: Simple JSON-based persistence, works in both main and renderer
- ✅ **safeStorage**: OS-level encryption (Keychain/DPAPI/libsecret)
- ✅ Automatic fallback if encryption unavailable
- ✅ Type-safe with TypeScript
- ✅ Handles edge cases (legacy data, missing encryption)

**Important:** `safeStorage` uses OS-level encryption:
- macOS: Keychain
- Windows: DPAPI
- Linux: Secret Service API / libsecret

---

## Dual-Mode Configuration

### Overview

The app will support **two independent modes** without breaking existing workflows:

1. **Regular Next.js Mode** (default): Full SSR, API routes, development/production servers
2. **Electron Mode**: Static export with embedded Express API server

### Benefits

✅ **Regular Next.js workflow remains 100% functional:**
- `pnpm dev`, `pnpm build`, `pnpm start` unchanged
- All API routes work as-is
- Docker deployment unaffected
- No breaking changes to existing development

✅ **Electron is an additional build target:**
- Separate build commands
- Shared business logic (DRY principle)
- Single source of truth for API logic
- Easy to maintain both modes

### Implementation

**Key Principle:** Use environment variables to conditionally enable static export only for Electron builds.

---

## Build & Packaging Strategy

### Next.js Configuration (Dual-Mode)

**Update `next.config.ts` for conditional static export:**

```typescript
import type { NextConfig } from 'next';

// Check if building for Electron
const isElectron = process.env.NEXT_BUILD_TARGET === 'electron';

const nextConfig: NextConfig = {
  // Only enable static export for Electron builds
  ...(isElectron && {
    output: 'export',
    images: {
      unoptimized: true,
    },
  }),

  // Common config (works for both modes)
  trailingSlash: true,
};

export default nextConfig;
```

**How it works:**
- **Regular build**: `pnpm build` → Full Next.js SSR with API routes
- **Electron build**: `NEXT_BUILD_TARGET=electron pnpm build` → Static export

### Handling API Routes with Shared Logic

**Problem:** Next.js static export doesn't support API routes in production.

**Solution: Shared Business Logic Pattern (DRY)**

Instead of duplicating code, extract business logic into reusable functions that both Next.js API routes and Electron Express server can use.

#### Architecture

```
src/lib/api/              # Shared business logic
├── burstProtection.ts   # getBurstProtectionData()
├── metrics.ts           # getMetrics()
├── advertisers.ts       # getAdvertisers()
└── campaigns.ts         # getCampaigns()
         ↓                        ↓
Next.js API Routes     Electron Express Server
(src/app/api/*)        (electron/server/api.ts)
```

#### Step 1: Extract Business Logic

**Create `src/lib/api/burstProtection.ts`:**

```typescript
import { executeQuery } from '@/lib/db/vertica';
import { buildBurstProtectionQuery } from '@/lib/db/queries';
import { BurstProtectionRowSchema } from '@/lib/db/schema';
import { z } from 'zod';

export interface BurstProtectionParams {
  startDate?: string;
  endDate?: string;
  advertiserId?: string;
  campaignId?: string;
  // ... other filters
}

export async function getBurstProtectionData(params: BurstProtectionParams) {
  try {
    const sql = buildBurstProtectionQuery(params);
    const rows = await executeQuery(sql);

    // Validate with existing Zod schema
    const validatedRows = rows.map(row => BurstProtectionRowSchema.parse(row));

    return {
      success: true,
      data: validatedRows,
      metadata: {
        count: validatedRows.length,
        cached: false
      }
    };
  } catch (error) {
    console.error('getBurstProtectionData error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}
```

#### Step 2: Refactor Next.js API Routes (Thin Wrappers)

**Update `src/app/api/burst-protection/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getBurstProtectionData } from '@/lib/api/burstProtection';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const params = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    advertiserId: searchParams.get('advertiserId') || undefined,
    campaignId: searchParams.get('campaignId') || undefined,
  };

  // Check cache
  const cacheKey = `burst-protection:${JSON.stringify(params)}`;
  const nocache = searchParams.get('nocache') === 'true';

  if (!nocache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  // Call shared business logic
  const result = await getBurstProtectionData(params);

  // Cache result
  if (result.success) {
    cache.set(cacheKey, result, 300); // 5 min TTL
  }

  return NextResponse.json(result);
}
```

**Key changes:**
- API route is now a thin wrapper around shared logic
- All business logic moved to `src/lib/api/burstProtection.ts`
- Cache handling remains in API route (web-specific)

#### Step 3: Create Electron Express Server

**Create `electron/server/api.ts`:**

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import { getBurstProtectionData } from '../../src/lib/api/burstProtection';
import { getMetrics } from '../../src/lib/api/metrics';
import { getAdvertisers } from '../../src/lib/api/advertisers';
import { getCampaigns } from '../../src/lib/api/campaigns';

export function createAPIServer(port: number = 3001) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Logging
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // Burst protection data endpoint
  app.get('/api/burst-protection', async (req: Request, res: Response) => {
    try {
      const params = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        advertiserId: req.query.advertiserId as string | undefined,
        campaignId: req.query.campaignId as string | undefined,
      };

      const result = await getBurstProtectionData(params);
      res.json(result);
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // Metrics endpoint
  app.get('/api/burst-protection/metrics', async (req: Request, res: Response) => {
    try {
      const params = { /* parse query params */ };
      const result = await getMetrics(params);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Advertisers endpoint
  app.get('/api/burst-protection/advertisers', async (req: Request, res: Response) => {
    try {
      const result = await getAdvertisers();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Campaigns endpoint
  app.get('/api/burst-protection/campaigns', async (req: Request, res: Response) => {
    try {
      const advertiserId = req.query.advertiserId as string | undefined;
      const result = await getCampaigns(advertiserId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Health check
  app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
      const { db } = await import('../../src/lib/db/vertica');
      const healthy = await db.healthCheck();
      res.json({ success: healthy, message: healthy ? 'OK' : 'Failed' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`✅ API server running on http://localhost:${port}`);
  });

  return server;
}
```

**Benefits:**
- ✅ Uses same business logic as Next.js API routes
- ✅ No code duplication
- ✅ Single source of truth
- ✅ Easy to maintain and test

#### Step 4: Frontend API Base URL

**Create `src/lib/config/api.ts`:**

```typescript
import isElectron from 'is-electron';

// Detect if running in Electron (works in both renderer and Node.js)
const IS_ELECTRON = isElectron();

// API base URL
export const API_BASE_URL = IS_ELECTRON
  ? 'http://localhost:3001'  // Electron Express server
  : '';                       // Next.js API routes (same origin)

// Export for use in components
export { IS_ELECTRON };

// Log only in browser/renderer process
if (typeof window !== 'undefined') {
  console.log(`API mode: ${IS_ELECTRON ? 'Electron' : 'Next.js'}`);
}
```

**Why use `is-electron`:**
- ✅ Battle-tested package used by 149+ projects
- ✅ Works reliably in both main and renderer processes
- ✅ Handles edge cases (ASAR, custom user agents, etc.)
- ✅ Lightweight (no dependencies)
- ✅ More robust than `window.electronAPI` check

**Update TanStack Query hooks to use base URL:**

```typescript
// src/lib/hooks/useBurstProtectionData.ts
import { API_BASE_URL } from '@/lib/config/api';

export function useBurstProtectionData(filters: FilterParams) {
  return useQuery({
    queryKey: ['burst-protection', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`${API_BASE_URL}/api/burst-protection?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    // ...
  });
}
```

### Why This Approach is Best

1. **DRY Principle** (from CLAUDE.md): Single source of truth for business logic
2. **Easy Maintenance**: Fix bugs in one place
3. **Type Safety**: Shared TypeScript types across both modes
4. **Zero Impact**: Existing Next.js workflow completely unaffected
5. **Simple Migration**: Refactor one API route at a time

### electron-builder Configuration

**Create `electron-builder.yml`:**

```yaml
appId: com.taboola.burst-protection-analysis
productName: Burst Protection Analysis
copyright: Copyright © 2025 Taboola

directories:
  output: dist
  buildResources: electron/resources

files:
  - out/**/*               # Next.js static export
  - electron/dist/**/*     # Compiled Electron code
  - package.json
  - node_modules/**/*

extraResources:
  - electron/static/**/*   # Config window HTML

mac:
  category: public.app-category.developer-tools
  target:
    - dmg
    - zip
  icon: electron/resources/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: electron/resources/entitlements.mac.plist
  entitlementsInherit: electron/resources/entitlements.mac.plist

win:
  target:
    - nsis
    - portable
  icon: electron/resources/icon.ico

linux:
  target:
    - AppImage
    - deb
  icon: electron/resources/icon.png
  category: Development

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

### TypeScript Configuration for Electron

**Create `tsconfig.electron.json`:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "electron/dist",
    "target": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": [
    "electron/**/*"
  ],
  "exclude": [
    "node_modules",
    "out",
    "dist"
  ]
}
```

### Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",

    "electron:dev": "concurrently \"pnpm dev\" \"pnpm electron:watch\" \"pnpm electron:start\"",
    "electron:watch": "tsc -p tsconfig.electron.json --watch",
    "electron:start": "wait-on http://localhost:3000 && electron ./electron/dist/main.js",
    "electron:build": "cross-env NEXT_BUILD_TARGET=electron next build && tsc -p tsconfig.electron.json && electron-builder",
    "electron:build:mac": "pnpm electron:build --mac",
    "electron:build:win": "pnpm electron:build --win",
    "electron:build:linux": "pnpm electron:build --linux"
  }
}
```

**Key changes:**
- `electron:dev`: Runs Next.js dev server, Electron TypeScript watcher, and Electron app simultaneously
- `electron:start`: Waits for Next.js dev server to be ready before launching Electron
- `electron:build`: Sets `NEXT_BUILD_TARGET=electron` to enable static export mode

### Required Dependencies

**Add to package.json:**

```json
{
  "devDependencies": {
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "electron-devtools-installer": "^3.2.0",
    "concurrently": "^9.1.2",
    "cross-env": "^7.0.3",
    "wait-on": "^8.0.1",
    "electron-reloader": "^1.2.3"
  },
  "dependencies": {
    "electron-store": "^11.0.0",
    "electron-log": "^5.4.3",
    "electron-util": "^0.17.2",
    "electron-is-dev": "^3.0.1",
    "is-electron": "^2.2.2",
    "express": "^4.21.2",
    "@types/express": "^5.0.0",
    "cors": "^2.8.5",
    "@types/cors": "^2.8.17"
  }
}
```

**Key packages explained:**

**Production Dependencies:**
- **electron-store** (v11+): Simple data persistence for user settings, credentials, and app state. Uses JSON storage with encryption support.
- **electron-log** (v5+): Professional logging with file and console transports. No dependencies, no complex configuration.
- **electron-util** (v0.17+): Useful utilities for Electron (platform detection, app info, etc.). Works in both main and renderer processes.
- **electron-is-dev** (v3+): Detects if app is running in development or production mode.
- **is-electron** (v2+): Detects if code is running in Electron environment (vs regular browser).
- **express + cors**: API server for Electron production mode.

**Development Dependencies:**
- **electron-devtools-installer** (v3+): Automatically installs React DevTools, Redux DevTools, etc. in development mode.
- **electron-reloader**: Hot reload for Electron main process during development.
- **concurrently**: Run multiple npm scripts in parallel (Next.js dev + Electron).
- **cross-env**: Set environment variables cross-platform.
- **wait-on**: Wait for Next.js dev server to be ready before launching Electron.

---

## Development Workflow

### Local Development Process

1. **Start Next.js dev server:**
   ```bash
   pnpm dev
   ```

2. **In separate terminal, compile Electron code and start Electron:**
   ```bash
   pnpm electron:dev
   ```

3. **Electron will:**
   - Show config window (if no credentials)
   - After config, load `http://localhost:3000` in dashboard window
   - Hot reload works for both Next.js and Electron code changes

### Development Environment Detection

**In `electron/main.ts`:**

```typescript
import { app, BrowserWindow } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = isDev ? 'debug' : 'info';

app.whenReady().then(async () => {
  // Install React DevTools in development
  if (isDev) {
    try {
      const name = await installExtension(REACT_DEVELOPER_TOOLS, {
        loadExtensionOptions: { allowFileAccess: true }
      });
      log.info(`Added Extension: ${name}`);
    } catch (err) {
      log.error('DevTools extension failed to install:', err);
    }
  }

  // Create dashboard window
  const dashboardWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload/dashboardPreload.js')
    }
  });

  if (isDev) {
    // Load from dev server
    log.info('Loading dashboard from dev server: http://localhost:3000');
    await dashboardWindow.loadURL('http://localhost:3000');

    // Open DevTools
    dashboardWindow.webContents.openDevTools();
  } else {
    // Load from static export
    log.info('Loading dashboard from static export');
    await dashboardWindow.loadFile('out/index.html');
  }
});
```

**Benefits of using `electron-is-dev` + `electron-log` + `electron-devtools-installer`:**
- ✅ Reliable development detection (handles edge cases like packaged dev builds)
- ✅ Professional logging with file output for debugging production issues
- ✅ Automatic React DevTools installation in development
- ✅ Cleaner, more maintainable code

### Hot Reload Configuration

**Use `electron-reloader` for development:**

```typescript
// electron/main.ts (at the top)
import isDev from 'electron-is-dev';

if (isDev) {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: false  // Next.js handles its own HMR
    });
  } catch (err) {
    console.error('electron-reloader failed:', err);
  }
}
```

---

## Implementation Steps

### Phase 1: Foundation & Dual-Mode Setup (Week 1)

1. **Install Dependencies**
   ```bash
   # Electron core + build tools
   pnpm add -D electron electron-builder electron-devtools-installer

   # Development workflow
   pnpm add -D concurrently cross-env wait-on electron-reloader

   # Production dependencies
   pnpm add electron-store electron-log electron-util electron-is-dev is-electron

   # API server
   pnpm add express cors
   pnpm add -D @types/express @types/cors
   ```

2. **Update Next.js Configuration for Dual-Mode**
   - Modify `next.config.ts` with conditional static export
   - Test regular build: `pnpm build` (should work normally)
   - Test Electron build: `NEXT_BUILD_TARGET=electron pnpm build` (should create `out/`)

3. **Create Directory Structure**
   - Create `electron/` folder with all subdirectories
   - Create `src/lib/api/` for shared business logic
   - Create `src/lib/config/` for API configuration
   - Create placeholder files

4. **Configure TypeScript**
   - Create `tsconfig.electron.json`
   - Update `tsconfig.json` to exclude `electron/` directory

5. **Update package.json**
   - Add Electron scripts (see package.json section)
   - Set `"main": "electron/dist/main.js"`

6. **Create Basic Main Process**
   - Simple Electron app that opens a window
   - Test that Electron launches: `pnpm electron:start`

### Phase 2: API Refactoring (Week 1-2)

**Goal:** Extract business logic from API routes to shared functions

7. **Create API Base URL Detection**
   - Create `src/lib/config/api.ts`
   - Implement Electron detection logic
   - Export `API_BASE_URL` constant

8. **Refactor Burst Protection API**
   - Create `src/lib/api/burstProtection.ts`
   - Extract logic from `src/app/api/burst-protection/route.ts`
   - Update API route to be thin wrapper
   - Test that regular Next.js mode still works

9. **Refactor Metrics API**
   - Create `src/lib/api/metrics.ts`
   - Extract logic from `src/app/api/burst-protection/metrics/route.ts`
   - Update API route to be thin wrapper

10. **Refactor Advertisers & Campaigns APIs**
    - Create `src/lib/api/advertisers.ts`
    - Create `src/lib/api/campaigns.ts`
    - Extract logic from respective API routes
    - Update routes to be thin wrappers

11. **Update React Hooks**
    - Update all TanStack Query hooks to use `API_BASE_URL`
    - Test in browser that everything still works
    - No visible changes to user

12. **Create Electron Express Server**
    - Create `electron/server/api.ts`
    - Implement all API endpoints using shared logic
    - Add CORS and error handling
    - Test server can start: `node -e "require('./electron/server/api').createAPIServer()"`

### Phase 3: Configuration Window (Week 2)

13. **Create Config Window**
    - `electron/static/config.html` with form UI
    - `electron/windows/configWindow.ts` for window management
    - `electron/preload/configPreload.ts` with contextBridge

14. **Implement Credential Storage**
    - `electron/config/store.ts` with electron-store
    - `electron/config/crypto.ts` for encryption using safeStorage
    - Test save/load functionality

15. **Add Connection Testing**
    - `electron/ipc/configHandlers.ts`
    - Test Vertica connection from Main Process
    - Return success/error to Config Window

16. **Polish Config UI**
    - Validation
    - Loading states
    - Error messages
    - Test button functionality

### Phase 4: Dashboard Integration (Week 2-3)

17. **Create Dashboard Window**
    - `electron/windows/dashboardWindow.ts`
    - `electron/preload/dashboardPreload.ts` (minimal API)
    - Load from `localhost:3000` (dev) or `out/index.html` (production)

18. **Environment Variable Injection**
    - `electron/utils/env.ts`
    - Inject credentials before dashboard loads
    - Test that Vertica connection pool initializes

19. **Integrate Express Server with Main Process**
    - Start Express server in Main Process after credentials loaded
    - Verify API endpoints respond correctly
    - Test dashboard can fetch data from Express server

20. **Test Dual-Mode Functionality**
    - Verify regular Next.js mode still works: `pnpm dev` → browser
    - Verify Electron dev mode: `pnpm electron:dev` → Electron window
    - Ensure both modes fetch data correctly

### Phase 5: Integration & Polish (Week 3)

21. **Complete Main Process Flow**
    - Check credentials on app start
    - Show config window if missing
    - Show dashboard after config
    - Handle window transitions smoothly

22. **Add Settings/Reconfigure Option**
    - Add "Settings" menu item to dashboard
    - IPC handler to re-open config window
    - Update credentials and restart app

23. **Development Workflow Polish**
    - Test `pnpm electron:dev` works smoothly
    - Verify hot reload for both Next.js and Electron
    - Fix any HMR issues
    - Add electron-reloader for development

### Phase 6: Build & Package (Week 3-4)

24. **electron-builder Configuration**
    - Create `electron-builder.yml`
    - Add app icons (`.icns`, `.ico`, `.png`)
    - Configure for macOS, Windows, Linux
    - Include `src/lib/api/` in electron build

25. **Test Production Builds**
    - Run `pnpm electron:build:mac` (if on macOS)
    - Test generated `.dmg` / `.app`
    - Verify credentials persist across restarts
    - Verify Express API server starts in production
    - Test full workflow end-to-end

26. **Cross-Platform Testing**
    - Build for other platforms (GitHub Actions / CI)
    - Test on Windows / Linux VMs
    - Verify all platforms work identically

### Phase 7: Testing & Documentation (Week 4)

27. **Security Audit**
    - Verify `nodeIntegration: false` in all windows
    - Verify `contextIsolation: true` in all windows
    - Review all IPC handlers for input validation
    - Test that credentials are encrypted at rest
    - Verify Express API only listens on localhost

28. **End-to-End Testing**
    - Fresh install workflow
    - Enter credentials and test connection
    - Save credentials and verify encryption
    - Load dashboard and verify all charts render
    - Test all filters and data fetching
    - Test reconfiguration flow
    - Verify app restart loads saved credentials

29. **Update Documentation**
    - Update README with Electron installation instructions
    - Document dual-mode build process
    - Add development workflow guide
    - Document API refactoring pattern
    - Add troubleshooting section for common issues

---

## Testing Strategy

### Unit Tests

**Main Process:**
- Credential encryption/decryption
- Environment variable injection
- IPC handler logic

**Renderer:**
- Form validation
- IPC communication mocks

### Integration Tests

**Config Flow:**
- Open config window
- Enter valid credentials
- Test connection succeeds
- Save credentials
- Dashboard opens

**Dashboard Flow:**
- Load dashboard with credentials
- Verify Vertica connection works
- Test API routes via Express server
- Verify UI renders correctly

### Manual Testing Checklist

- [ ] Fresh install shows config window
- [ ] Invalid credentials show error
- [ ] Test connection button works
- [ ] Credentials are encrypted at rest
- [ ] Dashboard loads after config
- [ ] All charts and data load correctly
- [ ] Settings button reopens config
- [ ] App restart loads saved credentials
- [ ] DevTools disabled in production
- [ ] No console errors
- [ ] App quits cleanly

---

## Production Considerations

### Security Checklist

- [ ] `nodeIntegration: false` in all windows
- [ ] `contextIsolation: true` in all windows
- [ ] `sandbox: true` enabled
- [ ] No raw `ipcRenderer` exposed
- [ ] All IPC inputs validated (Zod)
- [ ] Credentials encrypted at rest (`safeStorage`)
- [ ] DevTools disabled in production
- [ ] CSP (Content Security Policy) headers set
- [ ] Remote content blocked (if not needed)

### Performance Optimization

1. **Next.js Build:**
   - Use Turbopack for faster builds
   - Optimize bundle size
   - Tree-shake unused dependencies

2. **Electron:**
   - Lazy load windows
   - Use `backgroundColor` to avoid white flash
   - Implement proper window state management

3. **Database:**
   - Reuse connection pool
   - Implement query caching (already exists)
   - Add connection retry logic

### Distribution

**macOS:**
- Code signing with Apple Developer ID
- Notarization for macOS 10.15+
- DMG installer with custom background

**Windows:**
- Code signing with certificate
- NSIS installer with custom branding
- Auto-updater support

**Linux:**
- AppImage (universal)
- `.deb` package (Debian/Ubuntu)
- `.rpm` package (Fedora/RHEL) - optional

### Auto-Updates

**Use `electron-updater`:**

```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // Show notification
});

autoUpdater.on('update-downloaded', () => {
  // Prompt user to restart
});
```

**Configuration in `electron-builder.yml`:**

```yaml
publish:
  provider: github
  owner: your-org
  repo: burst-protection-analysis
  private: true
```

### Monitoring & Telemetry

**Add crash reporting:**

```typescript
import { crashReporter } from 'electron';

crashReporter.start({
  productName: 'Burst Protection Analysis',
  companyName: 'Taboola',
  submitURL: 'https://your-crash-server.com/crashes',
  uploadToServer: true
});
```

---

## Additional Best Practices

### Window Management

**State Persistence:**

```typescript
import Store from 'electron-store';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const store = new Store<{ windowState: WindowState }>();

function createWindowWithState() {
  const state = store.get('windowState', {
    width: 1400,
    height: 900
  });

  const window = new BrowserWindow({
    ...state,
    // ...
  });

  window.on('close', () => {
    const bounds = window.getBounds();
    store.set('windowState', bounds);
  });
}
```

### Menu Bar

**Add application menu:**

```typescript
import { Menu } from 'electron';

const template: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Settings',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // Open settings
        }
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

### Logging with electron-log

**Configure in `electron/main.ts`:**

```typescript
import log from 'electron-log';
import isDev from 'electron-is-dev';
import { app } from 'electron';
import path from 'path';

// Configure log levels
log.transports.file.level = 'info';
log.transports.console.level = isDev ? 'debug' : 'info';

// Set custom log file location
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('userData'), 'logs', 'main.log');

// Add timestamp format
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Log app startup
log.info('=================================');
log.info('Burst Protection Analysis Starting');
log.info(`Version: ${app.getVersion()}`);
log.info(`Environment: ${isDev ? 'development' : 'production'}`);
log.info(`Platform: ${process.platform}`);
log.info(`User Data: ${app.getPath('userData')}`);
log.info('=================================');

// Replace console methods to use electron-log
console.log = log.log;
console.info = log.info;
console.warn = log.warn;
console.error = log.error;
console.debug = log.debug;

// Example usage throughout the app
log.info('App started successfully');
log.error('Database connection failed:', error);
log.debug('Query params:', params);
```

**Benefits:**
- ✅ Automatically logs to file: `~/Library/Logs/burst-protection-analysis/main.log` (macOS)
- ✅ Works in both main and renderer processes
- ✅ Console output in development, file logging in production
- ✅ No configuration needed for basic usage
- ✅ Rotates log files automatically

---

## Conclusion

This plan provides a comprehensive roadmap for converting the Burst Protection Analysis Dashboard to an Electron desktop application with:

✅ Secure credential management with pre-launch configuration window
✅ Modern Electron architecture with contextBridge IPC
✅ Next.js 15 static export for the dashboard
✅ Cross-platform build and packaging
✅ Production-ready security best practices
✅ Clear implementation timeline (3-4 weeks)

**Next Steps:**

1. Review and approve this plan
2. Clarify any questions or concerns
3. Begin Phase 1 implementation
4. Set up development environment
5. Create initial Electron structure

**Estimated Effort:**
- Development: 4 weeks (1 developer)
  - Week 1: Foundation, dual-mode setup, API refactoring (Phase 1-2)
  - Week 2: Configuration window, dashboard integration (Phase 3-4)
  - Week 3: Integration, polish, builds (Phase 5-6)
  - Week 4: Testing, documentation (Phase 7)
- Total: 4 weeks to production-ready Electron app

**Why This Approach Works:**
1. ✅ **Zero Breaking Changes**: Regular Next.js workflow remains 100% functional
2. ✅ **DRY Principle**: Shared business logic eliminates code duplication
3. ✅ **Easy Maintenance**: Fix bugs once, benefits both modes
4. ✅ **Type Safety**: Shared TypeScript types across Next.js and Electron
5. ✅ **Gradual Migration**: Refactor one API route at a time
6. ✅ **Production Ready**: Full security, cross-platform support, auto-updates

---

## Appendix: References

### Official Documentation
- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [Electron Security Tutorial](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [electron-builder](https://www.electron.build/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

### Third-Party Libraries (npm)
- **[electron-store](https://github.com/sindresorhus/electron-store)** (v11+) - Simple data persistence for Electron
- **[electron-log](https://github.com/megahertz/electron-log)** (v5+) - Simple logging for Electron apps
- **[electron-util](https://github.com/sindresorhus/electron-util)** (v0.17+) - Useful utilities for Electron
- **[electron-is-dev](https://github.com/sindresorhus/electron-is-dev)** (v3+) - Check if Electron is in development
- **[is-electron](https://github.com/cheton/is-electron)** (v2+) - Detect if running in Electron
- **[electron-devtools-installer](https://github.com/MarshallOfSound/electron-devtools-installer)** (v3+) - Install React/Redux DevTools
- **[electron-reloader](https://github.com/sindresorhus/electron-reloader)** - Hot reload for Electron during development

### Why These Libraries?
All recommended libraries are:
- ✅ **Battle-tested**: Used by hundreds of production Electron apps
- ✅ **Actively maintained**: Regular updates and bug fixes
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Well-documented**: Clear examples and API documentation
- ✅ **Minimal dependencies**: Lightweight and secure
- ✅ **Cross-platform**: Work on macOS, Windows, and Linux
