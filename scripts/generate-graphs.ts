import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DECK_DIR = path.join(__dirname, "../src/decks/maths-gcse");
const PUBLIC_GRAPH_DIR = path.join(__dirname, "../public/graphs");

// Ensure graph directory exists
if (!fs.existsSync(PUBLIC_GRAPH_DIR)) {
  fs.mkdirSync(PUBLIC_GRAPH_DIR, { recursive: true });
}

interface Card {
  id: number;
  side1: string;
  side2: string;
}

interface Deck {
  id: number;
  title: string;
  cards: Card[];
  tags: string[];
}

function parseQuadratic(
  text: string,
): { a: number; b: number; c: number } | null {
  // Extract content between $$...$$
  const latexMatch = text.match(/\$\$([^$]+)\$\$/);
  if (!latexMatch) return null;

  const equation = latexMatch[1];

  // Normalize string: remove spaces
  const clean = equation.replace(/\s+/g, "");

  // Clean up any trailing periods or "Solve:" prefix if they somehow got in (unlikely with $$ match but safety first)
  // Our clean string should look like x^2+6x+8=0 or similar.
  // Sometimes there might be a trailing period inside the $$? e.g. $$... = 0.$$
  // Let's remove trailing non-digits/x/=

  // valid starts: number, -, +, or just x^2 implies 1
  const aMatch = clean.match(/^([+-]?\d*)x\^2/);
  if (!aMatch) return null;

  const aStr = aMatch[1];
  let a = 1;
  if (aStr === "-" || aStr === "−")
    a = -1; // Handle minus sign variants if any
  else if (aStr === "+" || aStr === "") a = 1;
  else a = parseInt(aStr, 10);

  // Remaining string after ax^2
  let remaining = clean.substring(aMatch[0].length);

  // Try to match bx part
  const bMatch = remaining.match(/^([+-]?\d*)x/);
  let b = 0;
  if (bMatch) {
    const bStr = bMatch[1];
    if (bStr === "+" || bStr === "") b = 1;
    else if (bStr === "-" || bStr === "−") b = -1;
    else b = parseInt(bStr, 10);
    remaining = remaining.substring(bMatch[0].length);
  }

  // Try to match constant c
  // It should be followed by =0
  const cMatch = remaining.match(/^([+-]?\d+)=0/);
  let c = 0;
  if (cMatch) {
    c = parseInt(cMatch[1], 10);
  }

  return { a, b, c };
}

