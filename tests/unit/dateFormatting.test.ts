import { describe, it, expect } from "vitest";
import { formatDueDate } from "../../src/utils/dateFormatting";
import { render } from "lit";

describe("formatDueDate", () => {
  function renderTemplate(template: unknown) {
    const container = document.createElement("div");
    render(template, container);
    // Strip out multiple spaces and newlines for easier testing
    return container.innerHTML.replace(/\s+/g, " ").trim();
  }

  it("formats 'Today' correctly", () => {
    const base = new Date("2026-02-20T10:00:00Z");
    const target = new Date("2026-02-20T14:30:00Z"); // Later today
    const result = formatDueDate(target, base);
    const htmlString = renderTemplate(result);
    // Should contain "Today at" and wa-format-date
    expect(htmlString).toContain("Today at ");
    expect(htmlString).toContain('date="2026-02-20T14:30:00.000Z"');
    expect(htmlString).toContain('hour="numeric"');
    expect(htmlString).toContain('minute="numeric"');
  });

  it("formats 'Tomorrow' correctly", () => {
    const base = new Date("2026-02-20T10:00:00Z");
    const target = new Date("2026-02-21T09:15:00Z"); // Tomorrow
    const result = formatDueDate(target, base);
    const htmlString = renderTemplate(result);
    expect(htmlString).toContain("Tomorrow at ");
    expect(htmlString).toContain('date="2026-02-21T09:15:00.000Z"');
  });

  it("formats future dates (2+ days away) correctly", () => {
    const base = new Date("2026-02-20T10:00:00Z");
    const target = new Date("2026-02-25T16:45:00Z"); // 5 days away
    const result = formatDueDate(target, base);
    const htmlString = renderTemplate(result);
    expect(htmlString).toContain('date="2026-02-25T16:45:00.000Z"');
    expect(htmlString).toContain('weekday="long"');
    expect(htmlString).toContain('day="numeric"');
    expect(htmlString).toContain('month="long"');
    expect(htmlString).toContain(" at ");
    expect(htmlString).toContain('hour="numeric"');
    expect(htmlString).toContain('minute="numeric"');
  });

  it("formats <1h overdue correctly", () => {
    const base = new Date("2026-02-20T10:30:00Z");
    const target = new Date("2026-02-20T10:03:00Z"); // 27 mins overdue
    const result = formatDueDate(target, base);
    // Lit injects comments in the middle of native text sometimes, e.g. "By <!--?lit$625927775$-->27 min<!--?lit$625927775$-->s<!--?-->"
    const textContext = renderTemplate(result).replace(/<!--.*?-->/g, "");
    expect(textContext).toBe("By 27 mins");
  });

  it("formats <24h overdue correctly", () => {
    const base = new Date("2026-02-20T15:00:00Z");
    const target = new Date("2026-02-20T11:00:00Z"); // 4 hours overdue
    const result = formatDueDate(target, base);
    // Lit injects comments in the middle of native text sometimes
    const textContext = renderTemplate(result).replace(/<!--.*?-->/g, "");
    expect(textContext).toBe("By 4 hours");
  });

  it("formats >24h overdue correctly", () => {
    const base = new Date("2026-02-22T10:00:00Z");
    const target = new Date("2026-02-20T08:30:00Z"); // Almost 2 days overdue
    const result = formatDueDate(target, base);
    const htmlString = renderTemplate(result);
    expect(htmlString).toContain("Since ");
    expect(htmlString).toContain('date="2026-02-20T08:30:00.000Z"');
    expect(htmlString).toContain('hour="numeric"');
    expect(htmlString).toContain('minute="numeric"');
    expect(htmlString).toContain(" on ");
    expect(htmlString).toContain('weekday="long"');
    expect(htmlString).toContain('day="numeric"');
    expect(htmlString).toContain('month="long"');
  });
});
