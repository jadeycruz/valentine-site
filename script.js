'use strict';

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
 * 2) Helpers + elements
 ***********************/
const $ = (sel, root = document) => root.querySelector(sel);

const el = {
  toLine: $('#toLine'),
  mainMessage: $('#mainMessage'),
  subMessage: $('#subMessage'),
  yesBtn: $('#yesBtn'),
  noBtn: $('#noBtn'),
  hint: $('#hint'),

  btnRow: $('#btnRow'),
  heartsLayer: $('#hearts-layer'),
  bgMusic: $('#bgMusic'),

  // sections
  planner: $('#planner'),
  gamesMenu: $('#gamesMenu'),
  carousel: $('#carousel'),
  result: $('#result'),

  // planner
  plannerView: $('#plannerView'),
  cancelPlanBtn: $('#cancelPlanBtn'),
  donePlanningBtn: $('#donePlanningBtn'),
  exportTxtBtn: $('#exportTxtBtn'),

  // result
  resultTitle: $('#resultTitle'),
  resultText: $('#resultText'),
  restartBtn: $('#restartBtn'),

  // games
  photoGameBtn: $('#photoGameBtn'),
  gamesBackBtn: $('#gamesBackBtn'),
  gamesContinueBtn: $('#gamesContinueBtn'),

  // photo game
  gameArea: $('#gameArea'),
  gameOverlay: $('#gameOverlay'),
  lockText: $('#lockText'),
  hintText: $('#hintText'),
  gamePrompt: $('#gamePrompt'),
  gameStatus: $('#gameStatus'),
  ping: $('#ping'),
  carouselImg: $('#carouselImg'),
  carouselBadge: $('#carouselBadge'),
  nextPhotoBtn: $('#nextPhotoBtn'),
  continueBtn: $('#continueBtn'),
  backToPlanBtn: $('#backToPlanBtn'),

  // confetti
  confettiCanvas: $('#confetti'),
};

const ctx = el.confettiCanvas.getContext('2d');

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

  el.noBtn.style.position = 'absolute';
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
    yesOverlayEl = document.createElement('div');
    yesOverlayEl.id = 'yesOverlay';
    document.body.appendChild(yesOverlayEl);
  }
  yesOverlayEl.appendChild(el.yesBtn);

  // reset inline styles
  el.yesBtn.style.position = 'static';
  el.yesBtn.style.left = '';
  el.yesBtn.style.top = '';
  el.yesBtn.style.right = '';
  el.yesBtn.style.bottom = '';
  el.yesBtn.style.transform = 'none';
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

el.noBtn.addEventListener('click', () => {
  playMusicSafely();
  noCount++;

  if (noCount >= FULLSCREEN_AFTER_NO_CLICKS) {
    makeYesFullscreen();
    el.hint.textContent = noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
    spawnHearts(6 + noCount * 2);
    return; // prevents growYesButton() / moveNoButtonAway()
  }

  growYesButton();
  moveNoButtonAway();

  el.hint.textContent = noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
  spawnHearts(6 + noCount * 2);
});

// Bonus: make it harder by also moving when hovered (desktop)
el.noBtn.addEventListener('mouseenter', () => {
  if (noCount >= 3) moveNoButtonAway();
});

