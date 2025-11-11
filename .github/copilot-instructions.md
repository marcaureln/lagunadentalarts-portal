# Copilot Instructions: Laguna Dental Arts Website

## Architecture Overview

This is a **Nuxt 3 static/hybrid website** for a dental lab business, built with Tailwind CSS v4 and Nuxt Content for content management. The site uses a **content-first architecture** where business data lives in YAML files managed through strict Zod schemas.

## Key Patterns & Conventions

### Content Management

- **All business content** lives in `content/*.yml` files (team, FAQ, careers, downloads, homepage data)
- Content schemas are defined in `content.config.ts` using Zod validation
- Access content with: `await useAsyncData('key', () => queryCollection('collectionName').first())`
- Static pages use markdown in `content/pages/*.md`

### Component Structure

- **Page-specific components** follow `[PageName][Section].vue` pattern (e.g., `HomeHero.vue`, `AboutTeam.vue`)
- **Shared components** use `The[Name].vue` for layout elements (`TheNavbar.vue`, `TheFooter.vue`)
- Components are auto-imported - no manual imports needed

### Routing & Pages

- `pages/index.vue` - Homepage with section components
- `pages/[slug].vue` - Dynamic pages from `content/pages/`
- No product category pages exist yet - products are hardcoded in `HomeProducts.vue`

### Styling & Assets

- **Tailwind CSS v4** with custom theme in `app/assets/css/main.css`
- Inter font family as `--font-display`
- Images served from `/public/` directory via `<NuxtImg>`
- Custom border radius: `rounded-4xl` pattern used throughout

### SEO & Meta

- Site config in `nuxt.config.ts` under `site` object
- Page-level SEO with `useSeoMeta()` in each page component
- Global title template: `%s — Laguna Dental Arts`

## Development Workflow

### Essential Commands

```bash
pnpm dev --inspect        # Development with Node.js debugging
pnpm build               # Production build
pnpm typecheck          # TypeScript checking
pnpm lint               # ESLint with Prettier
```

### Key Files to Modify

- **Business content**: Edit `content/*.yml` files
- **Page content**: Add/edit `content/pages/*.md` files
- **Team members**: Update `content/team.yml` (set `isShowcased: true` for homepage display)
- **Navigation**: Modify `app/components/TheNavbar.vue`

### Adding New Content Types

1. Define schema in `content.config.ts`
2. Create YAML file in `content/`
3. Query with `queryCollection('name').first()` in components

## Technical Stack

- **Framework**: Nuxt 3 with future compatibility v4
- **Styling**: Tailwind CSS v4 via Vite plugin
- **Content**: Nuxt Content with Zod schemas
- **SEO**: @nuxtjs/seo module
- **Images**: @nuxt/image with optimization
- **Icons**: @nuxt/icon with Iconify (Remix Icons)
- **MCP Server**: nuxt-mcp for AI tooling integration

## Deployment Notes

- Static site generation ready (`nuxt generate`)
- Assets cached for 1 year in production
- Dockerfile included for containerized deployment
- Designed for Jamstack deployment (Vercel, Netlify, etc.)
