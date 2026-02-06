"use strict";

console.log("script.js is running ✅");

/***********************
 * 1) Easy customization
 ***********************/
const CONFIG = {
  recipientName: "Nathaniel", // <-- change this
  toLine: "To: ",
  mainMessage: "Will you be my Valentine? 💖",
  subMessage: "I promise to stop being annoying and lazy and a fatass.",
  yesResultTitle: "YAYYYYY!!! 💘",
  yesResultText: "Best decision ever. I’m so excited!!!",
  yesButtonText: "YES",
  noButtonText: "No",
};

// Put your photos in the same folder OR use an /photos folder. Full pool of photos.
const ALL_PHOTOS = [
  "photos/photo1.jpg",
  "photos/photo2.jpg",
  "photos/photo3.jpg",
  "photos/photo4.jpg",
  "photos/photo5.jpg",
  "photos/photo6.jpg",
  "photos/photo7.jpg",
  "photos/photo8.jpg",
  "photos/photo9.jpg",
  "photos/photo10.jpg",
];

// Mini-game photos (always exactly 3 per run)
let CAROUSEL_PHOTOS = [];

// ---- Random + no-overlap photo dealing (per session) ----
const PHOTO_GAME_COUNT = 3; // photo mini game uses 3 photos
let PHOTO_GAME_PHOTOS = []; // photos used in photo mini game

let SCRATCH_PHOTO = ""; // photo used in scratch game

const MEMORY_UNIQUE_COUNT = 6; // 6 unique photos duplicated => 12 cards
let MEMORY_UNIQUE_PHOTOS = []; // set each session

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealSessionPhotos() {
  const pool = shuffle([...ALL_PHOTOS]);

  // Photo game gets 3
  PHOTO_GAME_PHOTOS = pool.slice(0, PHOTO_GAME_COUNT);

  // Scratch gets 1 (next photo after the photo game set)
  SCRATCH_PHOTO = pool[PHOTO_GAME_COUNT] || pool[0];

  // Memory gets 6 from whatever is left (no overlaps)
  const used = new Set([...PHOTO_GAME_PHOTOS, SCRATCH_PHOTO]);
  const remaining = pool.filter((p) => !used.has(p));

  MEMORY_UNIQUE_PHOTOS = remaining.slice(0, MEMORY_UNIQUE_COUNT);

  // Safety fallback: if you ever have fewer than needed photos, fill from pool
  if (MEMORY_UNIQUE_PHOTOS.length < MEMORY_UNIQUE_COUNT) {
    const fill = pool.filter(
      (p) => !MEMORY_UNIQUE_PHOTOS.includes(p) && !used.has(p),
    );
    MEMORY_UNIQUE_PHOTOS = MEMORY_UNIQUE_PHOTOS.concat(
      fill.slice(0, MEMORY_UNIQUE_COUNT - MEMORY_UNIQUE_PHOTOS.length),
    );
  }
}

/***********************
 * 2) Helpers + elements
 ***********************/
const $ = (sel, root = document) => root.querySelector(sel);

const el = {
  toLine: $("#toLine"),
  mainMessage: $("#mainMessage"),
  subMessage: $("#subMessage"),
  yesBtn: $("#yesBtn"),
  noBtn: $("#noBtn"),
  hint: $("#hint"),

  btnRow: $("#btnRow"),
  heartsLayer: $("#hearts-layer"),
  bgMusic: $("#bgMusic"),

  // sections
  planner: $("#planner"),
  gamesMenu: $("#gamesMenu"),
  carousel: $("#carousel"),
  result: $("#result"),

  // planner
  plannerView: $("#plannerView"),
  cancelPlanBtn: $("#cancelPlanBtn"),
  donePlanningBtn: $("#donePlanningBtn"),
  exportTxtBtn: $("#exportTxtBtn"),

  // result
  resultTitle: $("#resultTitle"),
  resultText: $("#resultText"),
  restartBtn: $("#restartBtn"),
  replayBackBtn: $("#replayBackBtn"),

  // games
  photoGameBtn: $("#photoGameBtn"),
  gamesBackBtn: $("#gamesBackBtn"),
  gamesContinueBtn: $("#gamesContinueBtn"),

  // scratch game
  scratchImg: $("#scratchImg"),
  scratchGameBtn: $("#scratchGameBtn"),
  scratchGame: $("#scratchGame"),
  scratchCanvas: $("#scratchCanvas"),
  scratchContinueBtn: $("#scratchContinueBtn"),
  scratchBackBtn: $("#scratchBackBtn"),

  // memory match game
  memoryGameBtn: $("#memoryGameBtn"),
  memoryGame: $("#memoryGame"),
  memoryGrid: $("#memoryGrid"),
  memoryStatus: $("#memoryStatus"),
  memoryBackBtn: $("#memoryBackBtn"),
  memoryContinueBtn: $("#memoryContinueBtn"),

  // photo game
  gameArea: $("#gameArea"),
  gameOverlay: $("#gameOverlay"),
  lockText: $("#lockText"),
  hintText: $("#hintText"),
  gamePrompt: $("#gamePrompt"),
  gameStatus: $("#gameStatus"),
  ping: $("#ping"),
  carouselImg: $("#carouselImg"),
  carouselBadge: $("#carouselBadge"),
  nextPhotoBtn: $("#nextPhotoBtn"),
  backBtn: $("#backBtn"),

    // love quiz
  loveQuizBtn: $("#loveQuizBtn"),
  loveQuiz: $("#loveQuiz"),
  loveQuizProgress: $("#loveQuizProgress"),
  loveQuizQuestion: $("#loveQuizQuestion"),
  loveQuizOptions: $("#loveQuizOptions"),
  loveQuizBackBtn: $("#loveQuizBackBtn"),
  loveQuizContinueBtn: $("#loveQuizContinueBtn"),
  loveQuizExitBtn: $("#loveQuizExitBtn"),
  quizToast: $("#quizToast"),

  // confetti
  confettiCanvas: $("#confetti"),
};