el.yesBtn.addEventListener('click', () => {
  playMusicSafely();

  // If YES is fullscreen, remove overlay so planner is clickable/visible
  if (yesOverlayEl) {
    el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  // Hide the buttons and open planner instead of final result
  el.btnRow.classList.add('hidden');
  el.hint.classList.add('hidden');
  el.planner.classList.remove('hidden');

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
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
      ${ACTIVITIES.map((a) => `
        <button class="activity-btn" type="button" data-action="select-activity" data-activity-id="${a.id}">
          <img src="${a.img}" alt="${a.name}" />
          ${a.name}
        </button>
      `).join('')}
    </div>

    <div class="saved-list">
      <div class="saved-list__head">
        <strong>Saved plans:</strong>
        <button class="btn secondary" type="button" data-action="clear-plans">Clear ✖</button>
      </div>

      ${
        plans.length
          ? plans.map((p) => `<div>• ${escapeHtml(p.date)} — ${escapeHtml(p.activity)}</div>`).join('')
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
  const input = $('#planDate');
  if (input) input.focus();
}

function updatePlannerActions() {
  // Hide Done planning if:
  // - you're inside an activity form
  // - OR you haven't saved anything yet
  if (selectedActivity || plans.length === 0) {
    el.donePlanningBtn.classList.add('hidden');
  } else {
    el.donePlanningBtn.classList.remove('hidden');
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Planner event delegation
el.plannerView.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'select-activity') {
    const id = btn.dataset.activityId;
    selectedActivity = ACTIVITIES.find((a) => a.id === id) || null;
    updatePlannerActions();
    if (selectedActivity) renderPlanForm(selectedActivity);
    return;
  }

  if (action === 'save-plan') {
    const date = $('#planDate')?.value;
    const note = ($('#planNote')?.value || '').trim();

    if (!date) {
      spawnHearts(6);
      return;
    }

    plans.push({
      date,
      activity: selectedActivity?.name || 'Unknown',
      note,
    });

    savePlans();

    // Exit the form view back to picker
    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
    return;
  }

  if (action === 'clear-plans') {
    const confirmDelete = confirm('Delete all saved plans? 💔');
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
    .map((p) => `${p.date} | ${p.activity} | ${p.note || '(no note)'}`)
    .join('\n');

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'valentine-plans.txt';
  a.click();

  // cleanup
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

el.exportTxtBtn.addEventListener('click', exportTxt);

el.cancelPlanBtn.addEventListener('click', () => {
  // Always go back to activity picker (never return to YES/NO start screen)
  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

el.donePlanningBtn.addEventListener('click', () => {
  el.planner.classList.add('hidden');
  el.gamesMenu.classList.remove('hidden');
  updateGamesContinue();
});

el.gamesBackBtn.addEventListener('click', () => {
  el.gamesMenu.classList.add('hidden');
  el.planner.classList.remove('hidden');

  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

/***********************
 * 7) Games menu + flow
 ***********************/
let photoGameCompleted = false;

function updateGamesContinue() {
  if (photoGameCompleted) {
    el.gamesContinueBtn.classList.remove('hidden');
    el.gamesContinueBtn.disabled = false;
    el.gamesContinueBtn.textContent = 'Continue 💘';
  } else {
    el.gamesContinueBtn.classList.add('hidden');
    el.gamesContinueBtn.disabled = true;
  }
}

el.photoGameBtn.addEventListener('click', () => {
  el.gamesMenu.classList.add('hidden');
  el.carousel.classList.remove('hidden');

  // reset completion each time you start the game (optional)
  photoGameCompleted = false;
  updateGamesContinue();

  initPhotoGame();
});

el.gamesContinueBtn.addEventListener('click', () => {
  el.gamesMenu.classList.add('hidden');
  el.result.classList.remove('hidden');
});

el.backToPlanBtn.addEventListener('click', () => {
  el.carousel.classList.add('hidden');
  el.gamesMenu.classList.remove('hidden');
  updateGamesContinue();
});

el.continueBtn.addEventListener('click', () => {
  el.carousel.classList.add('hidden');
  el.result.classList.remove('hidden');
});

/***********************
 * 8) Photo mini game
 ***********************/
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
  el.carouselBadge.textContent = `${Math.min(unlockedCount + 1, CAROUSEL_PHOTOS.length)} / ${CAROUSEL_PHOTOS.length}`;
  el.gameStatus.textContent = `${unlockedCount} / ${CAROUSEL_PHOTOS.length} photos unlocked`;
}

function lockPhoto() {
  el.carouselImg.classList.add('hidden');
  el.gameOverlay.classList.remove('hidden');
  el.nextPhotoBtn.classList.add('hidden');

  el.lockText.textContent = '🔒 Locked';
  el.hintText.textContent = 'Click around to find the heart 💘';

  setNewTarget();
  updateProgressUI();
}

function revealPhoto() {
  el.carouselImg.src = CAROUSEL_PHOTOS[currentPhotoIndex];
  el.carouselImg.classList.remove('hidden');
  el.gameOverlay.classList.add('hidden');

  const isLastPhoto = currentPhotoIndex === CAROUSEL_PHOTOS.length - 1;

  // ✅ Only show Next if there IS a next photo
  if (isLastPhoto) {
    el.nextPhotoBtn.classList.add('hidden');
  } else {
    el.nextPhotoBtn.classList.remove('hidden');
  }

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
  el.gamePrompt.textContent = 'Find the hidden heart to reveal the next photo 👀';

  el.continueBtn.classList.add('hidden');
  lockPhoto();
}

el.gameArea.addEventListener('click', (e) => {
  if (unlockedCount >= CAROUSEL_PHOTOS.length) return;

  const rect = el.gameArea.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  showPing(e.clientX - rect.left, e.clientY - rect.top);

  const dx = x - targetX;
  const dy = y - targetY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= HIT_RADIUS) {
    el.lockText.textContent = '💖 Found it!';
    el.hintText.textContent = 'Unlocked 😤';
    revealPhoto();

    const isLastPhoto = currentPhotoIndex === CAROUSEL_PHOTOS.length - 1;

    // ✅ If this was the LAST photo, finish immediately
    if (isLastPhoto) {
      unlockedCount = CAROUSEL_PHOTOS.length;

      el.gamePrompt.textContent = 'All photos unlocked 🥹💞';
      el.lockText.textContent = '✅ Complete';
      el.hintText.textContent = 'Press Continue 💘';

      updateProgressUI();
      spawnHearts(12);

      photoGameCompleted = true;
      el.continueBtn.classList.remove('hidden');
      updateGamesContinue();
    }
  } else {
    el.hintText.textContent = distanceHint(dist);
  }
});

el.nextPhotoBtn.addEventListener('click', () => {
  unlockedCount++;

  if (unlockedCount >= CAROUSEL_PHOTOS.length) {
    el.nextPhotoBtn.classList.add('hidden');
    el.gamePrompt.textContent = 'All photos unlocked 🥹💞';
    el.lockText.textContent = '✅ Complete';
    el.hintText.textContent = 'Press Continue 💘';

    updateProgressUI();
    spawnHearts(12);

    photoGameCompleted = true;
    el.continueBtn.classList.remove('hidden');
    updateGamesContinue();
    return;
  }

  currentPhotoIndex = unlockedCount;
  lockPhoto();
  spawnHearts(8);
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
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.style.color = randomHeartColor();

    const size = 10 + Math.random() * 18;
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;

    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.bottom = '-5vh';

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
el.restartBtn.addEventListener('click', () => {
  noCount = 0;
  yesScale = 1;

  // Put YES button back into the original button row
  el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);

  // Remove overlay if it exists
  if (yesOverlayEl) {
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  // reset button styles
  el.yesBtn.removeAttribute('style');
  el.noBtn.style.position = 'relative';
  el.noBtn.style.left = '';
  el.noBtn.style.top = '';

  el.hint.textContent = 'Tip: Don\'t you fkn dare press NO.';
  el.btnRow.classList.remove('hidden');
  el.hint.classList.remove('hidden');

  el.result.classList.add('hidden');
  el.planner.classList.add('hidden');
  el.gamesMenu.classList.add('hidden');
  el.carousel.classList.add('hidden');

  selectedActivity = null;
  plans = safeLoadPlans();
  renderActivityPicker();
  updatePlannerActions();

  stopConfetti();
});