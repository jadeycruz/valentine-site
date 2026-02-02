console.log("script.js is running ✅");
alert("Hello from JS!");

/***********************
 * 1) Easy customization
 ***********************/
const CONFIG = {
  recipientName: "Jade", // <-- change this
  toLine: "To: ",
  mainMessage: "Will you be my Valentine? 💖",
  subMessage: "I promise snacks, hugs, and a very cute date.",
  yesResultTitle: "YAYYYYY!!! 💘",
  yesResultText: "Best decision ever. I’m so excited!!!",
  yesButtonText: "Yes",
  noButtonText: "No",
};

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

const noPhrases = [
  "Are you sure? 🥺",
  "Like… 100% sure? 😭",
  "Please reconsider 😳",
  "I made you hearts tho 💗",
  "Ok wow… rude (jk) 😈",
  "Last chance!!!",
];

noBtn.addEventListener("click", () => {
  playMusicSafely();

  noCount++;
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
  if (noCount >= 2) moveNoButtonAway();
});

yesBtn.addEventListener("click", () => {
  playMusicSafely();

  // Hide buttons & show result
  btnRow.classList.add("hidden");
  hint.classList.add("hidden");
  result.classList.remove("hidden");

  // Confetti + hearts party
  startConfetti();
  spawnHearts(40);
});

restartBtn.addEventListener("click", () => {
  // Reset everything
  noCount = 0;
  yesScale = 1;

  yesBtn.style.transform = "";
  noBtn.style.position = "relative";
  noBtn.style.left = "";
  noBtn.style.top = "";

  hint.textContent = "Tip: try pressing “No” 😈";
  btnRow.classList.remove("hidden");
  hint.classList.remove("hidden");
  result.classList.add("hidden");

  stopConfetti();
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