const ctx = el.confettiCanvas.getContext("2d");

// Screens used for navigation (optional helper)
const SCREENS = [
  el.planner,
  el.gamesMenu,
  el.carousel,
  el.scratchGame,
  el.memoryGame,
  el.loveQuiz,
  el.result,
];

// Optional helper (you can use later)
function showScreen(screen) {
  SCREENS.forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function showStart() {
  SCREENS.forEach((s) => s.classList.add("hidden"));
  el.btnRow.classList.remove("hidden");
  el.hint.classList.remove("hidden");
}

/***********************
 * 3) Initialize text
 ***********************/
el.toLine.textContent = `${CONFIG.toLine}${CONFIG.recipientName} 💌`;
el.mainMessage.textContent = CONFIG.mainMessage;
el.subMessage.textContent = CONFIG.subMessage;

el.yesBtn.textContent = CONFIG.yesButtonText;
el.noBtn.textContent = CONFIG.noButtonText;

el.resultTitle.textContent = CONFIG.yesResultTitle;
el.resultText.textContent = CONFIG.yesResultText;

/***********************
 * 4) Audio
 ***********************/
function playMusicSafely() {
  if (!el.bgMusic) return;
  el.bgMusic.volume = 0.35;
  el.bgMusic.play().catch(() => {});
}

/***********************
 * 5) YES/NO button behavior
 ***********************/
let noCount = 0;
let yesScale = 1;

function moveNoButtonAway() {
  const rowRect = el.btnRow.getBoundingClientRect();
  const btnRect = el.noBtn.getBoundingClientRect();

  const maxX = rowRect.width - btnRect.width;
  const maxY = rowRect.height - btnRect.height;

  const x = Math.random() * Math.max(0, maxX);
  const y = Math.random() * Math.max(0, maxY);

  el.noBtn.style.position = "absolute";
  el.noBtn.style.left = `${x}px`;
  el.noBtn.style.top = `${y}px`;
}

function growYesButton() {
  yesScale = Math.min(yesScale + 0.12, 2.2);
  el.yesBtn.style.transform = `scale(${yesScale})`;
}

const FULLSCREEN_AFTER_NO_CLICKS = 10; // change this number if you want

let yesOverlayEl = null;

function makeYesFullscreen() {
  if (!yesOverlayEl) {
    yesOverlayEl = document.createElement("div");
    yesOverlayEl.id = "yesOverlay";
    document.body.appendChild(yesOverlayEl);
  }
  yesOverlayEl.appendChild(el.yesBtn);

  // reset inline styles
  el.yesBtn.style.position = "static";
  el.yesBtn.style.left = "";
  el.yesBtn.style.top = "";
  el.yesBtn.style.right = "";
  el.yesBtn.style.bottom = "";
  el.yesBtn.style.transform = "none";
}

const noPhrases = [
  "BRUH? 🥺",
  "Like… Really? 😭",
  "Stop this! 😳",
  "I promise to not be annoying tho 💗",
  "Ok wow… rude! 😈",
  "So you hate me? 😭",
  "So you'd rather I dissapear? 😭",
  "I'm telling gma and mom that you hate me. 😡",
  "You know... you can just click YES and this would be over.",
];

el.noBtn.addEventListener("click", () => {
  playMusicSafely();
  noCount++;

  if (noCount >= FULLSCREEN_AFTER_NO_CLICKS) {
    makeYesFullscreen();
    el.hint.textContent =
      noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
    spawnHearts(6 + noCount * 2);
    return; // prevents growYesButton() / moveNoButtonAway()
  }

  growYesButton();
  moveNoButtonAway();

  el.hint.textContent = noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
  spawnHearts(6 + noCount * 2);
});

// Bonus: make it harder by also moving when hovered (desktop)
el.noBtn.addEventListener("mouseenter", () => {
  if (noCount >= 3) moveNoButtonAway();
});

el.yesBtn.addEventListener("click", () => {
  playMusicSafely();

  // If YES is fullscreen, remove overlay so planner is clickable/visible
  if (yesOverlayEl) {
    el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  // Hide the buttons and open planner instead of final result
  el.btnRow.classList.add("hidden");
  el.hint.classList.add("hidden");
  el.planner.classList.remove("hidden");

  // Confetti + hearts party
  startConfetti();
  spawnHearts(18);

  // Planner always starts on activity picker
  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

/***********************
 * 6) Planner (no inline onclicks)
 ***********************/
const ACTIVITIES = [
  { id: "dinner", name: "Dinner Date", img: "activity/dinner.gif" },
  { id: "movie", name: "Movie Night", img: "activity/movie.gif" },
  { id: "skating", name: "Ice Skating", img: "activity/skating.gif" },
  { id: "chilling", name: "Just Chill", img: "activity/chilling.gif" },
];

const STORAGE_KEY = "valentine_plans";
let plans = safeLoadPlans();
let selectedActivity = null;

function safeLoadPlans() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePlans() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

function renderActivityPicker() {
  el.plannerView.innerHTML = `
    <p class="tiny">Choose an activity:</p>

    <div class="activity-grid">
      ${ACTIVITIES.map(
        (a) => `
        <button class="activity-btn" type="button" data-action="select-activity" data-activity-id="${a.id}">
          <img src="${a.img}" alt="${a.name}" />
          ${a.name}
        </button>
      `,
      ).join("")}
    </div>

    <div class="saved-list">
      <div class="saved-list__head">
        <strong>Saved plans:</strong>
        <button class="btn secondary" type="button" data-action="clear-plans">Clear ✖</button>
      </div>

      ${
        plans.length
          ? plans
              .map(
                (p) =>
                  `<div>• ${escapeHtml(p.date)} — ${escapeHtml(p.activity)}</div>`,
              )
              .join("")
          : "<div class='tiny'>None yet</div>"
      }
    </div>
  `;
}

function renderPlanForm(activity) {
  el.plannerView.innerHTML = `
    <div class="planner-form">
      <label>
        Date
        <input type="date" id="planDate" />
      </label>

      <label>
        Note
        <textarea id="planNote" rows="3" placeholder="Optional note..."></textarea>
      </label>

      <button class="btn yes" type="button" data-action="save-plan">Save 💘</button>
    </div>
  `;

  // focus date input for nice UX
  const input = $("#planDate");
  if (input) input.focus();
}

function updatePlannerActions() {
  // Hide Done planning if:
  // - you're inside an activity form
  // - OR you haven't saved anything yet
  if (selectedActivity || plans.length === 0) {
    el.donePlanningBtn.classList.add("hidden");
  } else {
    el.donePlanningBtn.classList.remove("hidden");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Planner event delegation
el.plannerView.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === "select-activity") {
    const id = btn.dataset.activityId;
    selectedActivity = ACTIVITIES.find((a) => a.id === id) || null;
    updatePlannerActions();
    if (selectedActivity) renderPlanForm(selectedActivity);
    return;
  }

  if (action === "save-plan") {
    const date = $("#planDate")?.value;
    const note = ($("#planNote")?.value || "").trim();

    if (!date) {
      spawnHearts(6);
      return;
    }

    plans.push({
      date,
      activity: selectedActivity?.name || "Unknown",
      note,
    });

    savePlans();

    // Exit the form view back to picker
    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
    return;
  }

  if (action === "clear-plans") {
    const confirmDelete = confirm("Delete all saved plans? 💔");
    if (!confirmDelete) return;

    plans = [];
    localStorage.removeItem(STORAGE_KEY);

    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
  }
});

function exportTxt() {
  const text = plans
    .map((p) => `${p.date} | ${p.activity} | ${p.note || "(no note)"}`)
    .join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "valentine-plans.txt";
  a.click();

  // cleanup
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

el.exportTxtBtn.addEventListener("click", exportTxt);

el.cancelPlanBtn.addEventListener("click", () => {
  // If you're inside an activity form, go back to the activity picker
  if (selectedActivity) {
    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
    return;
  }

  // Otherwise you're already on the picker -> go back to YES/NO start screen
  showStart();
});

el.donePlanningBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  dealSessionPhotos(); // 🎲 deal photos once for both games

  // ✅ new photo deal => clear in-progress state for these games
  sessionStorage.removeItem(SESSION_KEYS.photoUnlocked);
  sessionStorage.removeItem(SESSION_KEYS.photoIndex);
  sessionStorage.removeItem(SESSION_KEYS.photoLocked);

  sessionStorage.removeItem(SESSION_KEYS.memoryDeck);
  sessionStorage.removeItem(SESSION_KEYS.memoryMatchedIds);

  updateGamesContinue();
});

el.gamesBackBtn.addEventListener("click", () => {
  el.gamesMenu.classList.add("hidden");
  showScreen(el.planner);

  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

/***********************
 * 7) Games menu + flow
 ***********************/
// --- Session progress (persists until Replay is clicked) ---
const SESSION_KEYS = {
  photoDone: "vday_photo_done",
  scratchDone: "vday_scratch_done",
  memoryDone: "vday_memory_done",
  loveQuizDone: "vday_lovequiz_done",

  // ✅ Photo game in-progress
  photoUnlocked: "vday_photo_unlocked",
  photoIndex: "vday_photo_index",
  photoLocked: "vday_photo_locked",

  // ✅ Memory game in-progress
  memoryDeck: "vday_memory_deck",
  memoryMatchedIds: "vday_memory_matched_ids",

  // ✅ Love Quiz in-progress
  loveQuizIndex: "vday_lovequiz_index",
};

function loadBool(key) {
  return sessionStorage.getItem(key) === "1";
}

function saveBool(key, val) {
  sessionStorage.setItem(key, val ? "1" : "0");
}

// ✅ JSON helpers
function loadJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, val) {
  sessionStorage.setItem(key, JSON.stringify(val));
}

let photoGameCompleted = loadBool(SESSION_KEYS.photoDone);
let scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);
let memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);
let loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);

