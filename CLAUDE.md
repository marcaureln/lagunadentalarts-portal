# Laguna Dental Arts Portal

A modern dental lab management portal built with Nuxt 4, featuring case management, user administration, and practice management capabilities. The portal provides a comprehensive dashboard for tracking dental cases, managing users and practices, with role-based access control.

## Standards

MUST FOLLOW THESE RULES, NO EXCEPTIONS

- Stack: Nuxt.js 4, Vue.js 3, TypeScript, TailwindCSS v4, Nuxt UI v4, VueUse, Prisma
- Patterns: ALWAYS use Composition API + `<script setup>`, NEVER use Options API
- UI Components: ALWAYS use Nuxt UI v4 components (UButton, UCard, UTable, UDashboardPanel, etc.)
- ALWAYS Keep types alongside your code, use TypeScript for type safety, prefer `interface` over `type` for defining types
- ALWAYS use TailwindCSS classes rather than manual CSS
- DO NOT hard code colors, use Tailwind's color system and Nuxt UI theme tokens
- ONLY add meaningful comments that explain why something is done, not what it does
- Dev server is already running on `http://localhost:3000` with HMR enabled. NEVER launch it yourself
- ALWAYS use named functions when declaring methods, use arrow functions only for callbacks
- ALWAYS prefer named exports over default exports
- Icons: Use Remix Icons (i-ri-\*) for consistency across the portal

## Project Structure

Keep this section up to date with the project structure. Use it as a reference to find files and directories.

> **⚠️ IMPORTANT: Nuxt 4 Directory Structure**
>
> This project uses `compatibilityVersion: 4` in `nuxt.config.ts`, which means it follows the **Nuxt 4 directory structure**.
>
> **Key differences from Nuxt 3:**
>
> - Most directories (pages, components, layouts, middleware, etc.) are now inside the `app/` folder
> - Server-side code remains in the `server/` folder at the root
> - Configuration files remain at the root
> - Shared utilities and configs are in the `shared/` folder for use across client and server

```
├── .nuxt/                  # Generated files (ignored)
├── public/                 # Static files (favicon.png, logo.png)
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema definition
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # Database migrations
├── server/                 # Server-side code (API routes, auth, utils)
│   ├── api/                # Server endpoints
│   │   ├── admin/users/    # Admin user management API (CRUD)
│   │   ├── auth/           # Auth endpoints (e.g. password change)
│   │   ├── case-types/     # Case type lookup
│   │   ├── cases/          # Case management API (CRUD + uploads)
│   │   ├── patients/       # Patient lookups
│   │   ├── practices/      # Practice management API
│   │   └── me.get.ts       # Current user info
│   ├── routes/auth/        # Auth routes (login, logout, microsoft OAuth)
│   ├── types/user.ts       # User role types
│   └── utils/              # prisma, auth, admin, password, storage
├── shared/                 # ⚠️ Shared code between client and server
│   ├── config/routes.ts    # Sidebar navigation registry
│   ├── types/              # auth.d.ts, practice.ts
│   └── utils/              # permissions.ts, users.ts
├── app/                    # ⚠️ NUXT 4: Client-side code goes here
│   ├── components/         # Auto-imported portal components
│   │   ├── PortalCaseWizard.vue
│   │   ├── PortalCaseDetailModal.vue
│   │   ├── PortalAdminModalAddUser.vue
│   │   ├── PortalAdminModalRemoveUser.vue
│   │   ├── PortalAdminModalAddPractice.vue
│   │   └── PortalAdminModalEditPractice.vue
│   ├── layouts/
│   │   ├── default.vue     # Dashboard layout (UDashboardSidebar) — applied to all routes by default
│   │   └── auth.vue        # Minimal auth layout (used by /login)
│   ├── middleware/
│   │   └── auth-guard.global.ts  # Protects all routes; allows /login and /auth/*
│   ├── pages/              # File-based routing — portal lives at the root
│   │   ├── index.vue       # Dashboard home (case overview)
│   │   ├── cases.vue       # Cases list
│   │   ├── login.vue       # Login page (auth layout)
│   │   ├── password.vue    # Password change page (auth layout)
│   │   └── admin/          # Admin-only pages
│   │       ├── users.vue
│   │       └── practices.vue
│   ├── assets/css/         # Global CSS (Tailwind + Nuxt UI)
│   ├── app.config.ts       # App configuration (UI theme tokens)
│   └── app.vue             # Root Vue component
└── nuxt.config.ts          # Nuxt configuration
```

## Portal Architecture

### Layout System

