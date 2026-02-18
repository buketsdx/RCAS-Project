---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
RCAS (Retail Central Accounting System) is a comprehensive accounting and retail management platform. It features a modern React-based frontend, a Supabase (PostgreSQL) database, and an event-driven backend powered by the Motia framework.

## Repository Structure
- **Root**: Contains the frontend React application, global configuration files, and Supabase schema definitions.
- **backend/**: An event-driven, type-safe backend component built with the Motia framework.
- **server/**: A lightweight Express-based API server using `lowdb` for local data management.
- **supabase/**: Configuration and setup for the Supabase backend services.

### Main Repository Components
- **Frontend (React)**: Main user interface for managing ledgers, vouchers, and accounting reports.
- **Motia Backend**: Handles background processes, events, and complex backend logic.
- **Express Server**: Provides a supplemental API for the frontend.

## Projects

### Frontend (Root)
**Configuration File**: [./package.json](./package.json)

#### Language & Runtime
**Language**: JavaScript (React)  
**Version**: React 19.2.0, Vite 7.2.4  
**Build System**: Vite  
**Package Manager**: npm  

#### Dependencies
**Main Dependencies**:
- `@supabase/supabase-js`: Supabase integration
- `@tanstack/react-query`: Data fetching and state management
- `react-router-dom`: Navigation
- `lucide-react`: Icon set
- `@radix-ui/*`: UI component primitives
- `tailwindcss`: Styling (v3.4.17)
- `zod`: Schema validation

**Development Dependencies**:
- `eslint`: Linting
- `postcss`, `autoprefixer`: CSS processing

#### Build & Installation
```bash
npm install
npm run dev
npm run build
```

#### Testing
**Framework**: No explicit test framework detected in root (typical SPA setup).
**Test Location**: N/A
**Naming Convention**: N/A
**Configuration**: N/A

**Run Command**:
```bash
npm run lint
```

---

### Motia Backend (`backend/`)
**Configuration File**: [./backend/package.json](./backend/package.json)

#### Language & Runtime
**Language**: TypeScript  
**Version**: TypeScript 5.7.3  
**Build System**: Motia CLI  
**Package Manager**: npm  

#### Dependencies
**Main Dependencies**:
- `motia`: Core framework
- `@motiadev/core`: Motia core libraries
- `@motiadev/plugin-*`: Various Motia plugins (Cron, WS, Streams, etc.)
- `zod`: Type-safe schema validation

**Development Dependencies**:
- `@motiadev/workbench`: Development workbench
- `ts-node`: TypeScript execution

#### Build & Installation
```bash
cd backend
npm install
npm run dev
```

#### Usage & Operations
**Key Commands**:
```bash
npm run dev              # Start development server
npm run build            # Build the backend
npm run generate-types   # Regenerate Motia types
```

---

### Express Server (`server/`)
**Configuration File**: [./server/package.json](./server/package.json)

#### Language & Runtime
**Language**: Node.js (JavaScript)  
**Version**: Node.js  
**Build System**: N/A  
**Package Manager**: npm  

#### Dependencies
**Main Dependencies**:
- `express`: Web framework
- `lowdb`: Local JSON database
- `cors`: Cross-Origin Resource Sharing
- `dotenv`: Environment variable management

#### Usage & Operations
**Key Commands**:
```bash
cd server
npm start
npm run dev
```

---

### Database (Supabase)
**Type**: Non-traditional repository component

#### Key Resources
**Main Files**:
- [./supabase/config.toml](./supabase/config.toml)
- [./RCAS_FINAL_SCHEMA.sql](./RCAS_FINAL_SCHEMA.sql)
- [./supabase_schema.sql](./supabase_schema.sql)

**Configuration Structure**:
- Uses Supabase CLI configuration in `supabase/`.
- SQL schema files located in root define the PostgreSQL structure.

#### Validation
**Quality Checks**: SQL schema verification via Supabase migrations/CLI.