// ✅ Save the original button labels (so we can restore them)
const BASE_GAME_LABELS = {
  photo: el.photoGameBtn.textContent,
  scratch: el.scratchGameBtn.textContent,
  memory: el.memoryGameBtn.textContent,
  loveQuiz: el.loveQuizBackBtn.textContent,
};

function setCompletedBadge(btn, isDone) {
  if (isDone) {
    btn.classList.add("is-completed");
    btn.setAttribute("aria-disabled", "true");
  } else {
    btn.classList.remove("is-completed");
    btn.removeAttribute("aria-disabled");
  }
}

function updateCompletedBadges() {
  photoGameCompleted = loadBool(SESSION_KEYS.photoDone);
  scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);
  memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);
  loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);

  setCompletedBadge(el.photoGameBtn, photoGameCompleted);
  setCompletedBadge(el.scratchGameBtn, scratchGameCompleted);
  setCompletedBadge(el.memoryGameBtn, memoryGameCompleted);
  setCompletedBadge(el.loveQuizBtn, loveQuizCompleted);
}

function updateGamesContinue() {
  // ✅ update button badges first (also refreshes booleans)
  updateCompletedBadges();

  if (
    photoGameCompleted && 
    scratchGameCompleted && 
    memoryGameCompleted && 
    loveQuizCompleted
  ) {
    el.gamesContinueBtn.classList.remove("hidden");
    el.gamesContinueBtn.disabled = false;
    el.gamesContinueBtn.textContent = "Finish 💘";
  } else {
    el.gamesContinueBtn.classList.add("hidden");
    el.gamesContinueBtn.disabled = true;
  }
}

