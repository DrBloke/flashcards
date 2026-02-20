import { formatDueDate } from "./src/utils/dateFormatting.ts";
import { render } from "lit";
import { JSDOM } from "jsdom";

// Setup JSDOM
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;

function renderTemplate(template) {
  const container = document.createElement("div");
  render(template, container);
  return container.innerHTML.replace(/\s+/g, " ").trim();
}

try {
  const base = new Date("2026-02-20T10:00:00Z");

  // Test Today
  const result1 = formatDueDate(new Date("2026-02-20T14:30:00Z"), base);
  const html1 = renderTemplate(result1);
  console.log("HTML1 RENDER: ", html1);
  if (!html1.includes("Today at")) throw new Error("Failed Today: " + html1);

  // Test Tomorrow
  const result2 = formatDueDate(new Date("2026-02-21T09:15:00Z"), base);
  const html2 = renderTemplate(result2);
  if (!html2.includes("Tomorrow at"))
    throw new Error("Failed Tomorrow: " + html2);

  console.log("ALL NODE TESTS PASSED!");
} catch (err) {
  console.error(err);
  process.exit(1);
}