function generateSVG(a: number, b: number, c: number): string {
  const width = 300;
  const height = 300;

  // Calculate vertex
  const h = -b / (2 * a);

  // Find range to plot
  // We want to include the vertex and roots if real
  // Roots: (-b +/- sqrt(b^2 - 4ac)) / 2a
  const discriminant = b * b - 4 * a * c;
  const pointsOfInterest = [h];
  if (discriminant >= 0) {
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    pointsOfInterest.push(root1, root2);
  }
  pointsOfInterest.push(0); // y-intercept x=0

  const minX = Math.min(...pointsOfInterest) - 2;
  const maxX = Math.max(...pointsOfInterest) + 2;
  const rangeX = maxX - minX;

  // Calculate corresponding Ys to find view box
  const ys = pointsOfInterest.map((x) => a * x * x + b * x + c);
  ys.push(0); // x-axis
  const minY = Math.min(...ys) - 2;
  const maxY = Math.max(...ys) + 2;
  const rangeY = maxY - minY;

  // Construct points for polyline
  const points: [number, number][] = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const x = minX + (rangeX * i) / steps;
    const y = a * x * x + b * x + c;
    points.push([x, y]);
  }

  // Mapping function to SVG coordinates
  // SVG (0,0) is top-left. We want standard Cartesian where y goes up.
  // We'll map [minX, maxX] to [padding, width-padding]
  // and [minY, maxY] to [height-padding, padding]
  const padding = 20;
  const mapX = (x: number) =>
    padding + ((x - minX) / rangeX) * (width - 2 * padding);
  const mapY = (y: number) =>
    height - padding - ((y - minY) / rangeY) * (height - 2 * padding);

  const pathD = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${mapX(p[0]).toFixed(1)} ${mapY(p[1]).toFixed(1)}`,
    )
    .join(" ");

  // Axes
  const xAxisY = mapY(0);
  const yAxisX = mapX(0);

  // Intercepts
  const intercepts: [number, number][] = [];
  if (discriminant >= 0) {
    intercepts.push([(-b + Math.sqrt(discriminant)) / (2 * a), 0]);
    intercepts.push([(-b - Math.sqrt(discriminant)) / (2 * a), 0]);
  }
  intercepts.push([0, c]); // y-intercept

  const circles = intercepts
    .map(
      (p) =>
        `<circle cx="${mapX(p[0]).toFixed(1)}" cy="${mapY(p[1]).toFixed(1)}" r="3" fill="red" />`,
    )
    .join("");

  // Labels for intercepts
  const labels = intercepts
    .map((p) => {
      const x = mapX(p[0]);
      const y = mapY(p[1]);
      const val = p[1] === 0 ? p[0] : p[1]; // Label x-intercept with x, y-intercept with y
      const text = Number.isInteger(val) ? val.toString() : val.toFixed(1);

      // Offset label slightly
      let dx = 0;
      let dy = 0;
      let anchor = "middle";
      let baseline = "middle";

      if (Math.abs(p[1]) < 0.001) {
        // x-intercept
        dy = 15;
        baseline = "hanging";
      } else {
        // y-intercept
        dx = 10;
        anchor = "start";
      }

      return `<text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" font-family="sans-serif" font-size="10" text-anchor="${anchor}" dominant-baseline="${baseline}" fill="#333">${text}</text>`;
    })
    .join("");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:white; border:1px solid #eee;">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
      </marker>
    </defs>
    <!-- Axes -->
    <line x1="${padding / 2}" y1="${xAxisY}" x2="${width - padding / 2}" y2="${xAxisY}" stroke="#888" stroke-width="1" marker-end="url(#arrowhead)" />
    <line x1="${yAxisX}" y1="${height - padding / 2}" x2="${yAxisX}" y2="${padding / 2}" stroke="#888" stroke-width="1" marker-end="url(#arrowhead)" />
    <!-- Graph -->
    <path d="${pathD}" fill="none" stroke="blue" stroke-width="2" />
    <!-- Intercepts -->
    ${circles}
    <!-- Labels -->
    ${labels}
    <!-- Equation -->
    <text x="${width / 2}" y="${height - 5}" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#666">y = ${a}x² + ${b}x + ${c}</text>
  </svg>`;
}

function log(msg: string) {
  fs.appendFileSync("generate-graphs.log", msg + "\n");
}

async function processDecks() {
  log(`Processing decks from: ${DECK_DIR}`);
  if (!fs.existsSync(DECK_DIR)) {
    log(`Directory does not exist: ${DECK_DIR}`);
    return;
  }
  const files = fs
    .readdirSync(DECK_DIR)
    .filter((f) => f.endsWith(".json") && f.includes("quadratic"));
  log(`Found files: ${files.length}`);

  for (const file of files) {
    log(`Processing: ${file}`);
    const filePath = path.join(DECK_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const deck: Deck = JSON.parse(content);
    let modified = false;

    for (const card of deck.cards) {
      log(`Card ID: ${card.id}`);
      const coeffs = parseQuadratic(card.side1);
      if (!coeffs) {
        log(`No quadratic found for card ${card.id}`);
        continue;
      }
      log(`Coeffs: ${JSON.stringify(coeffs)}`);

      const { a, b, c } = coeffs;
      const fileName = `quadratic-${a}-${b}-${c}.svg`;
      const correctMarkdown = `![Graph](/graphs/${fileName})`;

      // Check if we already have the graph image with correct path
      // if (card.side2.includes(correctMarkdown)) continue; // Force regen for labels

      // If it has old path, replace it (e.g. if we added base path previously)
      if (card.side2.includes("![Graph](/flashcards/graphs/")) {
        card.side2 = card.side2.replace(
          /!\[Graph\]\(\/flashcards\/graphs\/[^)]+\)/,
          correctMarkdown,
        );
        modified = true;
        continue;
      }
      // Also handle the case where it might have been correct before but we want to ensure consistency
      if (card.side2.includes("![Graph](/graphs/")) {
        // already correct
        // continue; // Force regen
      }

      // If no graph at all, generate and append
      const svgContent = generateSVG(a, b, c);
      const outputPath = path.join(PUBLIC_GRAPH_DIR, fileName);

      fs.writeFileSync(outputPath, svgContent);
      log(`Generated ${fileName}`);

      // Append to side 2
      if (!card.side2.includes(correctMarkdown)) {
        card.side2 = `${card.side2}\n\n${correctMarkdown}`;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(deck, null, 2));
      log(`Updated ${file}`);
    }
  }
}

processDecks().catch(console.error);