el.photoGameBtn.addEventListener("click", () => {
  showScreen(el.carousel);

  // do NOT reset progress here
  updateGamesContinue();

  initPhotoGame();
});

el.scratchGameBtn.addEventListener("click", () => {
  showScreen(el.scratchGame);

  scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);

  if (scratchGameCompleted) {
    el.scratchContinueBtn.classList.remove("hidden");
  } else {
    el.scratchContinueBtn.classList.add("hidden");
    initScratchGame();
  }

  updateGamesContinue();
});

el.gamesContinueBtn.addEventListener("click", () => {
  showScreen(el.result);
});

el.backBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  // Never return to the YES/NO screen from games
  el.btnRow.classList.add("hidden");
  el.hint.classList.add("hidden");

  updateGamesContinue();
});

/***********************
 * 8) Photo mini game (clean rewrite)
 ***********************/
let unlockedCount = 0; // how many photos are unlocked (0..3)
let currentPhotoIndex = 0; // which photo we are working on (0..2)

let targetX = 50; // percent
let targetY = 50; // percent
const HIT_RADIUS = 10; // percent

function setNewTarget() {
  targetX = 15 + Math.random() * 70;
  targetY = 20 + Math.random() * 60;
}

function updateProgressUI() {
  // Single source of truth: unlockedCount
  el.carouselBadge.textContent = `${unlockedCount} / ${CAROUSEL_PHOTOS.length}`;
  el.gameStatus.textContent = `${unlockedCount} / ${CAROUSEL_PHOTOS.length} photos unlocked`;
}

function lockPhoto() {
  el.carouselImg.classList.add("hidden");
  el.gameOverlay.classList.remove("hidden");

  // Next photo button is not available while locked
  el.nextPhotoBtn.classList.add("hidden");

  el.lockText.textContent = "🔒 Locked";
  el.hintText.textContent = "Click around to find the heart 💘";

  setNewTarget();
  updateProgressUI();
  persistPhotoState();
}

function revealPhoto() {
  el.carouselImg.src = CAROUSEL_PHOTOS[currentPhotoIndex];
  el.carouselImg.classList.remove("hidden");
  el.gameOverlay.classList.add("hidden");

  const isLastPhoto = currentPhotoIndex === CAROUSEL_PHOTOS.length - 1;

  // Only show Next if there IS a next photo to go to
  if (isLastPhoto) {
    el.nextPhotoBtn.classList.add("hidden");
  } else {
    el.nextPhotoBtn.classList.remove("hidden");
  }

  spawnHearts(14);
  persistPhotoState();
}

function distanceHint(dist) {
  if (dist < 6) return "SO CLOSE 😳";
  if (dist < 10) return "Warmer 👀";
  if (dist < 16) return "Getting there 🙂";
  return "Cold 🥶";
}

function showPing(xPx, yPx) {
  el.ping.classList.remove("hidden");
  el.ping.style.left = `${xPx}px`;
  el.ping.style.top = `${yPx}px`;

  el.ping.style.animation = "none";
  el.ping.offsetHeight; // reflow
  el.ping.style.animation = "";

  setTimeout(() => el.ping.classList.add("hidden"), 600);
}

