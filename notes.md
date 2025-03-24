## Notes

## Markdown
- [GitHub Flavoured Markdown](https://github.github.com/gfm/). But can be disabled to use a selt of remark plugins for MDX, for example.
- When fetching data from your collections with the helper functions getCollection() or getEntry(), your Markdown’s frontmatter properties are available on a data object (e.g. post.data.title). Additionally, body contains the raw, uncompiled body content as a string.
- Slugs for headings are available on import
- third-party remark and rehype plugins: add table of contents; style your markdown. See [Awesome remark](https://github.com/remarkjs/awesome-remark)
- Astro does not include built-in support for remote Markdown outside of content collections. If you do it you will need your own markdown parser. Consider using a content collections loader instead.

Get markdown content:
```astro
---
// Import statement
import {Content as PromoBanner} from '../components/promoBanner.md';

// Collections query
import { getEntry, render } from 'astro:content';

const product = await getEntry('products', 'shirt');
const { Content } = await render(product);
---
<h2>Today's promo</h2>
<PromoBanner />

<p>Sale Ends: {product.data.saleEndDate.toDateString()}</p>
<Content />
```

## Content collections
- You can create a collection any time you have a group of related data or content that shares a common structure.
- Collections help to organize and query your documents, enable Intellisense and type checking in your editor, and provide automatic TypeScript type-safety for all of your content.
- Use a loader and an optional schema
- The glob() loader creates entries from directories of Markdown, MDX, Markdoc, JSON, or YAML files from anywhere on the filesystem.
- The file() loader creates multiple entries from a single local file. Use this loader when your data file can be parsed as an array of objects. Optionally takes a parser function. CSV, TOML, custom parsers, nested JSON easy to handle.
- You can build a custom loader to fetch remote content from any data source, such as a CMS, a database, or an API endpoint. Must return and array of entries with an id property (see below).
- Or use the [Content loader API](https://docs.astro.build/en/reference/content-loader-reference/).
- You can distribute your loader as an NPM package.
- Schemas done with [Zod](https://github.com/colinhacks/zod). Import as z from astro:content. Some features of Zod are not available e.g. custom validation checks on images.
- Use `reference` to define a schema entry from another schema.
- Any references defined in your schema must be queried separately after first querying your collection entry.
- Query collection with `getCollection()` and `getEntry()`, returning array of entries or a single entry, both with `id`, `data` and `body` with unmpiled body of markdown.
- Once queried, render with `render()`.
- `getCollection` takes an optional `filter` callback.
- Generate routes: use the getStaticPaths() function to create multiple pages from a single page component (e.g. src/pages/[slug]) during your build.
- If your custom slugs contain the / character to produce URLs with multiple path segments, you must use a rest parameter (e.g. [...slug]) in the .astro filename for this dynamic routing page.
- For server side routing, the url depends on the request so use `Astro.request` or `Astro.params`.


local data:
```astro
// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { glob, file } from 'astro/loaders';

// 3. Define your collection(s)
const blog = defineCollection({ /* ... */ });
const dogs = defineCollection({ /* ... */ });

// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog, dogs };
```

remote data:
``` astro
const countries = defineCollection({
  loader: async () => {
    const response = await fetch("https://restcountries.com/v3.1/all");
    const data = await response.json();
    // Must return an array of entries with an id property, or an object with IDs as keys and entries as values
    return data.map((country) => ({
      id: country.cca3,
      ...country,
    }));
  },
  schema: /* ... */
});
```

Schema with Zod:
``` astro
// Example: A cheatsheet of many common Zod datatypes
import { z, defineCollection } from 'astro:content';

defineCollection({
  schema: z.object({
    isDraft: z.boolean(),
    title: z.string(),
    sortOrder: z.number(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    author: z.string().default('Anonymous'),
    language: z.enum(['en', 'es']),
    tags: z.array(z.string()),
    footnote: z.string().optional(),

    // In YAML, dates written without quotes around them are interpreted as Date objects
    publishDate: z.date(), // e.g. 2024-09-17

    // Transform a date string (e.g. "2022-07-08") to a Date object
    updatedDate: z.string().transform((str) => new Date(str)),

    authorContact: z.string().email(),
    canonicalURL: z.string().url(),
  })
})
```

Use of `reference`:
``` astro
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    // Reference a single author from the `authors` collection by `id`
    author: reference('authors'),
    // Reference an array of related posts from the `blog` collection by `slug`
    relatedPosts: z.array(reference('blog')),
  })
});

const authors = defineCollection({
  loader: glob({ pattern: '**/[^_]*.json', base: "./src/data/authors" }),
  schema: z.object({
    name: z.string(),
    portfolio: z.string().url(),
  })
});

export const collections = { blog, authors };
```

Secondary query to get reference:
``` astro
---
import { getEntry, getEntries } from 'astro:content';

const blogPost = await getEntry('blog', 'welcome');

// Resolve a singular reference (e.g. `{collection: "authors", id: "ben-holmes"}`)
const author = await getEntry(blogPost.data.author);
// Resolve an array of references
// (e.g. `[{collection: "blog", id: "about-me"}, {collection: "blog", id: "my-year-in-review"}]`)
const relatedPosts = await getEntries(blogPost.data.relatedPosts);
---

<h1>{blogPost.data.title}</h1>
<p>Author: {author.data.name}</p>

<!-- ... -->

<h2>You might also like:</h2>
{relatedPosts.map(post => (
  <a href={post.id}>{post.data.title}</a>
))}
```

Render content:
``` astro 
---
import { getEntry, render } from 'astro:content';

const entry = await getEntry('blog', 'post-1');
if (!entry) {
  // Handle Error, for example:
  throw new Error('Could not find blog post 1');
}
const { Content, headings } = await render(entry);
---
<p>Published on: {entry.data.published.toDateString()}</p>
<Content />
```

Filter query:
``` astro
// Example: Filter out content entries with `draft: true`
import { getCollection } from 'astro:content';
const publishedBlogEntries = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});
```

Static routing:
``` astro
---
import { getCollection, render } from 'astro:content';
// 1. Generate a new path for every collection entry
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { id: post.id },
    props: { post },
  }));
}
// 2. For your template, you can get the entry directly from the prop
const { post } = Astro.props;
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

Server side routing:
``` astro
---
import { getEntry, render } from "astro:content";
// 1. Get the slug from the incoming server request
const { id } = Astro.params;
if (id === undefined) {
  return Astro.redirect("/404");
}
// 2. Query for the entry directly using the request slug
const post = await getEntry("blog", id);
// 3. Redirect if the entry does not exist
if (post === undefined) {
  return Astro.redirect("/404");
}
// 4. Render the entry to HTML in the template
const { Content } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```