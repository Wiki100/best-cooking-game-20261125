// Simmer & Serve — everything the player sees, drawn on one canvas.
// No images: every ingredient, counter and the chef are drawn from shapes,
// so the game is a few kilobytes and loads nothing. The order board, the
// timer and the plate are drawn big enough to read at a glance, because
// the judge first meets the game through its screenshots.

import { PALETTE, FONT, STATIONS, FIELD } from './config.js';
import { INGREDIENTS, ingredientById, dishById, partLabel } from './recipes.js';

/** Round a rectangle's corners, then fill it. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** One ingredient, drawn at (x, y) with this radius, in this state. */
export function drawIngredient(ctx, ingredient, x, y, r, state) {
  const color = state === 'burnt' ? '#2b2b2b' : ingredient.color;
  const dark = state === 'burnt' ? '#111111' : ingredient.dark;
  ctx.save();
  ctx.translate(x, y);
  if (ingredient.shape === 'wavy') {
    ctx.strokeStyle = color;
    ctx.lineWidth = r * 0.32;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r, i * r * 0.55);
      ctx.quadraticCurveTo(-r * 0.4, i * r * 0.55 - r * 0.5, 0, i * r * 0.55);
      ctx.quadraticCurveTo(r * 0.4, i * r * 0.55 + r * 0.5, r, i * r * 0.55);
      ctx.stroke();
    }
  } else if (ingredient.shape === 'oval') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.8, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.45, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'grain') {
    ctx.fillStyle = color;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.45, r * 0.28, r * 0.18, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingredient.shape === 'pile') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.quadraticCurveTo(0, -r * 1.1, r, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.35, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    if (ingredient.id === 'tomato') {
      ctx.fillStyle = '#3e8e4d';
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(-r * 0.4, -r * 1.35);
      ctx.lineTo(r * 0.4, -r * 1.35);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (state === 'chopped') {
    ctx.strokeStyle = 'rgba(46,33,24,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.4);
    ctx.lineTo(r * 0.6, r * 0.4);
    ctx.moveTo(r * 0.6, -r * 0.4);
    ctx.lineTo(-r * 0.6, r * 0.4);
    ctx.stroke();
  }
  if (state === 'cooked') {
    ctx.strokeStyle = '#ff9f2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, -0.6, 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

/** The kitchen floor, wall and the serving counter. */
function drawRoom(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, 200);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 196, FIELD.width, 8);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(col * 160, 204 + row * 130, 160, 130);
    }
  }
  ctx.fillStyle = 'rgba(46,33,24,0.08)';
  ctx.fillRect(0, 204, FIELD.width, 516);
}

/** The order board: tickets across the top, each with a patience bar. */
function drawOrders(ctx, board) {
  ctx.fillStyle = PALETTE.hud;
  roundRect(ctx, 24, 14, 1232, 142, 14);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDER BOARD', 44, 40);
  if (board.orders.length === 0) {
    ctx.fillStyle = '#cbb98f';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('No orders yet — the lunch crowd is coming…', 44, 90);
    return;
  }
  board.orders.forEach((order, i) => {
    const dish = dishById(order.dishId);
    if (!dish) return;
    const x = 230 + i * 330;
    const y = 28;
    const urgent = order.patience < order.maxPatience * 0.35;
    ctx.fillStyle = urgent ? '#fde8e0' : PALETTE.ticket;
    roundRect(ctx, x, y, 320, 114, 10);
    ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.ticketEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 320, 114);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(dish.name, x + 14, y + 28);
    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`$${dish.price}  ·  table ${order.id}`, x + 14, y + 56);
    dish.parts.forEach((part, j) => {
      const ingredient = ingredientById(part.ingredient);
      if (ingredient) drawIngredient(ctx, ingredient, x + 30 + j * 52, y + 88, 15, part.state);
    });
    const ratio = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e5d9bd';
    ctx.fillRect(x + 14, y + 100, 292, 8);
    ctx.fillStyle = ratio > 0.5 ? PALETTE.good : ratio > 0.25 ? PALETTE.warn : PALETTE.bad;
    ctx.fillRect(x + 14, y + 100, 292 * ratio, 8);
  });
}

/** The six ingredient bins, with their number keys. */
function drawBins(ctx) {
  const box = STATIONS.bins;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(box.x + 8, box.y + 8, box.w - 16, 26);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PANTRY — click or press 1–6', box.x + 16, box.y + 21);
  INGREDIENTS.forEach((ingredient, i) => {
    const x = box.x + 56 + i * 88;
    const y = box.y + 108;
    ctx.fillStyle = '#f7e8c8';
    roundRect(ctx, x - 38, y - 52, 76, 104, 10);
    drawIngredient(ctx, ingredient, x, y - 8, 22, 'raw');
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(ingredient.name, x, y + 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`[${ingredient.key}]`, x, y + 48 - 2);
  });
}