- **Default Layout** (`app/layouts/default.vue`): The dashboard layout, applied to all portal pages by default. Uses Nuxt UI Dashboard components:
  - `UDashboardGroup`: Container for the entire dashboard
  - `UDashboardSidebar`: Collapsible/resizable sidebar with navigation
  - `UNavigationMenu`: Vertical navigation with grouped routes
  - `UAvatar`: User profile display in footer
  - `UDropdownMenu`: User menu with logout action
- **Auth Layout** (`app/layouts/auth.vue`): Minimal layout used by `/login` and `/password`. Set with `definePageMeta({ layout: 'auth' })`.

### Page Structure

All portal pages MUST use `UDashboardPanel` with the following structure:

```vue
<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Page Title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <!-- Action buttons -->
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Page content -->
    </template>
  </UDashboardPanel>
</template>
```

### Navigation & Routing

- **Route Configuration**: Centralized in `shared/config/routes.ts`
- **Permission Checks**: Centralized in `shared/utils/permissions.ts`
- **Navigation Grouping**: Admin routes are grouped under "Administration" in the sidebar
- **Role-based Routes**: Different routes shown based on user role (ADMIN, PRACTICE_ADMIN, USER, etc.)

### Authentication

- Uses `nuxt-auth-utils` for session management
- Username/password login plus Microsoft OAuth (server routes under `server/routes/auth/`)
- Session stored in encrypted cookies
- All client routes protected by `auth-guard.global.ts`; only `/login` and `/auth/*` are public
- User session accessible via `useUserSession()` composable

### Database

- **ORM**: Prisma with PostgreSQL
- **Models**: User, Practice (with relations)
- **Migrations**: Located in `prisma/migrations/`
- **Seeding**: `prisma/seed.ts` for initial data

## UI Components & Patterns

### Nuxt UI v4 Components

ALWAYS use Nuxt UI components instead of custom implementations:

- **Layout**: `UApp`, `UDashboardGroup`, `UDashboardSidebar`, `UDashboardPanel`, `UDashboardNavbar`
- **Navigation**: `UNavigationMenu`, `UDashboardSidebarCollapse`
- **Forms**: `UButton`, `UInput`, `USelectMenu`, `UTextarea`
- **Data Display**: `UTable`, `UCard`, `UBadge`, `UAvatar`, `UIcon`
- **Feedback**: `UToast`, `UDropdownMenu`, `UTooltip`

### Table Pattern

Use `h()` render functions for dynamic table content:

```typescript
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';

const columns: TableColumn<YourType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.getValue('name')),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const UBadge = resolveComponent('UBadge');
      return h(UBadge, { color: 'primary' }, () => row.getValue('status'));
    },
  },
];
```

### Icons

- **Icon Set**: Remix Icons (`i-ri-*`)
- **Usage**: `<UIcon name="i-ri-home-line" />`
- Common icons:
  - `i-ri-home-line`: Home
  - `i-ri-user-settings-line`: User management
  - `i-ri-building-line`: Practice management
  - `i-ri-settings-3-line`: Administration
  - `i-ri-upload-2-line`: Upload actions

## Project Commands

Frequently used commands:

- `pnpm run dev`: starts the development server (already running)
- `pnpm run build`: bundles the project for production
- `pnpm run lint`: runs the linter to check code quality
- `pnpm run typecheck`: checks TypeScript types
- `pnpm run postinstall`: runs after dependencies are installed
- `pnpm prisma:generate`: generates Prisma client
- `pnpm prisma:migrate`: runs database migrations
- `pnpm prisma:seed`: seeds the database with initial data

## Development Workflow

ALWAYS follow the workflow when implementing a new feature or fixing a bug. This ensures consistency, quality, and maintainability of the codebase.

1. Plan your tasks, review them with user. Include tests when possible
2. Write code, following the [project structure](#project-structure) and [conventions](#standards)
3. Use Nuxt UI components - NEVER create custom implementations of existing components
4. For portal pages, ALWAYS use `UDashboardPanel` structure
5. Review changes and analyze the need of refactoring

## Research & Documentation

- **NEVER hallucinate or guess URLs**
- ALWAYS try accessing the `llms.txt` file first to find relevant documentation. EXAMPLE: `https://pinia-colada.esm.dev/llms.txt`
  - If it exists, it will contain other links to the documentation for the LLMs used in this project
- ALWAYS follow existing links in table of contents or documentation indices
- Verify examples and patterns from documentation before using
- **Nuxt UI Documentation**: Available via MCP server (`nuxt-ui-docs`) for component references
