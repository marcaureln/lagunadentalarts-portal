import { defineContentConfig, defineCollection, z } from '@nuxt/content';

const index = defineCollection({
  type: 'data',
  source: 'index.yml',
  schema: z.object({
    featuredNumbers: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
      })
    ),
    testimonials: z.array(
      z.object({
        name: z.string(),
        org: z.string(),
        text: z.string(),
        photo: z.string(),
      })
    ),
  }),
});

const team = defineCollection({
  type: 'data',
  source: 'team.yml',
  schema: z.object({
    team: z.array(
      z.object({
        name: z.string(),
        role: z.string(),
        photo: z.string(),
        linkedIn: z.string(),
      })
    ),
  }),
});

const downloads = defineCollection({
  type: 'data',
  source: 'downloads.yml',
  schema: z.object({
    files: z.array(
      z.object({
        title: z.string(),
        link: z.string(),
      })
    ),
  }),
});

export default defineContentConfig({
  collections: {
    index,
    team,
    downloads,
  },
});
