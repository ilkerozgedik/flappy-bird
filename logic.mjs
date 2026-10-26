// Pure game rules. No dependencies or browser APIs; tested with node --test.
export const WORLD = Object.freeze({
  width: 360,
  height: 640,
  ground: 112,
  birdWidth: 34,
  birdHeight: 24,
  birdX: 90,
  pipeWidth: 52,
  pipeGap: 160,
  pipeSpeed: 200,
  spawnEvery: 2,
  gravity: 640 * 2.4,
  jumpVelocity: -640 * 0.7,
});

export function newGame(random = Math.random) {
  return {
    mode: "menu",
    score: 0,
    bird: { x: WORLD.birdX, y: WORLD.height / 2, vy: 0 },
    pipes: [],
    spawnTimer: 0,
    groundOffset: 0,
    elapsed: 0,
    night: random() < 0.5,
    redPipes: random() < 0.5,
    crash: false,
  };
}

export function spawnPipe(state, random = Math.random) {
  const maxTop = WORLD.height - WORLD.ground - WORLD.pipeGap - 50;
  const top = 50 + random() * (maxTop - 50);
  state.pipes.push({ x: WORLD.width, top, scored: false });
}

export function startRound(state, random = Math.random) {
  state.mode = "playing";
  state.score = 0;
  state.bird = { x: WORLD.birdX, y: WORLD.height / 2, vy: 0 };
  state.pipes = [];
  state.spawnTimer = 0;
  state.groundOffset = 0;
  state.elapsed = 0;
  state.night = random() < 0.5;
  state.redPipes = random() < 0.5;
  state.crash = false;
  spawnPipe(state, random);
}

export function flap(state) {
  if (state.mode === "playing") {
    state.bird.vy = WORLD.jumpVelocity;
  }
}

// A circular bird hitbox is closer to Flame's CircleHitbox than a box.
export function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

// Return simple events so the renderer can play sounds and update UI.
export function step(state, dt, random = Math.random) {
  if (state.mode !== "playing") return { scored: false, crashed: false };
  const b = state.bird;
  const r = WORLD.birdHeight / 2;
  state.elapsed += dt;
  b.vy += WORLD.gravity * dt;
  b.y += b.vy * dt;
  state.groundOffset = (state.groundOffset + WORLD.pipeSpeed * dt) % 336;

  let scored = false;
  state.spawnTimer += dt;
  while (state.spawnTimer >= WORLD.spawnEvery) {
    state.spawnTimer -= WORLD.spawnEvery;
    spawnPipe(state, random);
  }

  let crashed = b.y + r >= WORLD.height - WORLD.ground || b.y - r <= 0;
  for (const pipe of state.pipes) {
    pipe.x -= WORLD.pipeSpeed * dt;

    if (!pipe.scored && pipe.x + WORLD.pipeWidth < b.x) {
      pipe.scored = true;
      state.score += 1;
      scored = true;
    }

    const bottomY = pipe.top + WORLD.pipeGap;
    if (circleHitsRect(b.x, b.y, r, pipe.x, 0, WORLD.pipeWidth, pipe.top) ||
        circleHitsRect(b.x, b.y, r, pipe.x, bottomY,
                       WORLD.pipeWidth, WORLD.height - WORLD.ground - bottomY)) {
      crashed = true;
    }
  }
  state.pipes = state.pipes.filter(pipe => pipe.x + WORLD.pipeWidth >= 0);
  if (crashed) {
    state.mode = "gameover";
    state.crash = true;
  }
  return { scored, crashed };
}
