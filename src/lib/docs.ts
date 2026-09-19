import { defineDocs } from 'fumadocs-mdx/macro';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // load compiled content per page instead of bundling every page together
    async: true,
  },
});
