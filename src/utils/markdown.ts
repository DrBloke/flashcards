import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

export async function renderMarkdown(content: string) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      ...defaultSchema,
      tagNames: [
        ...(defaultSchema.tagNames || []),
        "math",
        "semantics",
        "annotation",
        "mrow",
        "mi",
        "mo",
        "mn",
        "msup",
        "msub",
        "mfrac",
        "msqrt",
        "mroot",
        "mover",
        "munder",
        "munderover",
        "mtable",
        "mtr",
        "mtd",
        "mtext",
        "mspace",
      ],
      attributes: {
        ...defaultSchema.attributes,
        "*": ["className", "style"],
        math: ["xmlns", "display"],
        annotation: ["encoding"],
      },
    })
    .use(rehypeKatex)
    .use(rehypeShiki, {
      theme: "github-dark",
    })
    .use(rehypeStringify);

  const result = await processor.process(content);
  return result.toString();
}