function initPhotoGame() {
  CAROUSEL_PHOTOS = PHOTO_GAME_PHOTOS.slice(); // ✅ use dealt photos

  // ✅ If completed, show completed state
  photoGameCompleted = loadBool(SESSION_KEYS.photoDone);
  if (photoGameCompleted) {
    unlockedCount = CAROUSEL_PHOTOS.length;
    currentPhotoIndex = CAROUSEL_PHOTOS.length - 1;

    el.gamePrompt.textContent = "All photos unlocked 🥹💞";
    updateProgressUI();

    // show last photo
    el.carouselImg.src = CAROUSEL_PHOTOS[currentPhotoIndex];
    el.carouselImg.classList.remove("hidden");
    el.gameOverlay.classList.add("hidden");
    el.nextPhotoBtn.classList.add("hidden");

    el.lockText.textContent = "✅ Complete";
    el.hintText.textContent = "Press Back ⬅";
    updateGamesContinue();
    return;
  }

  // ✅ Load in-progress state (if any)
  unlockedCount = loadJSON(SESSION_KEYS.photoUnlocked, 0);
  currentPhotoIndex = loadJSON(SESSION_KEYS.photoIndex, 0);
  const wasLocked = loadJSON(SESSION_KEYS.photoLocked, true);

  // Safety clamps
  unlockedCount = Math.max(0, Math.min(unlockedCount, CAROUSEL_PHOTOS.length));
  currentPhotoIndex = Math.max(
    0,
    Math.min(currentPhotoIndex, CAROUSEL_PHOTOS.length - 1),
  );

  el.gamePrompt.textContent =
    "Find the hidden heart to reveal the next photo 👀";
  updateProgressUI();

  if (wasLocked) {
    lockPhoto();
  } else {
    // reveal current photo
    el.carouselImg.src = CAROUSEL_PHOTOS[currentPhotoIndex];
    el.carouselImg.classList.remove("hidden");
    el.gameOverlay.classList.add("hidden");

    const isLastPhoto = currentPhotoIndex === CAROUSEL_PHOTOS.length - 1;
    if (isLastPhoto) el.nextPhotoBtn.classList.add("hidden");
    else el.nextPhotoBtn.classList.remove("hidden");
  }
}

function persistPhotoState() {
  saveJSON(SESSION_KEYS.photoUnlocked, unlockedCount);
  saveJSON(SESSION_KEYS.photoIndex, currentPhotoIndex);

  // locked = overlay visible
  const locked = !el.gameOverlay.classList.contains("hidden");
  saveJSON(SESSION_KEYS.photoLocked, locked);
}

// Heart-finding click
el.gameArea.addEventListener("click", (e) => {
  // If fully complete, ignore clicks
  if (unlockedCount >= CAROUSEL_PHOTOS.length) return;

  const rect = el.gameArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  showPing(e.clientX - rect.left, e.clientY - rect.top);

  const dx = x - targetX;
  const dy = y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= HIT_RADIUS) {
    el.lockText.textContent = "💖 Found it!";
    el.hintText.textContent = "Unlocked 😤";

    // ✅ Count the unlock NOW (heart found = unlocked)
    unlockedCount = Math.min(unlockedCount + 1, CAROUSEL_PHOTOS.length);
    updateProgressUI();
    persistPhotoState();

    // Reveal the photo for the current index
    revealPhoto();

    // If that was the last photo, finish the game (no Finish button here)
    if (unlockedCount >= CAROUSEL_PHOTOS.length) {
      el.gamePrompt.textContent = "All photos unlocked 🥹💞";
      el.lockText.textContent = "✅ Complete";
      el.hintText.textContent = "Press Back ⬅";

      photoGameCompleted = true;
      saveBool(SESSION_KEYS.photoDone, true);
      updateGamesContinue();
      return;
    }
  } else {
    el.hintText.textContent = distanceHint(dist);
  }
});

// Next photo = navigation only (no counting)
el.nextPhotoBtn.addEventListener("click", () => {
  // Move to the next photo index based on how many are unlocked so far
  currentPhotoIndex = unlockedCount;
  persistPhotoState();

  // Lock the next one to be found
  lockPhoto();
  spawnHearts(8);
});

/***********************
 * 8.5) Scratch to Reveal Game
 ***********************/
function initScratchGame() {
  el.scratchImg.src = SCRATCH_PHOTO;

  const canvas = el.scratchCanvas;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#bdbdbd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-out";

  let scratching = false;

  canvas.onmousedown = () => (scratching = true);
  canvas.onmouseup = () => (scratching = false);
  canvas.onmouseleave = () => (scratching = false);

  canvas.onmousemove = (e) => {
    if (!scratching) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchProgress(ctx);
  };
}

function checkScratchProgress(ctx) {
  const img = ctx.getImageData(
    0,
    0,
    el.scratchCanvas.width,
    el.scratchCanvas.height,
  );
  let cleared = 0;

  for (let i = 3; i < img.data.length; i += 4) {
    if (img.data[i] === 0) cleared++;
  }

  const percent = cleared / (el.scratchCanvas.width * el.scratchCanvas.height);

  if (percent > 0.55 && !scratchGameCompleted) {
    scratchGameCompleted = true;
    saveBool(SESSION_KEYS.scratchDone, true);

    el.scratchContinueBtn.classList.remove("hidden");
    spawnHearts(16);
    updateGamesContinue();
  }
}

el.scratchBackBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);
});

el.scratchContinueBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);
});

/***********************
 * 8.8) Memory Match Game (4x3 = 12 cards)
 ***********************/
let memoryDeck = [];
let firstPick = null;
let lockBoard = false;
let matchesFound = 0;

function buildMemoryDeck() {
  const chosen = MEMORY_UNIQUE_PHOTOS.slice(0, 6);

  // Duplicate to create pairs => 12 cards
  const doubled = chosen.concat(chosen);

  // Unique id per card
  return shuffle(doubled.map((src, i) => ({ id: i, src })));
}

function renderMemoryGrid() {
  el.memoryGrid.innerHTML = memoryDeck
    .map(
      (card) => `
    <button class="memory-card" type="button" data-id="${card.id}" aria-label="Memory card">
      <div class="front">💖</div>
      <img src="${card.src}" alt="Memory photo" />
    </button>
  `,
    )
    .join("");
}

