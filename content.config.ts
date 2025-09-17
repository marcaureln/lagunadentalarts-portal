import { defineContentConfig, defineCollection, z } from '@nuxt/content';

const pages = defineCollection({
  type: 'page',
  source: 'pages/*.md',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

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
        showOnHome: z.boolean(),
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

const careers = defineCollection({
  type: 'data',
  source: 'careers.yml',
  schema: z.object({
    jobs: z.array(
      z.object({
        title: z.string(),
        department: z.string(),
        location: z.string(),
        type: z.string(),
        expiresAt: z.string(),
        description: z.string().optional(),
        requirements: z.array(z.string()).optional(),
      })
    ),
  }),
});

const faq = defineCollection({
  type: 'data',
  source: 'faq.yml',
  schema: z.object({
    categories: z.array(
      z.object({
        title: z.string(),
        questions: z.array(
          z.object({
            question: z.string(),
            answer: z.string(),
          })
        ),
      })
    ),
  }),
});

const products = defineCollection({
  type: 'data',
  source: 'products.yml',
  schema: z.object({
    hero: z.object({
      title: z.string(),
      description: z.string(),
    }),
    products: z.array(
      z.object({
        title: z.string(),
        desc: z.string(),
        detailedDesc: z.string(),
        image: z.string().optional(),
      })
    ),
  }),
});

export default defineContentConfig({
  collections: {
    pages,
    index,
    team,
    downloads,
    careers,
    faq,
    products,
  },
});
