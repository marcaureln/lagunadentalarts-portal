# Laguna Dental Arts Website

The goal of this project is to redesign and redevelop the official website of Laguna Dental Arts, a high-end dental lab, to reflect the quality, precision, and professionalism of its services. The new site will maintain the current structure of approximately 13 informational pages, but with a modern frontend, improved user experience, and a fully responsive design optimized for mobile and desktop devices.

## Standards

MUST FOLLOW THESE RULES, NO EXCEPTIONS

- Stack: Nuxt.js 3, Vue.js, TypeScript, TailwindCSS v4, Nuxt Content, VueUse
- Patterns: ALWAYS use Composition API + `<script setup>`, NEVER use Options API
- ALWAYS Keep types alongside your code, use TypeScript for type safety, prefer `interface` over `type` for defining types
- ALWAYS use TailwindCSS classes rather than manual CSS
- DO NOT hard code colors, use Tailwind's color system
- ONLY add meaningful comments that explain why something is done, not what it does
- Dev server is already running on `http://localhost:3000` with HMR enabled. NEVER launch it yourself
- ALWAYS use named functions when declaring methods, use arrow functions only for callbacks
- ALWAYS prefer named exports over default exports

## Project Structure

Keep this section up to date with the project structure. Use it as a reference to find files and directories.

EXAMPLES are there to illustrate the structure, not to be implemented as-is.

> **⚠️ IMPORTANT: Nuxt 4 Directory Structure**
>
> This project uses `compatibilityVersion: 4` in `nuxt.config.ts`, which means it follows the **Nuxt 4 directory structure**.
>
> **Key differences from Nuxt 3:**
>
> - Most directories (pages, components, layouts, middleware, etc.) are now inside the `app/` folder
> - Server-side code remains in the `server/` folder at the root
> - Configuration files remain at the root

```
├── .nuxt/              # Generated files (ignored)
├── public/             # Static files (favicon, robots.txt)
├── server/             # Server-side code (API routes, middleware, utils)
│   ├── api/            # Server endpoints (e.g., /api/users.ts)
│   │   ├── users.ts    # EXAMPLE file for user-related API endpoints
│   │   └── posts.ts    # EXAMPLE file for post-related API endpoints
│   ├── routes/         # Server routes (e.g., /auth/login)
│   ├── middleware/     # Server middleware
│   └── utils/          # Server utilities
├── app/                # ⚠️ NUXT 4: Client-side code goes here
│   ├── components/     # Reusable Vue components (auto-imported)
│   │   ├── ui/         # Base UI components
│   │   ├── layout/     # Layout components
│   │   └── features/   # Feature-specific components
│   │       └── home/
│   ├── composables/    # Composition functions (auto-imported)
│   ├── layouts/        # ⚠️ NUXT 4: Layouts are in app/layouts/
│   │   ├── default.vue
│   │   └── portal.vue
│   ├── middleware/     # ⚠️ NUXT 4: Middleware is in app/middleware/
│   │   └── auth-guard.global.ts
│   ├── pages/          # ⚠️ NUXT 4: Pages are in app/pages/
│   │   ├── (home).vue  # Renders at /
│   │   ├── users/
│   │   │   └── index.vue   # Renders at /users
│   │   │   └── [userId].vue# Renders at /users/:userId
│   │   └── about.vue   # Renders at /about
│   ├── plugins/        # Vue plugins (auto-loaded)
│   ├── utils/          # Client-side utility pure functions (auto-imported)
│   └── app.vue         # Root Vue component
├── assets/             # Vite-processed assets (CSS/SCSS)
├── stores/             # Pinia stores (at root or in app/)
├── queries/            # Pinia Colada queries (optional, but retained for data separation)
│   ├── users.ts        # EXAMPLE file for user-related queries
│   └── posts.ts        # EXAMPLE file for post-related queries
└── nuxt.config.ts      # Nuxt configuration

```

## Project Commands

Frequently used commands:

- `pnpm run build`: bundles the project for production
- `pnpm run lint`: runs the linter to check code quality
- `pnpm run typecheck`: checks TypeScript types
- `pnpm run postinstall`: runs after dependencies are installed

## Development Workflow

ALWAYS follow the workflow when implementing a new feature or fixing a bug. This ensures consistency, quality, and maintainability of the codebase.

1. Plan your tasks, review them with user. Include tests when possible
2. Write code, following the [project structure](#project-structure) and [conventions](#standards)
3. Review changes and analyze the need of refactoring

## Research & Documentation

- **NEVER hallucinate or guess URLs**
- ALWAYS try accessing the `llms.txt` file first to find relevant documentation. EXAMPLE: `https://pinia-colada.esm.dev/llms.txt`
  - If it exists, it will contain other links to the documentation for the LLMs used in this project
- ALWAYS follow existing links in table of contents or documentation indices
- Verify examples and patterns from documentation before using