function setMemoryStatus(text) {
  if (el.memoryStatus) el.memoryStatus.textContent = text;
}

function resetMemoryGame() {
  memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);

  firstPick = null;
  lockBoard = false;

  // ✅ Load or create a persistent deck for the session
  const savedDeck = loadJSON(SESSION_KEYS.memoryDeck, null);
  if (savedDeck && Array.isArray(savedDeck) && savedDeck.length === 12) {
    memoryDeck = savedDeck;
  } else {
    memoryDeck = buildMemoryDeck();
    saveJSON(SESSION_KEYS.memoryDeck, memoryDeck);
  }

  // ✅ Load matched ids
  const matchedIds = loadJSON(SESSION_KEYS.memoryMatchedIds, []);
  const matchedSet = new Set(matchedIds);

  // matchesFound derived from pairs (each pair = 2 ids)
  matchesFound = Math.floor(matchedSet.size / 2);

  renderMemoryGrid();

  // ✅ Re-apply matched visuals
  [...el.memoryGrid.querySelectorAll(".memory-card")].forEach((btn) => {
    const id = Number(btn.dataset.id);
    if (matchedSet.has(id)) {
      btn.classList.add("matched", "flipped");
      btn.disabled = true;
    }
  });

  el.memoryContinueBtn.classList.add("hidden");

  if (memoryGameCompleted) {
    setMemoryStatus(
      "Already completed ✅ You can play again or press Continue!",
    );
    el.memoryContinueBtn.classList.remove("hidden");
  } else {
    setMemoryStatus(`Matched ${matchesFound} / 6 pairs 💘`);
  }
}

function finishMemoryGame() {
  memoryGameCompleted = true;
  saveBool(SESSION_KEYS.memoryDone, true);

  setMemoryStatus("All matched 🥹💞");
  el.memoryContinueBtn.classList.remove("hidden");
  spawnHearts(18);
  updateGamesContinue();
}

function flipCard(btn) {
  btn.classList.add("flipped");
  btn.disabled = true;
}

function unflipCard(btn) {
  btn.classList.remove("flipped");
  btn.disabled = false;
}

function markMatched(btnA, btnB) {
  btnA.classList.add("matched");
  btnB.classList.add("matched");
  // keep disabled
}

el.memoryGameBtn.addEventListener("click", () => {
  showScreen(el.memoryGame);

  resetMemoryGame();
  updateGamesContinue();
});

el.memoryGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".memory-card");
  if (!btn || lockBoard) return;

  // If they click a matched card (disabled), ignore
  const id = Number(btn.dataset.id);
  const card = memoryDeck.find((c) => c.id === id);
  if (!card) return;

  flipCard(btn);

  if (!firstPick) {
    firstPick = { btn, card };
    return;
  }

  // second pick
  const secondPick = { btn, card };

  // same card protection (rare but safe)
  if (secondPick.card.id === firstPick.card.id) return;

  // match?
  if (secondPick.card.src === firstPick.card.src) {
    markMatched(firstPick.btn, secondPick.btn);

    // ✅ persist matched ids
    const matchedIds = loadJSON(SESSION_KEYS.memoryMatchedIds, []);
    matchedIds.push(firstPick.card.id, secondPick.card.id);
    saveJSON(SESSION_KEYS.memoryMatchedIds, matchedIds);

    matchesFound++;

    firstPick = null;
    spawnHearts(8);

    if (matchesFound >= 6) {
      finishMemoryGame();
    } else {
      setMemoryStatus(`Matched ${matchesFound} / 6 pairs 💘`);
    }
    return;
  }

  // not a match -> flip back after a moment
  lockBoard = true;
  setTimeout(() => {
    unflipCard(firstPick.btn);
    unflipCard(secondPick.btn);
    firstPick = null;
    lockBoard = false;
  }, 650);
});

el.memoryBackBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  updateGamesContinue();
});

el.memoryContinueBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  updateGamesContinue();
});

/***********************
 * 8.9) Love Quiz (10 Qs, 4 options)
 ***********************/
