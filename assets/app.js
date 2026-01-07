// =============================
// Wordsearch Creator (app.js)
// Easy = 10 words
// Medium = 15 words
// =============================

// ---------- Utilities ----------
function cleanWord(w) {
  return (w || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, ""); // keep A-Z only
}

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function choice(arr) {
  return arr[randInt(arr.length)];
}

// ---------- Wordsearch generator ----------
function generateWordsearch(words, size, allowDiagonals) {
  // Grid holds letters or null
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  // Marks whether cell is part of solution
  const mark = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  // Track which word "owns" each cell (for spacing rules)
  const owner = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null) // null or wordIndex number
  );

  // Directions
  const dirs = [
    { dx: 1, dy: 0 },  // →
    { dx: -1, dy: 0 }, // ←
    { dx: 0, dy: 1 },  // ↓
    { dx: 0, dy: -1 }, // ↑
  ];

  if (allowDiagonals) {
    dirs.push(
      { dx: 1, dy: 1 },   // ↘
      { dx: -1, dy: -1 }, // ↖
      { dx: 1, dy: -1 },  // ↗
      { dx: -1, dy: 1 }   // ↙
    );
  }

  // Place longer words first
  const sorted = [...words].sort((a, b) => b.length - a.length);

  const placements = [];

  // Helper: is any neighbour cell occupied by ANY word?
  // (8-direction adjacency)
  function hasAdjacentOccupied(xx, yy) {
    for (let ny = yy - 1; ny <= yy + 1; ny++) {
      for (let nx = xx - 1; nx <= xx + 1; nx++) {
        if (nx === xx && ny === yy) continue;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        if (grid[ny][nx] !== null) return true;
      }
    }
    return false;
  }

  function canPlace(word, x, y, dx, dy, wordIndex) {
    for (let i = 0; i < word.length; i++) {
      const xx = x + dx * i;
      const yy = y + dy * i;

      if (xx < 0 || xx >= size || yy < 0 || yy >= size) return false;

      const existing = grid[yy][xx];

      // If there's already a letter here, only allow if it matches (overlap/crossing)
      if (existing !== null) {
        if (existing !== word[i]) return false;
        // Overlap is allowed (even though neighbours may be occupied)
        continue;
      }

      // If it's an empty cell, enforce spacing:
      // reject if this cell touches any existing placed letter
      if (hasAdjacentOccupied(xx, yy)) return false;
    }

    return true;
  }

  function doPlace(word, x, y, dx, dy, wordIndex) {
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const xx = x + dx * i;
      const yy = y + dy * i;

      // Write letter
      grid[yy][xx] = word[i];
      mark[yy][xx] = true;

      // Only set owner if empty previously (don’t overwrite owner on overlaps)
      if (owner[yy][xx] === null) owner[yy][xx] = wordIndex;

      cells.push([xx, yy]);
    }
    placements.push({ word, cells });
  }

  // Try placing each word with random attempts
  const failed = [];

  for (let wi = 0; wi < sorted.length; wi++) {
    const word = sorted[wi];
    let placed = false;

    // More attempts needed because spacing is stricter
    const attempts = 2000;

    for (let a = 0; a < attempts; a++) {
      const dir = choice(dirs);
      const dx = dir.dx;
      const dy = dir.dy;

      // Choose a start that could fit
      const xMin = dx === -1 ? word.length - 1 : 0;
      const xMax = dx === 1 ? size - word.length : size - 1;
      const yMin = dy === -1 ? word.length - 1 : 0;
      const yMax = dy === 1 ? size - word.length : size - 1;

      const x = randInt(xMax - xMin + 1) + xMin;
      const y = randInt(yMax - yMin + 1) + yMin;

      if (canPlace(word, x, y, dx, dy, wi)) {
        doPlace(word, x, y, dx, dy, wi);
        placed = true;
        break;
      }
    }

    if (!placed) failed.push(word);
  }

  // Fill remaining blanks with random letters
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === null) {
        grid[y][x] = alphabet[randInt(alphabet.length)];
      }
    }
  }

  return { grid, mark, placements, failed };
}

// ---------- Render ----------
function render(result, title, author, words) {
  const gridEl = document.getElementById("grid");
  const listEl = document.getElementById("wordList");
  const warnEl = document.getElementById("warn");

  // Title/author/date
  document.getElementById("outTitle").textContent = title || "Wordsearch";
  document.getElementById("outAuthor").textContent = author ? `By ${author}` : "";

  const now = new Date();
  document.getElementById("outDate").textContent = now.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Grid
  const size = result.grid.length;
  gridEl.style.gridTemplateColumns = `repeat(${size}, 28px)`;
  gridEl.innerHTML = "";

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = document.createElement("div");
      d.className = "cell";
      d.textContent = result.grid[y][x];
      if (result.mark[y][x]) d.classList.add("mark"); // answer key highlight
      gridEl.appendChild(d);
    }
  }

  // Word list (keep original order user entered)
  listEl.innerHTML = "";
  for (const w of words) {
    const li = document.createElement("li");
    li.textContent = w;
    listEl.appendChild(li);
  }

  // Warnings if failed
  if (result.failed.length) {
    warnEl.style.display = "block";
    warnEl.textContent =
      "Could not place: " +
      result.failed.join(", ") +
      ". Try a larger grid or shorter words, then Generate again.";
  } else {
    warnEl.style.display = "none";
    warnEl.textContent = "";
  }
}