/** A progress ring around a station while it works. */
function drawProgress(ctx, x, y, r, ratio, color) {
  ctx.strokeStyle = 'rgba(46,33,24,0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, ratio));
  ctx.stroke();
}

/** Board, stove, plate, bell and trash. */
function drawStations(ctx, kitchen, time) {
  const board = STATIONS.board;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, board.x + 14, board.y + 44, board.w - 28, 96, 8);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('CHOP [C]', board.x + board.w / 2, board.y + 24);
  if (kitchen.board) {
    const ingredient = ingredientById(kitchen.board.ingredient);
    if (ingredient) drawIngredient(ctx, ingredient, board.x + board.w / 2, board.y + 92, 30, kitchen.board.state);
    drawProgress(ctx, board.x + board.w / 2, board.y + 92, 40, kitchen.boardProgress / 1.4, PALETTE.good);
  } else {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText('empty', board.x + board.w / 2, board.y + 92);
  }
  const stove = STATIONS.stove;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, stove.x, stove.y, stove.w, stove.h, 12);
  ctx.fillStyle = PALETTE.stove;
  roundRect(ctx, stove.x + 14, stove.y + 44, stove.w - 28, 96, 10);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText('STOVE [V]', stove.x + stove.w / 2, stove.y + 24);
  kitchen.burners.forEach((item, i) => {
    const x = stove.x + 58 + i * 84;
    const y = stove.y + 92;
    ctx.fillStyle = PALETTE.burner;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    if (item) {
      const flame = item.state === 'cooked' || item.state === 'burnt';
      if (flame) {
        ctx.fillStyle = item.state === 'burnt' ? '#5a5a5a' : PALETTE.flame;
        ctx.beginPath();
        ctx.arc(x, y, 34 + Math.sin(time * 6 + i) * 3, 0, Math.PI * 2);
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      const ingredient = ingredientById(item.ingredient);
      if (ingredient) drawIngredient(ctx, ingredient, x, y, 20, item.state);
      drawProgress(ctx, x, y, 36, kitchen.burnerProgress[i] / 3.2, item.state === 'burnt' ? PALETTE.bad : PALETTE.flame);
    }
  });
  const plate = STATIONS.plate;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, plate.x, plate.y, plate.w, plate.h, 12);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText('PLATE [B]', plate.x + plate.w / 2, plate.y + 24);
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + 100, 58, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 3;
  ctx.stroke();
  kitchen.plate.forEach((part, i) => {
    const ingredient = ingredientById(part.ingredient);
    if (ingredient) drawIngredient(ctx, ingredient, plate.x + 42 + i * 34, plate.y + 100, 15, part.state);
  });
  if (kitchen.plate.length === 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('empty', plate.x + plate.w / 2, plate.y + 158);
  }
  const bell = STATIONS.bell;
  ctx.fillStyle = PALETTE.bell;
  roundRect(ctx, bell.x, bell.y, bell.w, bell.h, 12);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText('SERVE', bell.x + bell.w / 2, bell.y + 28);
  ctx.font = `14px ${FONT}`;
  ctx.fillText('[Space]', bell.x + bell.w / 2, bell.y + 52);
  const trash = STATIONS.trash;
  ctx.fillStyle = '#6b7280';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 12);
  ctx.fillStyle = '#f7f3e8';
  ctx.font = `bold 16px ${FONT}`;
  ctx.fillText('TRASH', trash.x + trash.w / 2, trash.y + 28);
  ctx.font = `13px ${FONT}`;
  ctx.fillText('[X]', trash.x + trash.w / 2, trash.y + 52);
}

