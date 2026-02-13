import { renderMarkdown } from "../src/utils/markdown";

async function test() {
  const markdown = "![Graph](/graphs/test.svg)";
  const html = await renderMarkdown(markdown);
  console.log("Input:", markdown);
  console.log("Output:", html);
}

test().catch(console.error);
