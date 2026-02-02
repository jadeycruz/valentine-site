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

// Put your photos in the same folder OR use an /photos folder.
const CAROUSEL_PHOTOS = [
  "photos/photo1.jpg",
  "photos/photo2.jpg",
  "photos/photo3.jpg",
];

/***********************
 * 2) Grab elements
 ***********************/
const toLine = document.getElementById("toLine");
const mainMessage = document.getElementById("mainMessage");
const subMessage = document.getElementById("subMessage");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const restartBtn = document.getElementById("restartBtn");
const hint = document.getElementById("hint");

const btnRow = document.getElementById("btnRow");
const heartsLayer = document.getElementById("hearts-layer");
const bgMusic = document.getElementById("bgMusic");

const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

const planner = document.getElementById("planner");
const cancelPlanBtn = document.getElementById("cancelPlanBtn");
const planHint = document.getElementById("planHint");
const donePlanningBtn = document.getElementById("donePlanningBtn");

const carousel = document.getElementById("carousel");
const carouselImg = document.getElementById("carouselImg");
const carouselBadge = document.getElementById("carouselBadge");
const continueBtn = document.getElementById("continueBtn");
const backToPlanBtn = document.getElementById("backToPlanBtn");

const gameArea = document.getElementById("gameArea");
const gameOverlay = document.getElementById("gameOverlay");
const lockText = document.getElementById("lockText");
const hintText = document.getElementById("hintText");
const gamePrompt = document.getElementById("gamePrompt");
const gameStatus = document.getElementById("gameStatus");
const ping = document.getElementById("ping");
const nextPhotoBtn = document.getElementById("nextPhotoBtn");


/***********************
 * 3) Initialize text
 ***********************/
toLine.textContent = `${CONFIG.toLine}${CONFIG.recipientName} 💌`;
mainMessage.textContent = CONFIG.mainMessage;
subMessage.textContent = CONFIG.subMessage;
yesBtn.textContent = CONFIG.yesButtonText;
noBtn.textContent = CONFIG.noButtonText;

resultTitle.textContent = CONFIG.yesResultTitle;
resultText.textContent = CONFIG.yesResultText;

/***********************
 * 4) Button behaviors
 ***********************/
let noCount = 0;
let yesScale = 1;

function playMusicSafely() {
  // Browsers require user interaction for audio autoplay
  if (!bgMusic) return;
  bgMusic.volume = 0.35;
  bgMusic.play().catch(() => {
    // If no file or blocked, just ignore silently
  });
}

function moveNoButtonAway() {
  const rowRect = btnRow.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  // Allow the No button to move within the button row area
  const maxX = rowRect.width - btnRect.width;
  const maxY = rowRect.height - btnRect.height;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  noBtn.style.position = "absolute";
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
}

function growYesButton() {
  yesScale = Math.min(yesScale + 0.12, 2.2);
  yesBtn.style.transform = `scale(${yesScale})`;
}

const FULLSCREEN_AFTER_NO_CLICKS = 10; // change this number if you want

