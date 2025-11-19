## Notes

## Markdown

- [GitHub Flavoured Markdown](https://github.github.com/gfm/). But can be disabled to use a set of remark plugins for MDX, for example.
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
- Query collection with `getCollection()` and `getEntry()`, returning array of entries or a single entry, both with `id`, `data` and `body` with uncompiled body of markdown.
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

```astro
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

```astro
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

```astro
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

```astro
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

```astro
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

```astro
// Example: Filter out content entries with `draft: true`
import { getCollection } from 'astro:content';
const publishedBlogEntries = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});
```

Static routing:
`src/pages/posts/[id].astro`

```astro
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

```astro
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

## Web components

- Data goes in as a data attribute (JSON.stringified) or as child nodes
- Props/configuration goes in as props. The setters and getters can handle the encapsalation.
- Check out [Wired elements](https://wiredjs.com/)
- Checkout [Webcomponents](https://www.webcomponents.org/)
- Pass data in Astro using [dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)

In the class constructor, you can set up initial state and default values, register event listeners and perhaps create a shadow root. At this point, you should not inspect the element's attributes or children, or add new attributes or children. Do it in `connectedCallback()`.

Moving custom element in the DOM: If you want to preserve the element's state, you can do so by defining a `connectedMoveCallback()` lifecycle callback inside the element class, and then using the `Element.moveBefore()` method to move the element. This causes the `connectedMoveCallback()` to run instead of `connectedCallback()` and `disconnectedCallback()`. You could add an empty `connectedMoveCallback()` to stop the other two callbacks running, or include some custom logic to handle the move:

To respond to attribute changes you need:

- A static property named observedAttributes. This must be an array containing the names of all attributes for which the element needs change notifications.
- An implementation of the attributeChangedCallback() lifecycle callback.

The callback is passed three arguments:

- The name of the attribute which changed.
- The attribute's old value.
- The attribute's new value.

Autonomous custom elements (but not elements based on built-in elements) also allow you to define states and select against them using the :state() pseudo-class function.

```JS
class MyCustomElement extends HTMLElement {
  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  get collapsed() {
    return this._internals.states.has("hidden");
  }

  set collapsed(flag) {
    if (flag) {
      // Existence of identifier corresponds to "true"
      this._internals.states.add("hidden");
    } else {
      // Absence of identifier corresponds to "false"
      this._internals.states.delete("hidden");
    }
  }
}

// Register the custom element
customElements.define("my-custom-element", MyCustomElement);
```

The :state() pseudo-class can also be used within the :host() pseudo-class function to match a custom state within a custom element's shadow DOM. Additionally, the :state() pseudo-class can be used after the ::part() pseudo-element to match the shadow parts of a custom element that is in a particular state.

Shadow DOM
It's important that code running in the page should not be able to accidentally break a custom element by modifying its internal implementation. Shadow DOM enables you to attach a DOM tree to an element, and have the internals of this tree hidden from JavaScript and CSS running in the page.

For custom elements, you can make the custom element the host and then append the shadow dom:

```JS
 connectedCallback() {
    // Create a shadow root
    // The custom element itself is the shadow host
    const shadow = this.attachShadow({ mode: "open" });
    ...
    shadow.appendChild(my-element);
```

Encapsulated style can be attached:

- Programmatically, by constructing a CSSStyleSheet object and attaching it to the shadow root.
- Declaratively, by adding a `<style>` element in a `<template>` element's declaration.

```HTML
<template id="my-element">
  <style>
    span {
      color: red;
      border: .125rem dotted black;
    }
  </style>
  <span>I'm in the shadow DOM</span>
</template>

<div id="host"></div>
<span>I'm not in the shadow DOM</span>
```

```JS
const host = document.querySelector("#host");
const shadow = host.attachShadow({ mode: "open" });
const template = document.getElementById("my-element");

shadow.appendChild(template.content);
```

Templates:

```HTML
<template id="custom-paragraph">
  <p>My paragraph</p>
</template>
```

```JS
customElements.define(
  "my-paragraph",
  class extends HTMLElement {
    constructor() {
      super();
      let template = document.getElementById("custom-paragraph");
      let templateContent = template.content;

      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(templateContent.cloneNode(true));
    }
  },
);

```

Slots:

```HTML
<template id="custom-paragraph">
  <style>
    p {
      color: white;
      background-color: #666;
      padding: .3125rem;
    }
  </style>
  <p>
    <slot name="my-text">My default text</slot>
    <slot></slot>
  </p>
</template>
```

Use like this (note use of unnamed slot):

```HTML
<my-paragraph>
  <span slot="my-text">Let's have some different text!</span>
  <span>This will go into the unnamed slot</span>
  <span>This will also go into the unnamed slot</span>
</my-paragraph>
```

[Useful examples of web component stuff](https://github.com/mdn/web-components-examples/tree/main)

## Using lit

The @ symbol gave an illegal character error U+0040. This was fixed by adding this to the TS config. See [Lit decorators docs](https://lit.dev/docs/components/decorators/)

```TS
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true
    "useDefineForClassFields": false,
  }
```

### Property update cycle

When a property changes, the following sequence occurs:

- The property's setter is called.
- The setter calls the component's requestUpdate method.
- The property's old and new values are compared.
- By default Lit uses a strict inequality test to determine if the value has changed (that is newValue !== oldValue).
- If the property has a hasChanged function, it's called with the property's old and new values.
- If the property change is detected, an update is scheduled asynchronously. If an update is already scheduled, only a single update is executed.
- The component's update method is called, reflecting changed properties to attributes and re-rendering the component's templates.

Note that if you mutate an object or array property, it won't trigger an update, because the object itself hasn't changed. For more information, see Mutating object and array properties.

### State

Internal reactive state refers to reactive properties that are not part of the component's public API. These state properties don't have corresponding attributes, and aren't intended to be used from outside the component. Internal reactive state should be set by the component itself

### Standard custom element lifecycle

Lit components use the standard custom element lifecycle methods. In addition Lit introduces a reactive update cycle that renders changes to DOM when reactive properties change.

If you need to customize any of the standard custom element lifecycle methods, make sure to call the super implementation (such as super.connectedCallback()) so the standard Lit functionality is maintained.