const LOVE_QUIZ_QUESTIONS = [
  {
    q: "What’s my most favorite thing to do with you? 👫",
    options: ["Play games 👾", "Watch TV 📺", "Do Nothing 📱", "Sleep 💤"],
    correctIndex: 0,
  },
  {
    q: "What makes me feel the most loved by you? 💖",
    options: [
      "Hugs and Kisses 💋",
      "Words and reassurance 💬",
      "Gifts and surprises 🎁",
      "Public affection 👩‍❤‍👨",
    ],
    correctIndex: 1,
  },
  {
    q: "When do I feel the most at peace? 😌",
    options: [
      "When everything is perfectly planned 🎯",
      "When I’m alone with my thoughts 💭",
      "When I’m with you 👫",
      "When I'm on your king-sized bed 🛏️",
    ],
    correctIndex: 2,
  },
  {
    q: "What’s something small you do that I love the most? 🤏",
    options: [
      "Checking in on me ☑️",
      "Holding my hand 🤝",
      "Calling me pretty 🎀",
      "Remembering tiny details 🧐",
    ],
    correctIndex: 2,
  },
  {
    q: "What do I complain about the most? 💢",
    options: ["Being tired 🫩", "The weather ❄️", "Work 👩🏻‍💻", "Being hungry 😩"],
    correctIndex: 3,
  },
  {
    q: "What’s my “I can’t decide” phrase? 🤔",
    options: [
      "I don’t know 🤷‍♀",
      "Any preference ❓",
      "You choose 🫵",
      "Wait… let me think 🧠",
    ],
    correctIndex: 2,
  },
  {
    q: "What would I eat every day if I could? 🍽️",
    options: ["Sushi 🍣", "Pasta 🍝", "Cucumber 🥒", "Shawarma 🫔"],
    correctIndex: 0,
  },
  {
    q: "What’s my worst habit? 🔄",
    options: [
      "Overthinking 🤯",
      "Staying up too late 🥱",
      "Procrastinating 📱",
      "Forgetting to drink water 🫗",
    ],
    correctIndex: 2,
  },
  {
    q: "What instantly puts me in a better mood?",
    options: ["Food 🍔", "You 🫵", "Music 🎵", "Taking a nap 😴"],
    correctIndex: 1,
  },
  {
    q: "Why did I fall for you? 🫠",
    options: [
      "You made me feel safe 🛡️",
      "You understood me 💡",
      "You made me laugh 😂",
      "All of the above 💖",
    ],
    correctIndex: 3,
  },
];

let loveQuizIndex = loadJSON(SESSION_KEYS.loveQuizIndex, 0);

function showQuizToast(msg) {
  if (!el.quizToast) return;
  el.quizToast.textContent = msg;
  el.quizToast.classList.remove("hidden");
  el.quizToast.classList.remove("show");
  // reflow to restart animation
  void el.quizToast.offsetHeight;
  el.quizToast.classList.add("show");

  // Hide after animation
  setTimeout(() => {
    el.quizToast.classList.remove("show");
    el.quizToast.classList.add("hidden");
  }, 900);
}

function clampQuizIndex() {
  loveQuizIndex = Math.max(0, Math.min(loveQuizIndex, LOVE_QUIZ_QUESTIONS.length - 1));
  saveJSON(SESSION_KEYS.loveQuizIndex, loveQuizIndex);
}

function renderLoveQuiz() {
  loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);

  // If completed, keep them at the end (last question view) but let them exit
  if (loveQuizCompleted) {
    el.loveQuizProgress.textContent = "Quiz completed ✅";
    el.loveQuizQuestion.textContent = "You already finished the Love Quiz 🥹💞";
    el.loveQuizOptions.innerHTML = `
      <button class="quiz-option is-disabled" type="button" disabled>Perfect score energy 💘</button>
    `;
    el.loveQuizContinueBtn.classList.add("hidden");
    return;
  }

  clampQuizIndex();
  const item = LOVE_QUIZ_QUESTIONS[loveQuizIndex];

  el.loveQuizProgress.textContent = `Question ${loveQuizIndex + 1} / ${LOVE_QUIZ_QUESTIONS.length}`;
  el.loveQuizQuestion.textContent = item.q;

  // build 4 option buttons
  const LETTERS = ["A", "B", "C", "D"];

  el.loveQuizOptions.innerHTML = item.options
    .map(
      (opt, idx) => `
        <button class="quiz-option" type="button" data-idx="${idx}">
          <strong>${LETTERS[idx]}.</strong> ${escapeHtml(opt)}
        </button>
      `
    )
    .join("");

  // Continue hidden until correct answer selected
  el.loveQuizContinueBtn.classList.add("hidden");
}

function lockQuizOptions(correctIdx) {
  const buttons = [...el.loveQuizOptions.querySelectorAll(".quiz-option")];
  buttons.forEach((b) => {
    const idx = Number(b.dataset.idx);
    b.disabled = true;

    if (idx === correctIdx) {
      b.classList.add("is-correct");
    } else {
      b.classList.add("is-disabled");
    }
  });
}

function finishLoveQuiz() {
  loveQuizCompleted = true;
  saveBool(SESSION_KEYS.loveQuizDone, true);
  spawnHearts(16);
  updateGamesContinue();

  // exit back to games (same vibe as other games)
  showScreen(el.gamesMenu);
}

el.loveQuizBtn.addEventListener("click", () => {
  showScreen(el.loveQuiz);
  loveQuizIndex = loadJSON(SESSION_KEYS.loveQuizIndex, 0);
  renderLoveQuiz();
  updateGamesContinue();
});

el.loveQuizOptions.addEventListener("click", (e) => {
  const btn = e.target.closest(".quiz-option");
  if (!btn) return;

  const idx = Number(btn.dataset.idx);
  const item = LOVE_QUIZ_QUESTIONS[loveQuizIndex];
  if (!item) return;

  if (idx !== item.correctIndex) {
    showQuizToast("Wrong 😈 Try again!");
    spawnHearts(2);
    return;
  }

  // ✅ Correct: grey out the rest + show Continue
  lockQuizOptions(item.correctIndex);
  el.loveQuizContinueBtn.classList.remove("hidden");
  spawnHearts(8);
});

el.loveQuizBackBtn.addEventListener("click", () => {
  // per-question back:
  loveQuizIndex = loadJSON(SESSION_KEYS.loveQuizIndex, 0);
  loveQuizIndex = Math.max(0, loveQuizIndex - 1);
  saveJSON(SESSION_KEYS.loveQuizIndex, loveQuizIndex);
  renderLoveQuiz();
});

