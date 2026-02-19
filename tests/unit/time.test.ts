import { describe, it, expect } from "vitest";
import { parseDuration, formatDuration } from "../../src/utils/time";

describe("parseDuration", () => {
  it("parses seconds", () => {
    expect(parseDuration("10s")).toBe(10);
    expect(parseDuration("10 seconds")).toBe(10);
    expect(parseDuration("10 second")).toBe(10);
  });

  it("parses minutes", () => {
    expect(parseDuration("5m")).toBe(300);
    expect(parseDuration("5 min")).toBe(300);
    expect(parseDuration("5 minutes")).toBe(300);
  });

  it("parses hours", () => {
    expect(parseDuration("2h")).toBe(7200);
    expect(parseDuration("2 hours")).toBe(7200);
  });

  it("parses days", () => {
    expect(parseDuration("1d")).toBe(86400);
    expect(parseDuration("1 day")).toBe(86400);
  });

  it("parses combined", () => {
    expect(parseDuration("1h 30m")).toBe(5400);
    expect(parseDuration("1d 2h")).toBe(93600);
  });

  it("parses decimals", () => {
    expect(parseDuration("1.5h")).toBe(5400);
    expect(parseDuration("0.5d")).toBe(43200);
  });

  it("returns null for invalid", () => {
    expect(parseDuration("abc")).toBe(null);
    expect(parseDuration("")).toBe(null);
  });

  it("handles numbers as seconds", () => {
    expect(parseDuration("100")).toBe(100);
  });
});

describe("formatDuration", () => {
  it("formats into days", () => {
    expect(formatDuration(86400)).toBe("1d");
    expect(formatDuration(172800)).toBe("2d");
  });

  it("formats into hours", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(7200)).toBe("2h");
  });

  it("formats complex", () => {
    expect(formatDuration(90000)).toBe("1d 1h");
  });
});