// ---------- UI wiring ----------
const titleEl = document.getElementById("title");
const authorEl = document.getElementById("author");
const wordsEl = document.getElementById("words");
const sizeEl = document.getElementById("size");
const diagonalsEl = document.getElementById("allowDiagonals");

const difficultyEl = document.getElementById("difficulty");
const wordsLabelEl = document.getElementById("wordsLabel");

const generateBtn = document.getElementById("generateBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const printBtn = document.getElementById("printBtn");
const toggleKeyBtn = document.getElementById("toggleKeyBtn");
const formMsg = document.getElementById("formMsg");

let lastPayload = null;

// Difficulty helpers
function requiredWordCount() {
  if (!difficultyEl) return 10;
  return difficultyEl.value === "medium" ? 15 : 10;
}

function updateWordsLabel() {
  const n = requiredWordCount();
  if (wordsLabelEl) wordsLabelEl.textContent = `${n} words`;
}

// NEW: keep print header in sync without regenerating the grid
function updateMeta() {
  const title = (titleEl?.value || "").trim();
  const author = (authorEl?.value || "").trim();

  const outTitle = document.getElementById("outTitle");
  const outAuthor = document.getElementById("outAuthor");

  if (outTitle) outTitle.textContent = title || "Wordsearch";
  if (outAuthor) outAuthor.textContent = author ? `By ${author}` : "";
}

function getWordsFromForm() {
  const rawLines = wordsEl.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleaned = rawLines.map(cleanWord).filter(Boolean);

  // Keep unique while preserving order
  const seen = new Set();
  const unique = [];
  for (const w of cleaned) {
    if (!seen.has(w)) {
      seen.add(w);
      unique.push(w);
    }
  }
  return unique;
}

function validate(words, size) {
  const required = requiredWordCount();

  if (words.length < required) return `Please enter ${required} words (one per line).`;
  if (words.length > required) return `Please enter exactly ${required} words (remove extras).`;

  const tooLong = words.find((w) => w.length > size);
  if (tooLong) {
    return `“${tooLong}” is longer than the grid (${size}). Increase grid size or shorten the word.`;
  }

  const anyShort = words.find((w) => w.length < 2);
  if (anyShort) return "Each word must be at least 2 letters.";

  return null;
}

function build() {
  updateWordsLabel();
  updateMeta();

  const title = (titleEl.value || "").trim();
  const author = (authorEl.value || "").trim();
  const size = parseInt(sizeEl.value, 10);
  const allowDiagonals = diagonalsEl.value === "1";
  const words = getWordsFromForm();

  const err = validate(words, size);
  if (err) {
    formMsg.textContent = err;
    lastPayload = null;
    shuffleBtn.disabled = true;
    printBtn.disabled = true;
    toggleKeyBtn.disabled = true;
    return;
  }

  formMsg.textContent = "Generating…";

  const result = generateWordsearch(words, size, allowDiagonals);
  render(result, title, author, words);

  lastPayload = { title, author, size, allowDiagonals, words };

  formMsg.textContent = result.failed.length
    ? "Generated (with issues—see warning)."
    : "Generated.";

  shuffleBtn.disabled = false;
  printBtn.disabled = false;
  toggleKeyBtn.disabled = false;
}

generateBtn.addEventListener("click", build);

shuffleBtn.addEventListener("click", () => {
  if (!lastPayload) return;
  const { title, author, size, allowDiagonals, words } = lastPayload;

  const result = generateWordsearch(words, size, allowDiagonals);
  render(result, title, author, words);

  formMsg.textContent = result.failed.length
    ? "Shuffled (with issues—see warning)."
    : "Shuffled.";
});

printBtn.addEventListener("click", () => {
  // Ensure the print header reflects what’s currently typed
  updateMeta();
  window.print();
});

toggleKeyBtn.addEventListener("click", () => {
  const isHidden = document.body.classList.contains("answer-key-hidden");
  if (isHidden) {
    document.body.classList.remove("answer-key-hidden");
    toggleKeyBtn.textContent = "Hide answer key (work in progress)";
  } else {
    document.body.classList.add("answer-key-hidden");
    toggleKeyBtn.textContent = "Show answer key";
  }
});

// NEW: update label + optionally rebuild when difficulty changes
if (difficultyEl) {
  difficultyEl.addEventListener("change", () => {
    updateWordsLabel();
    build();
  });
}

// NEW: live-update print header as you type (no regeneration)
if (titleEl) titleEl.addEventListener("input", updateMeta);
if (authorEl) authorEl.addEventListener("input", updateMeta);

// Starter preview (Easy default)
wordsEl.value = [
  "RECOVERY",
  "SUPPORT",
  "SAFE",
  "HEALTH",
  "CHOICE",
  "TRUST",
  "GOALS",
  "ROUTINE",
  "HONESTY",
  "HOPE",
].join("\n");

updateWordsLabel();
updateMeta();
build();