el.loveQuizContinueBtn.addEventListener("click", () => {
  // go next question or finish
  loveQuizIndex = loadJSON(SESSION_KEYS.loveQuizIndex, 0);

  if (loveQuizIndex >= LOVE_QUIZ_QUESTIONS.length - 1) {
    finishLoveQuiz();
    return;
  }

  loveQuizIndex++;
  saveJSON(SESSION_KEYS.loveQuizIndex, loveQuizIndex);
  renderLoveQuiz();
});

el.loveQuizExitBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);
  updateGamesContinue();
});

/***********************
 * 9) Floating hearts
 ***********************/
function randomHeartColor() {
  const colors = ["#ff4d6d", "#ff7aa2", "#ff2d55", "#ff5ea8", "#ff9bd1"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnHearts(count = 10) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.color = randomHeartColor();

    const size = 10 + Math.random() * 18;
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;

    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.bottom = "-5vh";

    const duration = 3 + Math.random() * 4;
    heart.style.animationDuration = `${duration}s`;
    heart.style.opacity = `${0.5 + Math.random() * 0.5}`;

    el.heartsLayer.appendChild(heart);

    setTimeout(() => heart.remove(), duration * 1000);
  }
}

// Ambient hearts
setInterval(() => spawnHearts(2), 650);

/***********************
 * 6) Confetti (simple)
 ***********************/
let confettiPieces = [];
let confettiRunning = false;
let confettiEmitting = false;
let rafId = null;
let confettiStopTimer = null;

function resizeCanvas() {
  el.confettiCanvas.width = window.innerWidth * devicePixelRatio;
  el.confettiCanvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function makeConfettiPiece() {
  return {
    x: Math.random() * window.innerWidth,
    y: -20,
    r: 3 + Math.random() * 5,
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 5,
    rot: Math.random() * Math.PI,
    vrot: -0.1 + Math.random() * 0.2,
    color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`,
  };
}

function startConfetti() {
  // start loop if not already running
  if (!confettiRunning) {
    confettiRunning = true;
    loopConfetti();
  }

  // start emitting new pieces
  confettiEmitting = true;

  // burst some pieces immediately
  confettiPieces.push(...Array.from({ length: 90 }, makeConfettiPiece));

  // stop emitting after a bit (but let the current pieces finish falling)
  if (confettiStopTimer) clearTimeout(confettiStopTimer);
  confettiStopTimer = setTimeout(() => {
    confettiEmitting = false;
    confettiStopTimer = null;
  }, 1400); // adjust to taste (1000–2000ms)
}

function stopConfetti() {
  // hard stop (used on restart)
  confettiRunning = false;
  confettiEmitting = false;
  confettiPieces = [];
  if (rafId) cancelAnimationFrame(rafId);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function loopConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // if still emitting, drip a few new ones per frame (nice “producing” feel)
  if (confettiEmitting) {
    confettiPieces.push(...Array.from({ length: 4 }, makeConfettiPiece));
  }

  // update + draw + remove offscreen pieces
  for (let i = confettiPieces.length - 1; i >= 0; i--) {
    const p = confettiPieces[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;

    // remove once it has fallen off screen
    if (p.y > window.innerHeight + 60) {
      confettiPieces.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.r, -p.r, p.r * 2.2, p.r * 1.2);
    ctx.restore();
  }

  // if not emitting and nothing left, stop naturally
  if (!confettiEmitting && confettiPieces.length === 0) {
    confettiRunning = false;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  rafId = requestAnimationFrame(loopConfetti);
}

/***********************
 * 11) Restart
 ***********************/
el.restartBtn.addEventListener("click", () => {
  // 🔄 Reset session game progress (only on Replay)
  sessionStorage.removeItem(SESSION_KEYS.photoDone);
  sessionStorage.removeItem(SESSION_KEYS.scratchDone);
  sessionStorage.removeItem(SESSION_KEYS.memoryDone);
  sessionStorage.removeItem(SESSION_KEYS.loveQuizDone);

  sessionStorage.removeItem(SESSION_KEYS.photoUnlocked);
  sessionStorage.removeItem(SESSION_KEYS.photoIndex);
  sessionStorage.removeItem(SESSION_KEYS.photoLocked);

  sessionStorage.removeItem(SESSION_KEYS.memoryDeck);
  sessionStorage.removeItem(SESSION_KEYS.memoryMatchedIds);

  sessionStorage.removeItem(SESSION_KEYS.loveQuizIndex);

  photoGameCompleted = false;
  scratchGameCompleted = false;
  memoryGameCompleted = false;
  loveQuizCompleted = false;

  // reset game-specific UI
  el.scratchContinueBtn.classList.add("hidden");

  // existing reset logic ↓↓↓
  noCount = 0;
  yesScale = 1;

  el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);

  if (yesOverlayEl) {
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  el.yesBtn.removeAttribute("style");
  el.noBtn.style.position = "relative";
  el.noBtn.style.left = "";
  el.noBtn.style.top = "";

  el.hint.textContent = "Tip: Don't you fkn dare press NO.";
  showStart();

  selectedActivity = null;
  plans = safeLoadPlans();
  renderActivityPicker();
  updatePlannerActions();

  stopConfetti();
});

el.replayBackBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  // ensure YES/NO never reappear
  el.btnRow.classList.add("hidden");
  el.hint.classList.add("hidden");

  updateGamesContinue();
});
