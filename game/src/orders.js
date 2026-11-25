// Simmer & Serve — the order board.
// Tickets arrive on a timer, wait with a patience bar that drains, and
// leave — paid, if served in time — or walk out, if they wait too long.
// The rush makes tickets arrive faster and wait less patiently.

import { DISHES, dishById } from './recipes.js';
import { TIMING } from './config.js';

/** A small deterministic random source, so a screenshot seed plays the same. */
export function makeRandom(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** One ticket on the board. */
export function makeOrder(id, dishId, patience) {
  return { id, dishId, patience, maxPatience: patience, bornAt: 0 };
}

/** The board: up to three tickets, a spawn clock, and a served/lost count. */
export class OrderBoard {
  constructor(random) {
    this.random = random;
    this.orders = [];
    this.nextId = 1;
    this.spawnIn = 1.2;
    this.served = 0;
    this.lost = 0;
  }

  /** How long a fresh ticket will wait, in seconds. */
  patienceFor(rush) {
    return rush ? TIMING.patienceRush : TIMING.patience;
  }

  /** Pick a dish, weighted so the cheap salad shows up less often late. */
  pickDish() {
    const index = Math.floor(this.random() * DISHES.length);
    return DISHES[index];
  }

  /** Advance the board: drain patience, drop expired tickets, spawn new ones. */
  tick(dt, rush, elapsed) {
    for (const order of this.orders) order.patience -= dt;
    const kept = [];
    for (const order of this.orders) {
      if (order.patience > 0) kept.push(order);
      else this.lost += 1;
    }
    this.orders = kept;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.orders.length < 3) {
      const dish = this.pickDish();
      const order = makeOrder(this.nextId++, dish.id, this.patienceFor(rush));
      order.bornAt = elapsed;
      this.orders.push(order);
      this.spawnIn = rush ? TIMING.orderGapRush : TIMING.orderGap;
    }
  }

  /** Remove a ticket by id when it is served; returns the dish or null. */
  serve(id) {
    const at = this.orders.findIndex((o) => o.id === id);
    if (at < 0) return null;
    const [order] = this.orders.splice(at, 1);
    this.served += 1;
    return dishById(order.dishId);
  }

  /** The ticket with the least patience left, for the rush highlight. */
  mostUrgent() {
    let best = null;
    for (const order of this.orders) {
      if (!best || order.patience < best.patience) best = order;
    }
    return best;
  }
}
