// Simmer & Serve — boot, the shift loop, and every player action.
// The game has three screens: title, play and end. During play the clock
// runs down, the order board ticks, the kitchen ticks, and the chef walks.
// Clicking a station acts on it at once and sends the chef strolling over;
// the keys mirror every action. The loop is a fixed 60 Hz step, so the
// game plays the same on any display.

import { FIELD, SHIFT, CHEF, BEST_KEY, STATIONS } from './config.js';
import { INGREDIENTS } from './recipes.js';
import { Kitchen } from './kitchen.js';
import { OrderBoard, makeRandom } from './orders.js';
import { drawGame } from './render.js';
import { wireInput, stationAt, stationTarget, walkDirection } from './input.js';
import { SoundBox } from './audio.js';
import { shotFromUrl, applyShot } from './shots.js';

/** The whole game, in one state object the renderer reads. */
export function createState() {
  const random = makeRandom(20261125);
  return {
    screen: 'title',
    time: 0,
    elapsed: 0,
    timeLeft: SHIFT.seconds,
    rush: false,
    rushAnnounced: false,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    kitchen: new Kitchen(),
    board: new OrderBoard(random),
    chef: { x: 640, y: 420, moving: false, target: null },
    sound: new SoundBox(),
  };
}

/** Start a fresh shift, keeping the best score. */
export function startShift(state) {
  state.kitchen = new Kitchen();
  state.board = new OrderBoard(makeRandom(Date.now() % 2147483647));
  state.elapsed = 0;
  state.timeLeft = SHIFT.seconds;
  state.rush = false;
  state.rushAnnounced = false;
  state.chef.x = 640;
  state.chef.y = 420;
  state.chef.target = null;
  state.screen = 'play';
}

/** End the shift, saving the best score. */
export function endShift(state) {
  state.screen = 'end';
  if (state.kitchen.score > state.best) {
    state.best = state.kitchen.score;
    localStorage.setItem(BEST_KEY, String(state.best));
  }
}

/** One click on the kitchen: act on the station, walk the chef there. */
export function clickAt(state, x, y) {
  const { kitchen, sound } = state;
  if (state.screen === 'title') {
    sound.ensure();
    startShift(state);
    return;
  }
  if (state.screen === 'end') {
    startShift(state);
    return;
  }
  const station = stationAt(x, y);
  if (!station) {
    state.chef.target = { x, y: Math.min(y, 460) };
    return;
  }
  const target = stationTarget(station);
  if (target) state.chef.target = target;
  sound.ensure();
  if (station.kind === 'bin') {
    if (kitchen.pickUp(station.ingredient)) sound.pickup();
    else sound.error();
  } else if (station.kind === 'board') {
    if (kitchen.hands && kitchen.putOnBoard()) sound.chop();
    else if (kitchen.takeFromBoard()) sound.pickup();
    else sound.error();
  } else if (station.kind === 'burner') {
    const slot = station.slot;
    if (kitchen.hands && kitchen.putOnBurner(slot)) sound.sizzle();
    else if (kitchen.takeFromBurner(slot)) sound.pickup();
    else if (kitchen.burners[slot] && kitchen.burners[slot].state === 'burnt' && kitchen.discard(slot)) sound.error();
    else sound.error();
  } else if (station.kind === 'plate') {
    if (kitchen.addToPlate()) sound.ding();
    else sound.error();
  } else if (station.kind === 'bell') {
    const result = kitchen.serve(state.board);
    if (result.ok) sound.serve();
    else sound.error();
  } else if (station.kind === 'trash') {
    if (kitchen.discard()) sound.error();
  }
}

/** One key press, mirroring the mouse actions. */
export function keyPress(state, key) {
  const { kitchen, sound } = state;
  if (key === 'm') {
    sound.muted = !sound.muted;
    return;
  }
  if (key === 'enter') {
    if (state.screen !== 'play') startShift(state);
    return;
  }
  if (key === 'r' && state.screen === 'end') {
    startShift(state);
    return;
  }
  if (state.screen !== 'play') return;
  sound.ensure();
  const bin = INGREDIENTS.find((g) => g.key === key);
  if (bin) {
    if (kitchen.pickUp(bin.id)) sound.pickup();
    else sound.error();
    return;
  }
  if (key === 'c') {
    if (kitchen.hands && kitchen.putOnBoard()) sound.chop();
    else if (kitchen.takeFromBoard()) sound.pickup();
    else sound.error();
  } else if (key === 'v') {
    const slot = kitchen.burners[0] ? 1 : 0;
    if (kitchen.hands && kitchen.putOnBurner(slot)) sound.sizzle();
    else if (kitchen.takeFromBurner(0) || kitchen.takeFromBurner(1)) sound.pickup();
    else sound.error();
  } else if (key === 'b') {
    if (kitchen.addToPlate()) sound.ding();
    else sound.error();
  } else if (key === ' ') {
    const result = kitchen.serve(state.board);
    if (result.ok) sound.serve();
    else sound.error();
  } else if (key === 'x') {
    if (kitchen.discard()) sound.error();
  }
}

/** One fixed step of the shift. */
export function step(state, dt, keys) {
  state.time += dt;
  if (state.screen !== 'play') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT.seconds - state.elapsed);
  state.rush = state.timeLeft <= SHIFT.rushAt && state.timeLeft > 0;
  if (state.rush && !state.rushAnnounced) {
    state.rushAnnounced = true;
    state.kitchen.lastAction = 'Rush! Keep serving!';
    state.sound.rush();
  }
  state.board.tick(dt, state.rush, state.elapsed);
  state.kitchen.tick(dt);
  const dir = walkDirection(keys);
  const chef = state.chef;
  if (dir.x !== 0 || dir.y !== 0) {
    chef.target = null;
    chef.moving = true;
    chef.x = Math.max(40, Math.min(1240, chef.x + dir.x * CHEF.speed * dt));
    chef.y = Math.max(230, Math.min(460, chef.y + dir.y * CHEF.speed * dt));
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      chef.target = null;
      chef.moving = false;
    } else {
      chef.moving = true;
      chef.x += (dx / dist) * CHEF.speed * dt;
      chef.y += (dy / dist) * CHEF.speed * dt;
    }
  } else {
    chef.moving = false;
  }
  if (state.timeLeft <= 0) endShift(state);
}

/** Boot the game on the page's canvas. */
export function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scaleCanvas = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  scaleCanvas();
  window.addEventListener('resize', scaleCanvas);
  const state = createState();
  window.__simmer = state;
  const shot = shotFromUrl();
  if (shot) applyShot(state, shot);
  const input = wireInput(canvas, {
    click: (x, y) => clickAt(state, x, y),
    key: (key) => keyPress(state, key),
  });
  let last = performance.now();
  let accumulator = 0;
  const STEP = 1 / 60;
  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      step(state, STEP, input.keys);
      accumulator -= STEP;
    }
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return state;
}

boot();