function makeYesFullscreen(){
  yesBtn.classList.add("yes-fullscreen");
  // optional: stop scaling once fullscreen
  yesBtn.style.transform = "none";
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

noBtn.addEventListener("click", () => {
  playMusicSafely();

  noCount++;
  
  if (noCount >= FULLSCREEN_AFTER_NO_CLICKS) {
    makeYesFullscreen();
  }
  
  growYesButton();
  moveNoButtonAway();

  // Change hint text to something playful
  const phrase = noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
  hint.textContent = phrase;

  // Make hearts spawn faster as "No" increases
  spawnHearts(6 + noCount * 2);
});

// Bonus: make it harder by also moving when hovered (desktop)
noBtn.addEventListener("mouseenter", () => {
  if (noCount >= 3) moveNoButtonAway();
});

yesBtn.addEventListener("click", () => {
  playMusicSafely();

  // Hide the buttons and open planner instead of final result
  btnRow.classList.add("hidden");
  hint.classList.add("hidden");

  planner.classList.remove("hidden");

  // Confetti + hearts party
  startConfetti();
  spawnHearts(18);
});

cancelPlanBtn.addEventListener("click", () => {
  // If user is inside an activity, go back to activity picker
  if (selectedActivity) {
    selectedActivity = null;
    updatePlannerActions();
    renderActivityPicker();
    return;
  }

  // Otherwise, exit planner entirely (back to start)
  planner.classList.add("hidden");
  btnRow.classList.remove("hidden");
  hint.classList.remove("hidden");
});

restartBtn.addEventListener("click", () => {
  // Reset everything
  noCount = 0;
  yesScale = 1;

  yesBtn.classList.remove("yes-fullscreen");
  yesBtn.style.transform = "";
  noBtn.style.position = "relative";
  noBtn.style.left = "";
  noBtn.style.top = "";

  hint.textContent = "Tip: Don't you fkn dare press NO.";
  btnRow.classList.remove("hidden");
  hint.classList.remove("hidden");
  result.classList.add("hidden");

  planner.classList.add("hidden");
  selectedActivity = null;
  renderActivityPicker();
  planHint.textContent = "Tip: pick an activity we can do 😁";

  stopConfetti();
});

donePlanningBtn.addEventListener("click", () => {
  // You can enforce "must have at least one saved plan" if you want:
  // if (!plans.length) { planHint.textContent = "Nah you have to hangout with me in order to continue 😡"; return; }

  planner.classList.add("hidden");
  carousel.classList.remove("hidden");

  // start the photo game
  initPhotoGame();
});

/***********************
 * Planner: Activities
 ***********************/
const ACTIVITIES = [
  { id: "dinner", name: "Dinner Date", img: "activity/dinner.gif" },
  { id: "movie", name: "Movie Night", img: "activity/movie.gif" },
  { id: "skating", name: "Ice Skating", img: "activity/skating.gif" },
  { id: "chilling", name: "Just Chill", img: "activity/chilling.gif" },
];

const STORAGE_KEY = "valentine_plans";
let selectedActivity = null;
let plans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const plannerView = document.getElementById("plannerView");
const exportTxtBtn = document.getElementById("exportTxtBtn");

renderActivityPicker();
updatePlannerActions();

exportTxtBtn.onclick = exportTxt;

function renderActivityPicker(){
  plannerView.innerHTML = `
    <p class="tiny">Choose an activity:</p>

    <div class="activity-grid">
      ${ACTIVITIES.map(a => `
        <button class="activity-btn" onclick="selectActivity('${a.id}')">
          <img src="${a.img}" />
          ${a.name}
        </button>
      `).join("")}
    </div>

    <div class="saved-list">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>Saved plans:</strong>
        <button class="btn secondary" onclick="clearPlans()">Clear ✖</button>
      </div>

      ${
        plans.length
          ? plans.map(p => `<div>• ${p.date} — ${p.activity}</div>`).join("")
          : "<div class='tiny'>None yet</div>"
      }
    </div>
  `;
}

window.selectActivity = function(id){
  selectedActivity = ACTIVITIES.find(a => a.id === id);
  updatePlannerActions();
  plannerView.innerHTML = `
    <div class="planner-form">
      <label>
        Date
        <input type="date" id="planDate" />
      </label>

      <label>
        Note
        <textarea id="planNote" rows="3"></textarea>
      </label>

      <button class="btn yes" onclick="savePlan()">Save 💘</button>
    </div>
  `;
};

window.savePlan = async function(){
  const date = document.getElementById("planDate").value;
  const note = document.getElementById("planNote").value.trim();

  if(!date){
    spawnHearts(6);
    return;
  }

  const entry = {
    date,
    activity: selectedActivity.name,
    note
  };

  plans.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));

  renderActivityPicker();
  updatePlannerActions();
};

window.clearPlans = function () {
  const confirmDelete = confirm(
    "Delete all saved plans? 💔"
  );

  if (!confirmDelete) return;

  plans = [];
  localStorage.removeItem(STORAGE_KEY);

  renderActivityPicker();
};

function exportTxt(){
  const text = plans.map(p =>
    `${p.date} | ${p.activity} | ${p.note || "(no note)"}`
  ).join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "valentine-plans.txt";
  a.click();
}

function updatePlannerActions(){
  // Hide "Done planning" when you're inside an activity form
  if (selectedActivity) {
    donePlanningBtn.classList.add("hidden");
  } else {
    donePlanningBtn.classList.remove("hidden");
  }
}

/***********************
 * Photo Carousel
 ***********************/
