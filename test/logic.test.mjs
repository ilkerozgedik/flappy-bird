import test from "node:test";
import assert from "node:assert/strict";
import { WORLD, newGame, startRound, flap, step, spawnPipe, circleHitsRect } from "../logic.mjs";

const random = () => 0.5;
const playing = () => {
  const state = newGame(random);
  startRound(state, random);
  return state;
};

test("round starts with one pipe, centered bird and reset score", () => {
  const state = playing();
  assert.equal(state.mode, "playing");
  assert.equal(state.score, 0);
  assert.equal(state.pipes.length, 1);
  assert.equal(state.bird.y, 320);
  state.score = 3;
  startRound(state, random);
  assert.equal(state.score, 0);
  assert.equal(state.pipes.length, 1);
});

test("flap applies upward velocity; gravity subsequently pulls bird down", () => {
  const state = playing();
  flap(state);
  assert.equal(state.bird.vy, WORLD.jumpVelocity);
  step(state, 0.01, random);
  assert.ok(state.bird.y < 320);
  assert.ok(state.bird.vy > WORLD.jumpVelocity);
});

test("scoring occurs exactly once after passing a pipe", () => {
  const state = playing();
  state.pipes = [{ x: 30, top: 60, scored: false }];
  let result = step(state, 0.01, random);
  assert.equal(result.scored, true);
  assert.equal(state.score, 1);
  result = step(state, 0.01, random);
  assert.equal(result.scored, false);
  assert.equal(state.score, 1);
});

test("pipe contact ends game without further movement", () => {
  const state = playing();
  state.pipes = [{ x: 75, top: 340, scored: false }];
  const result = step(state, 1 / 120, random);
  assert.equal(result.crashed, true);
  assert.equal(state.mode, "gameover");
  const y = state.bird.y;
  const x = state.pipes[0].x;
  step(state, 1, random);
  assert.equal(state.bird.y, y);
  assert.equal(state.pipes[0].x, x);
});

test("floor or ceiling contact ends game", () => {
  for (const y of [5, WORLD.height - WORLD.ground - 5]) {
    const state = playing();
    state.pipes = [];
    state.bird.y = y;
    assert.equal(step(state, 0.001, random).crashed, true);
  }
});

test("pipes spawn every two seconds within legal vertical range", () => {
  const state = playing();
  state.pipes = [];
  state.spawnTimer = 1.99;
  step(state, 0.02, random);
  assert.equal(state.pipes.length, 1);
  const top = state.pipes[0].top;
  assert.ok(top >= 50);
  assert.ok(top + WORLD.pipeGap < WORLD.height - WORLD.ground);
});

test("random pipe positions remain inside drawable area", () => {
  const state = playing();
  state.pipes = [];
  for (const value of [0, 1]) {
    spawnPipe(state, () => value);
  }
  assert.equal(state.pipes[0].top, 50);
  assert.equal(state.pipes[1].top, WORLD.height - WORLD.ground - WORLD.pipeGap - 50);
});

test("circle/rectangle collision detects overlap and rejects separation", () => {
  assert.equal(circleHitsRect(10, 10, 5, 12, 12, 20, 20), true);
  assert.equal(circleHitsRect(10, 10, 5, 30, 30, 20, 20), false);
});

test("menu input does not affect physics", () => {
  const state = newGame(random);
  flap(state);
  assert.equal(state.bird.vy, 0);
  step(state, 1, random);
  assert.equal(state.mode, "menu");
  assert.equal(state.bird.y, 320);
});
