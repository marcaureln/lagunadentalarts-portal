# Laguna Dental Arts Portal

A modern dental lab management portal built with Nuxt 4, featuring case management, user administration, and practice management capabilities. The portal provides a comprehensive dashboard for tracking dental cases, managing users and practices, with role-based access control.

## Standards

MUST FOLLOW THESE RULES, NO EXCEPTIONS

- Stack: Nuxt.js 4, Vue.js 3, TypeScript, TailwindCSS v4, Nuxt UI v4, Nuxt Content, VueUse, Prisma
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
├── .nuxt/              # Generated files (ignored)
├── public/             # Static files (favicon, logo, product images)
├── prisma/             # Database schema and migrations
│   ├── schema.prisma   # Prisma schema definition
│   ├── seed.ts         # Database seeding script
│   └── migrations/     # Database migrations
├── server/             # Server-side code (API routes, middleware, utils)
│   ├── api/            # Server endpoints
│   │   ├── admin/      # Admin-only endpoints
│   │   │   └── users.ts        # User management API
│   │   ├── practices/          # Practice management API
│   │   │   ├── index.ts        # List/create practices
│   │   │   └── [id].ts         # Get/update/delete practice
│   │   └── me.get.ts           # Current user info
│   ├── routes/         # Server routes
│   │   └── auth/       # Authentication routes (login, logout, callback)
│   ├── types/          # Server-specific types
│   │   └── user.ts     # User type definitions
│   └── utils/          # Server utilities
│       ├── prisma.ts   # Prisma client instance
│       ├── auth.ts     # Auth utilities
│       └── admin.ts    # Admin utilities
├── shared/             # ⚠️ Shared code between client and server
│   ├── config/         # Configuration files
│   │   └── routes.ts   # Route definitions and navigation config
│   ├── types/          # Shared types
│   │   ├── auth.d.ts   # Auth type definitions
│   │   └── practice.ts # Practice type definitions
│   └── utils/          # Shared utilities
│       ├── permissions.ts  # Permission checks (used by both client & server)
│       └── users.ts        # User utility functions
├── app/                # ⚠️ NUXT 4: Client-side code goes here
│   ├── components/     # Reusable Vue components (auto-imported)
│   │   ├── Portal/     # Portal-specific components
│   │   │   └── Admin/  # Admin modal components
│   │   │       ├── ModalAddUser.vue
│   │   │       ├── ModalEditPractice.vue
│   │   │       └── ...
│   │   ├── AboutCTA.vue
│   │   ├── ProductsGrid.vue
│   │   └── ...         # Other marketing site components
│   ├── layouts/        # ⚠️ NUXT 4: Layouts are in app/layouts/
│   │   ├── default.vue # Marketing site layout
│   │   ├── auth.vue    # Authentication layout
│   │   └── portal.vue  # Portal dashboard layout (UDashboardSidebar)
│   ├── middleware/     # ⚠️ NUXT 4: Middleware is in app/middleware/
│   │   └── auth-guard.global.ts  # Global auth middleware
│   ├── pages/          # ⚠️ NUXT 4: Pages are in app/pages/
│   │   ├── index.vue   # Marketing homepage
│   │   ├── about.vue   # About page
│   │   ├── portal/     # Portal pages
│   │   │   ├── index.vue       # Portal home (case dashboard)
│   │   │   └── admin/          # Admin pages
│   │   │       ├── users.vue   # User management
│   │   │       └── practices.vue # Practice management
│   │   └── auth/       # Auth pages
│   ├── assets/         # Vite-processed assets
│   │   └── css/        # Global CSS
│   ├── app.config.ts   # App configuration
│   └── app.vue         # Root Vue component
├── content/            # Nuxt Content (markdown files)
│   ├── pages/          # Content pages (privacy, terms)
│   ├── careers.yml     # Careers data
│   ├── downloads.yml   # Downloads data
│   └── faq.yml         # FAQ data
└── nuxt.config.ts      # Nuxt configuration

```

## Portal Architecture

### Layout System

- **Portal Layout** (`app/layouts/portal.vue`): Uses Nuxt UI Dashboard components
  - `UDashboardGroup`: Container for the entire dashboard
  - `UDashboardSidebar`: Collapsible/resizable sidebar with navigation
  - `UNavigationMenu`: Vertical navigation with grouped routes
  - `UAvatar`: User profile display in footer
  - `UDropdownMenu`: User menu with logout action

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
- OAuth integration with Google
- Session stored in encrypted cookies
- Protected routes via `auth-guard.global.ts` middleware
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
