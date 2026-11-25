// Simmer & Serve — keyboard and mouse.
// The mouse is the main way to play: click a station and the chef walks
// there while the action happens at once. The keyboard mirrors every
// action, and the arrow keys / WASD walk the chef by hand.

import { STATIONS } from './config.js';
import { INGREDIENTS } from './recipes.js';

/** Is this point inside this rectangle? */
export function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Which station, if any, sits under this logical point? */
export function stationAt(x, y) {
  if (inside(x, y, STATIONS.bell)) return { kind: 'bell' };
  if (inside(x, y, STATIONS.trash)) return { kind: 'trash' };
  if (inside(x, y, STATIONS.board)) return { kind: 'board' };
  if (inside(x, y, STATIONS.stove)) {
    const slot = x < STATIONS.stove.x + STATIONS.stove.w / 2 ? 0 : 1;
    return { kind: 'burner', slot };
  }
  if (inside(x, y, STATIONS.plate)) return { kind: 'plate' };
  const bins = STATIONS.bins;
  if (inside(x, y, bins)) {
    const index = Math.floor((x - bins.x - 18) / 88);
    if (index >= 0 && index < INGREDIENTS.length) {
      return { kind: 'bin', ingredient: INGREDIENTS[index].id };
    }
  }
  return null;
}

/** A station's walk target, so the chef strolls over while the action runs. */
export function stationTarget(station) {
  if (!station) return null;
  if (station.kind === 'bin') {
    const index = INGREDIENTS.findIndex((g) => g.id === station.ingredient);
    return { x: STATIONS.bins.x + 56 + index * 88, y: STATIONS.bins.y - 30 };
  }
  if (station.kind === 'board') return { x: STATIONS.board.x + 85, y: STATIONS.board.y - 30 };
  if (station.kind === 'burner') return { x: STATIONS.stove.x + 58 + station.slot * 84, y: STATIONS.stove.y - 30 };
  if (station.kind === 'plate') return { x: STATIONS.plate.x + 75, y: STATIONS.plate.y - 30 };
  if (station.kind === 'bell') return { x: STATIONS.bell.x + 45, y: STATIONS.bell.y + 90 };
  if (station.kind === 'trash') return { x: STATIONS.trash.x + 40, y: STATIONS.trash.y + 90 };
  return null;
}

/** Wire a canvas and the keyboard to the game's action callbacks. */
export function wireInput(canvas, actions) {
  const toLogical = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  };

  canvas.addEventListener('click', (event) => {
    const point = toLogical(event);
    actions.click(point.x, point.y);
  });

  const keys = new Set();
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    keys.add(key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    actions.key(key, true);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  return { keys };
}

/** The keys that walk the chef, as a direction vector. */
export function walkDirection(keys) {
  let x = 0;
  let y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  if (x !== 0 && y !== 0) {
    const length = Math.hypot(x, y);
    x /= length;
    y /= length;
  }
  return { x, y };
}
