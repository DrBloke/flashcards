import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

export async function renderMarkdown(content: string) {
  const schema = { ...defaultSchema };
  // deep copy protocols to avoid mutating defaultSchema if it's shared? (it probably is frozen or shared)
  // But strictly speacking defaultSchema is imported.
  // Let's be safe.
  if (schema.protocols) {
    schema.protocols = { ...schema.protocols };
    // Remove src protocol check to allow relative paths (e.g. /graphs/...)
    delete schema.protocols.src;
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      ...schema,
      tagNames: [
        ...(schema.tagNames || []),
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
        "img",
      ],
      attributes: {
        ...schema.attributes,
        "*": ["className", "style"],
        math: ["xmlns", "display"],
        annotation: ["encoding"],
        img: ["src", "alt", "title", "width", "height"],
      },
    })
    .use(rehypeKatex)
    .use(() => {
      return (tree) => {
        import("unist-util-visit").then(({ visit }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          visit(tree, "element", (node: any) => {
            if (
              node.tagName === "img" &&
              node.properties &&
              typeof node.properties.src === "string"
            ) {
              const src = node.properties.src.toLowerCase().trim();
              // Security: Block dangerous protocols since we disabled strict protocol strictness for relative paths
              if (
                src.startsWith("javascript:") ||
                src.startsWith("vbscript:") ||
                src.startsWith("data:")
              ) {
                delete node.properties.src;
                return;
              }

              if (node.properties.src.startsWith("/")) {
                const baseUrl = import.meta.env.BASE_URL;
                // Ensure we don't double slash or mess up if BASE_URL is just /
                const cleanBase = baseUrl.endsWith("/")
                  ? baseUrl.slice(0, -1)
                  : baseUrl;
                node.properties.src = `${cleanBase}${node.properties.src}`;
              }
            }
          });
        });
      };
    })
    .use(rehypeShiki, {
      theme: "github-dark",
    })
    .use(rehypeStringify);

  const result = await processor.process(content);
  return result.toString();
}
