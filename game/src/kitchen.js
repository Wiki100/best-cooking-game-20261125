// Simmer & Serve — the kitchen itself.
// The chef holds one thing at a time. A thing on the chopping board is
// chopped over time; a thing on a burner is cooked over time and then burns
// if it is left there. The plate collects finished parts, and the bell
// serves the plate to the first order it completes. Every action answers
// at once with a sound and a floating note, so the game feels fast.

import { INGREDIENTS, ingredientById, readyState, matchingOrder, dishById } from './recipes.js';
import { TIMING, PAY } from './config.js';

/** A held or placed item: which ingredient, and what state it is in. */
export function makeItem(ingredientId, state = 'raw') {
  return { ingredient: ingredientId, state };
}

/** A floating "+$12" note above the kitchen. */
export function makePopup(x, y, text, color) {
  return { x, y, text, color, life: 1.2 };
}

/** A puff of steam over a burner, or crumbs over the board. */
export function makePuff(x, y, color) {
  return { x, y, color, life: 0.7, vy: -34 };
}

/** The whole kitchen state for one shift. */
export class Kitchen {
  constructor() {
    this.hands = null;
    this.board = null;
    this.boardProgress = 0;
    this.burners = [null, null];
    this.burnerProgress = [0, 0];
    this.burnerOver = [0, 0];
    this.plate = [];
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.servedCount = 0;
    this.mistakes = 0;
    this.popups = [];
    this.puffs = [];
    this.lastAction = '';
  }

  /** Pick an ingredient up from its bin. Hands must be empty. */
  pickUp(ingredientId) {
    if (this.hands) return false;
    const ingredient = ingredientById(ingredientId);
    if (!ingredient) return false;
    this.hands = makeItem(ingredientId, 'raw');
    this.lastAction = `Picked up ${ingredient.name}`;
    return true;
  }

  /** Put the held item on the chopping board, if it needs chopping. */
  putOnBoard() {
    if (!this.hands || this.board) return false;
    const ingredient = ingredientById(this.hands.ingredient);
    if (!ingredient || (ingredient.prep !== 'chop' && ingredient.prep !== 'both')) return false;
    this.board = this.hands;
    this.hands = null;
    this.boardProgress = 0;
    this.lastAction = `Chopping ${ingredient.name}`;
    return true;
  }

  /** Put the held item on a free burner, if it needs cooking. */
  putOnBurner(slot) {
    if (!this.hands) return false;
    if (this.burners[slot]) return false;
    const ingredient = ingredientById(this.hands.ingredient);
    if (!ingredient || (ingredient.prep !== 'cook' && ingredient.prep !== 'both')) return false;
    this.burners[slot] = this.hands;
    this.hands = null;
    this.burnerProgress[slot] = 0;
    this.burnerOver[slot] = 0;
    this.lastAction = `Cooking ${ingredient.name}`;
    return true;
  }

  /** Take a finished item off the board or a burner into the chef's hands. */
  takeFromBoard() {
    if (!this.board || this.boardProgress < TIMING.chop || this.hands) return false;
    this.hands = this.board;
    this.board = null;
    this.boardProgress = 0;
    return true;
  }

  takeFromBurner(slot) {
    const item = this.burners[slot];
    if (!item || this.burnerProgress[slot] < TIMING.cook || this.hands) return false;
    if (item.state === 'burnt') return false;
    this.hands = item;
    this.burners[slot] = null;
    this.burnerProgress[slot] = 0;
    this.burnerOver[slot] = 0;
    return true;
  }

  /** Add the held item to the plate, if it is finished and the plate has room. */
  addToPlate() {
    if (!this.hands || this.plate.length >= 3) return false;
    const ingredient = ingredientById(this.hands.ingredient);
    if (!ingredient) return false;
    if (this.hands.state !== readyState(ingredient)) return false;
    this.plate.push(this.hands);
    this.hands = null;
    this.lastAction = 'Added to the plate';
    return true;
  }

  /** Throw away what the chef holds, or clear a burnt burner. */
  discard(slot = null) {
    if (slot !== null) {
      if (!this.burners[slot]) return false;
      this.burners[slot] = null;
      this.burnerProgress[slot] = 0;
      this.burnerOver[slot] = 0;
      this.mistakes += 1;
      this.combo = 0;
      return true;
    }
    if (this.hands) {
      this.hands = null;
      return true;
    }
    if (this.board) {
      this.board = null;
      this.boardProgress = 0;
      return true;
    }
    return false;
  }

  /** Ring the bell: serve the plate to the first order it completes. */
  serve(board) {
    if (this.plate.length === 0) return { ok: false, why: 'empty' };
    const order = matchingOrder(this.plate, board.orders);
    if (!order) {
      this.mistakes += 1;
      this.combo = 0;
      this.score = Math.max(0, this.score + PAY.wrongServe);
      this.popups.push(makePopup(1195, 260, 'No order wants this!', '#c0392b'));
      return { ok: false, why: 'no-match' };
    }
    const dish = dishById(order.dishId);
    board.serve(order.id);
    const tip = order.patience > order.maxPatience * 0.5 ? PAY.tipFull : PAY.tipHalf;
    const comboBonus = 1 + Math.min(this.combo * PAY.comboStep, PAY.comboCap);
    const earned = Math.round((dish.price + tip) * comboBonus);
    this.coins += earned;
    this.score += earned;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.servedCount += 1;
    this.popups.push(makePopup(1195, 260, `+$${earned} ${dish.name}`, '#3e8e4d'));
    this.plate = [];
    this.lastAction = `Served ${dish.name} for $${earned}`;
    return { ok: true, dish, earned };
  }

  /** Advance chopping, cooking and burning, and fade the popups. */
  tick(dt) {
    if (this.board) {
      this.boardProgress += dt;
      if (this.boardProgress >= TIMING.chop && this.board.state === 'raw') {
        this.board.state = 'chopped';
        this.puffs.push(makePuff(725, 520, '#e9c893'));
      }
    }
    for (let i = 0; i < 2; i++) {
      const item = this.burners[i];
      if (!item) continue;
      if (this.burnerProgress[i] < TIMING.cook) {
        this.burnerProgress[i] += dt;
        if (this.burnerProgress[i] >= TIMING.cook && item.state === 'raw') {
          item.state = 'cooked';
          this.puffs.push(makePuff(900 + i * 90, 520, '#ffffff'));
        }
      } else if (item.state === 'cooked') {
        this.burnerOver[i] += dt;
        if (this.burnerOver[i] >= TIMING.burnAfter) {
          item.state = 'burnt';
          this.popups.push(makePopup(900 + i * 90, 500, 'Burnt!', '#c0392b'));
        }
      }
    }
    for (const popup of this.popups) popup.life -= dt;
    this.popups = this.popups.filter((p) => p.life > 0);
    for (const puff of this.puffs) {
      puff.life -= dt;
      puff.y += puff.vy * dt;
    }
    this.puffs = this.puffs.filter((p) => p.life > 0);
  }
}

/** The six bin buttons, in the order their number keys pick them. */
export function binButtons() {
  return INGREDIENTS.map((g, i) => ({ ingredient: g, index: i }));
}