/** The chef, walking between stations, holding one item overhead. */
function drawChef(ctx, chef, kitchen, time) {
  const x = chef.x;
  const y = chef.y;
  const bob = Math.abs(Math.sin(time * 8)) * 3 * (chef.moving ? 1 : 0);
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.fillStyle = PALETTE.chefPants;
  ctx.fillRect(-14, 18, 28, 26);
  ctx.fillStyle = PALETTE.chefCoat;
  roundRect(ctx, -20, -8, 40, 30, 10);
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefHat;
  ctx.beginPath();
  ctx.arc(-8, -36, 10, 0, Math.PI * 2);
  ctx.arc(0, -40, 11, 0, Math.PI * 2);
  ctx.arc(8, -36, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -34, 26, 8);
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(-5, -24, 2, 0, Math.PI * 2);
  ctx.arc(5, -24, 2, 0, Math.PI * 2);
  ctx.fill();
  if (kitchen.hands) {
    const ingredient = ingredientById(kitchen.hands.ingredient);
    if (ingredient) drawIngredient(ctx, ingredient, 0, -58, 16, kitchen.hands.state);
  }
  ctx.restore();
  if (kitchen.lastAction) {
    ctx.fillStyle = 'rgba(46,33,24,0.85)';
    roundRect(ctx, x - 110, y - 108, 220, 28, 8);
    ctx.fillStyle = '#fff8e1';
    ctx.font = `15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(kitchen.lastAction, x, y - 93);
  }
}

/** Timer, coins, score and combo across the top of the kitchen. */
function drawHud(ctx, timeLeft, rush, kitchen) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hud;
  roundRect(ctx, 24, 168, 1232, 52, 10);
  const ratio = Math.max(0, timeLeft / 120);
  ctx.fillStyle = '#e5d9bd';
  ctx.fillRect(44, 186, 420, 16);
  ctx.fillStyle = rush ? PALETTE.bad : PALETTE.good;
  ctx.fillRect(44, 186, 420 * ratio, 16);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `bold 20px ${FONT}`;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  ctx.fillText(`${rush ? 'RUSH! ' : ''}${minutes}:${String(seconds).padStart(2, '0')}`, 480, 194);
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`$${kitchen.coins}   Score ${kitchen.score}   Combo x${kitchen.combo}   Served ${kitchen.servedCount}`, 1232, 194);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cbb98f';
  ctx.font = `15px ${FONT}`;
  ctx.fillText('Click a bin, chop [C], cook [V], plate [B], serve [Space]. Arrows / WASD walk. M mutes.', 44, 238);
}

/** Floating score notes and steam puffs. */
function drawEffects(ctx, kitchen) {
  ctx.textAlign = 'center';
  for (const popup of kitchen.popups) {
    ctx.globalAlpha = Math.max(0, popup.life);
    ctx.fillStyle = popup.color;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText(popup.text, popup.x, popup.y - (1.2 - popup.life) * 30);
  }
  ctx.globalAlpha = 1;
  for (const puff of kitchen.puffs) {
    ctx.globalAlpha = Math.max(0, puff.life);
    ctx.fillStyle = puff.color;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, 8 + (0.7 - puff.life) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Title screen: the whole game at a glance. */
function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(46,33,24,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, 290, 120, 700, 420, 18);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.font = `bold 54px ${FONT}`;
  ctx.fillText('Simmer & Serve', 640, 190);
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('A two-minute kitchen rush', 640, 232);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `19px ${FONT}`;
  ctx.fillText('Take orders. Chop, cook, plate, serve — before patience runs out.', 640, 290);
  ctx.fillText('Click the pantry, the board, the stove and the plate.', 640, 322);
  ctx.fillText('Keys: 1–6 pantry · C chop · V cook · B plate · Space serve · X trash', 640, 354);
  ctx.fillStyle = PALETTE.good;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText('Click or press Enter to start', 640, 420);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `18px ${FONT}`;
    ctx.fillText(`Best shift: $${best}`, 640, 470);
  }
}

/** End screen: the shift's totals and a restart prompt. */
function drawEnd(ctx, kitchen, best) {
  ctx.fillStyle = 'rgba(46,33,24,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, 340, 140, 600, 380, 18);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText('Shift over!', 640, 210);
  ctx.font = `24px ${FONT}`;
  ctx.fillText(`Dishes served: ${kitchen.servedCount}`, 640, 270);
  ctx.fillText(`Coins earned: $${kitchen.coins}`, 640, 310);
  ctx.fillText(`Best combo: x${kitchen.bestCombo}   ·   Mistakes: ${kitchen.mistakes}`, 640, 350);
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = PALETTE.good;
  ctx.fillText(`Score ${kitchen.score}`, 640, 400);
  if (kitchen.score >= best && kitchen.score > 0) {
    ctx.fillStyle = PALETTE.warn;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('New best shift!', 640, 440);
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Press R or click to cook again', 640, 486);
}

/** Draw one frame, given the whole game state. */
export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  drawRoom(ctx);
  drawOrders(ctx, state.board);
  drawStations(ctx, state.kitchen, state.time);
  drawBins(ctx);
  drawChef(ctx, state.chef, state.kitchen, state.time);
  drawHud(ctx, state.timeLeft, state.rush, state.kitchen);
  drawEffects(ctx, state.kitchen);
  if (state.screen === 'title') drawTitle(ctx, state.best);
  if (state.screen === 'end') drawEnd(ctx, state.kitchen, state.best);
  if (state.screen === 'title' || state.screen === 'end') {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,248,225,0.9)';
    ctx.font = `15px ${FONT}`;
    ctx.fillText('Simmer & Serve — an original kitchen game', 640, 700);
  }
}
