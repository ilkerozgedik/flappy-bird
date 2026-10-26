import { WORLD, newGame, startRound, flap, step } from "./logic.mjs";

const canvas = document.querySelector("#game");
const frame = document.querySelector("#game-frame");
const ctx = canvas.getContext("2d", { alpha: false });
const startOverlay = document.querySelector("#start-overlay");
const gameoverOverlay = document.querySelector("#gameover-overlay");
const errorOverlay = document.querySelector("#error-overlay");
const finalScore = document.querySelector("#final-score");
const bestScore = document.querySelector("#best-score");

const imageNames = [
  "background", "background_night", "ground", "pipe", "pipe_red",
  "bird", "bird_down", "bird_up", ...Array.from({ length: 10 }, (_, i) => String(i)),
];
const images = {};
let state = newGame();
let ready = false;
let best = 0;
let lastTime = 0;
let accumulator = 0;
const tick = 1 / 120;

try { best = Number(localStorage.getItem("flappy-bird-best")) || 0; } catch { /* blocked storage */ }

const sounds = {};
for (const name of ["wing", "swoosh", "point", "hit", "die"]) {
  sounds[name] = Array.from({ length: name === "wing" ? 3 : 1 }, () => {
    const a = new Audio("./assets/audio/" + name + ".ogg");
    a.preload = "auto";
    a.volume = 0.55;
    return a;
  });
}
let wingIndex = 0;

function play(name) {
  const list = sounds[name];
  const audio = name === "wing" ? list[(wingIndex++) % list.length] : list[0];
  audio.currentTime = 0;
  audio.play().catch(() => { /* browser autoplay protection */ });
}

function setCanvasResolution() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(WORLD.width * dpr);
  canvas.height = Math.round(WORLD.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", setCanvasResolution);
setCanvasResolution();

function draw() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  ctx.drawImage(images[state.night ? "background_night" : "background"], 0, 0, WORLD.width, WORLD.height);

  for (const pipe of state.pipes) {
    const sprite = images[state.redPipes ? "pipe_red" : "pipe"];
    const x = Math.round(pipe.x);
    const top = Math.round(pipe.top);
    const bottomY = top + WORLD.pipeGap;
    ctx.save();
    ctx.translate(x, top);
    ctx.scale(1, -1);
    ctx.drawImage(sprite, 0, 0, WORLD.pipeWidth, top);
    ctx.restore();
    ctx.drawImage(sprite, x, bottomY, WORLD.pipeWidth, WORLD.height - WORLD.ground - bottomY);
  }

  const offset = state.groundOffset;
  for (let x = -offset; x < WORLD.width; x += 336) {
    ctx.drawImage(images.ground, Math.floor(x), WORLD.height - WORLD.ground, 336, WORLD.ground);
  }

  if (state.mode !== "menu") {
    const b = state.bird;
    const frames = ["bird_down", "bird", "bird_up", "bird"];
    const sprite = images[frames[Math.floor(state.elapsed / 0.15) % frames.length]];
    const angle = Math.max(-0.5, Math.min(0.5, b.vy * 0.003));
    ctx.save();
    ctx.translate(Math.round(b.x), Math.round(b.y));
    ctx.rotate(angle);
    ctx.drawImage(sprite, -WORLD.birdWidth / 2, -WORLD.birdHeight / 2, WORLD.birdWidth, WORLD.birdHeight);
    ctx.restore();
  }

  if (state.mode === "playing") {
    const text = String(state.score);
    const total = text.length * 24 + (text.length - 1) * 2;
    let x = Math.floor((WORLD.width - total) / 2);
    for (const digit of text) {
      ctx.drawImage(images[digit], x, 32, 24, 36);
      x += 26;
    }
  }
}

function showMode() {
  startOverlay.hidden = state.mode !== "menu";
  gameoverOverlay.hidden = state.mode !== "gameover";
  if (state.mode === "gameover") {
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem("flappy-bird-best", String(best)); } catch { /* blocked storage */ }
    }
    finalScore.textContent = String(state.score);
    bestScore.textContent = String(best);
  }
}

function start() {
  if (!ready || state.mode === "playing") return;
  startRound(state);
  accumulator = 0;
  showMode();
  play("swoosh");
}

function action() {
  if (!ready) return;
  if (state.mode !== "playing") start();
  else {
    flap(state);
    play("wing");
  }
}

document.querySelector("#start-button").addEventListener("click", start);
document.querySelector("#restart-button").addEventListener("click", start);
document.querySelector("#retry-button").addEventListener("click", () => location.reload());
frame.addEventListener("pointerdown", event => {
  if (event.target.closest("button, a")) return;
  action();
});
window.addEventListener("keydown", event => {
  if (event.code !== "Space" && event.code !== "ArrowUp") return;
  if (event.target instanceof HTMLElement && event.target.closest("button, a")) return;
  event.preventDefault();
  if (!event.repeat) action();
});

document.addEventListener("visibilitychange", () => {
  lastTime = performance.now();
  accumulator = 0;
});

function animationFrame(now) {
  if (!ready) return;
  const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
  lastTime = now;

  if (state.mode === "playing") {
    accumulator += delta;
    while (accumulator >= tick && state.mode === "playing") {
      accumulator -= tick;
      const events = step(state, tick);
      if (events.scored) play("point");
      if (events.crashed) {
        play("hit");
        window.setTimeout(() => {
          if (state.mode === "gameover") play("die");
        }, 200);
        showMode();
      }
    }
  }
  draw();
  requestAnimationFrame(animationFrame);
}

function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = () => reject(new Error("Cannot load image: " + name));
    img.src = "./assets/images/" + name + ".png";
  });
}

Promise.all(imageNames.map(loadImage))
  .then(() => {
    ready = true;
    showMode();
    requestAnimationFrame(animationFrame);
  })
  .catch(error => {
    console.error(error);
    startOverlay.hidden = true;
    errorOverlay.hidden = false;
  });