// For swipe support
let touchStartX = 0;
let touchEndX = 0;

let unlockedCount = 0;
let currentPhotoIndex = 0;

let targetX = 50; // percent
let targetY = 50; // percent
const HIT_RADIUS = 10; // percent radius (smaller = harder)

function setNewTarget() {
  targetX = 15 + Math.random() * 70;
  targetY = 20 + Math.random() * 60;
}

function updateProgressUI() {
  carouselBadge.textContent = `${Math.min(unlockedCount + 1, CAROUSEL_PHOTOS.length)} / ${CAROUSEL_PHOTOS.length}`;
  gameStatus.textContent = `${unlockedCount} / ${CAROUSEL_PHOTOS.length} photos unlocked`;
}

function lockPhoto() {
  carouselImg.classList.add("hidden");
  gameOverlay.classList.remove("hidden");
  nextPhotoBtn.classList.add("hidden");
  lockText.textContent = "🔒 Locked";
  hintText.textContent = "Click around to find the heart 💘";
  setNewTarget();
  updateProgressUI();
}

function revealPhoto() {
  carouselImg.src = CAROUSEL_PHOTOS[currentPhotoIndex];
  carouselImg.classList.remove("hidden");
  gameOverlay.classList.add("hidden");
  nextPhotoBtn.classList.remove("hidden");
  spawnHearts(18);
}

function distanceHint(dist) {
  if (dist < 6) return "SO CLOSE 😳";
  if (dist < 10) return "Warmer 👀";
  if (dist < 16) return "Getting there 🙂";
  return "Cold 🥶";
}

function showPing(xPx, yPx) {
  ping.classList.remove("hidden");
  ping.style.left = `${xPx}px`;
  ping.style.top = `${yPx}px`;

  ping.style.animation = "none";
  ping.offsetHeight; // reflow
  ping.style.animation = "";

  setTimeout(() => ping.classList.add("hidden"), 600);
}

function initPhotoGame() {
  unlockedCount = 0;
  currentPhotoIndex = 0;
  gamePrompt.textContent = "Find the hidden heart to reveal the next photo 👀";
  lockPhoto();
}

gameArea.addEventListener("click", (e) => {
  if (unlockedCount >= CAROUSEL_PHOTOS.length) return;

  const rect = gameArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  showPing(e.clientX - rect.left, e.clientY - rect.top);

  const dx = x - targetX;
  const dy = y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= HIT_RADIUS) {
    lockText.textContent = "💖 Found it!";
    hintText.textContent = "Unlocked 😤";
    revealPhoto();
  } else {
    hintText.textContent = distanceHint(dist);
  }
});

nextPhotoBtn.addEventListener("click", () => {
  unlockedCount++;

  if (unlockedCount >= CAROUSEL_PHOTOS.length) {
    nextPhotoBtn.classList.add("hidden");
    gamePrompt.textContent = "All photos unlocked 🥹💞";
    lockText.textContent = "✅ Complete";
    hintText.textContent = "Press Continue 💘";
    updateProgressUI();
    spawnHearts(12);
    return;
  }

  currentPhotoIndex = unlockedCount;
  lockPhoto();
  spawnHearts(8);
});

/***********************
 * 5) Floating hearts
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
    heart.style.bottom = `-5vh`;

    const duration = 3 + Math.random() * 4;
    heart.style.animationDuration = `${duration}s`;

    heart.style.opacity = `${0.5 + Math.random() * 0.5}`;

    heartsLayer.appendChild(heart);

    // Cleanup
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
let rafId = null;

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
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
    // random bright color
    color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`,
  };
}

function startConfetti() {
  confettiRunning = true;
  confettiPieces = Array.from({ length: 140 }, makeConfettiPiece);
  loopConfetti();
}

function stopConfetti() {
  confettiRunning = false;
  confettiPieces = [];
  if (rafId) cancelAnimationFrame(rafId);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function loopConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const p of confettiPieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;

    // wrap / reset
    if (p.y > window.innerHeight + 40) {
      p.x = Math.random() * window.innerWidth;
      p.y = -20;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.r, -p.r, p.r * 2.2, p.r * 1.2);
    ctx.restore();
  }

  if (confettiRunning) rafId = requestAnimationFrame(loopConfetti);
}
