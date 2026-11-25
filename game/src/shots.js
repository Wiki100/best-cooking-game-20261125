// Simmer & Serve — screenshot setups.
// ?shot=start shows the title, ?shot=play a kitchen mid-shift with a dish
// half-built, ?shot=rush the last seconds with three urgent tickets, and
// ?shot=end the shift totals. Each one sets the same state every time, so
// the screenshots the maker takes are reproducible. The game itself never
// reads these except through the query string.

import { makeOrder } from './orders.js';
import { makeItem } from './kitchen.js';

/** Read ?shot= from the page's URL, or null. */
export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

/** Put the game into a named screenshot state. Returns true when it applied. */
export function applyShot(state, name) {
  const { kitchen, board } = state;
  if (name === 'start') {
    state.screen = 'title';
    return true;
  }
  if (name === 'play') {
    state.screen = 'play';
    state.timeLeft = 78;
    state.elapsed = 42;
    state.rush = false;
    board.orders = [
      makeOrder(1, 'noodle-bowl', 22),
      makeOrder(2, 'fried-rice', 15),
    ];
    board.orders[0].maxPatience = 34;
    board.orders[1].maxPatience = 34;
    board.nextId = 3;
    kitchen.plate = [makeItem('noodle', 'cooked'), makeItem('tomato', 'chopped')];
    kitchen.burners[0] = makeItem('egg', 'raw');
    kitchen.burnerProgress[0] = 1.8;
    kitchen.hands = makeItem('tomato', 'raw');
    kitchen.coins = 36;
    kitchen.score = 36;
    kitchen.combo = 2;
    kitchen.servedCount = 3;
    kitchen.lastAction = 'Added to the plate';
    state.chef.x = 760;
    state.chef.y = 440;
    return true;
  }
  if (name === 'rush') {
    state.screen = 'play';
    state.timeLeft = 24;
    state.elapsed = 96;
    state.rush = true;
    board.orders = [
      makeOrder(4, 'noodle-egg', 7),
      makeOrder(5, 'pancake', 11),
      makeOrder(6, 'fried-rice', 5),
    ];
    for (const order of board.orders) order.maxPatience = 26;
    board.nextId = 7;
    kitchen.plate = [makeItem('rice', 'cooked')];
    kitchen.burners[0] = makeItem('egg', 'cooked');
    kitchen.burnerProgress[0] = 3.2;
    kitchen.burnerOver[0] = 1.2;
    kitchen.burners[1] = makeItem('noodle', 'raw');
    kitchen.burnerProgress[1] = 2.4;
    kitchen.board = makeItem('tomato', 'raw');
    kitchen.boardProgress = 0.9;
    kitchen.coins = 118;
    kitchen.score = 118;
    kitchen.combo = 4;
    kitchen.servedCount = 9;
    kitchen.lastAction = 'Rush! Keep serving!';
    state.chef.x = 950;
    state.chef.y = 440;
    return true;
  }
  if (name === 'end') {
    state.screen = 'end';
    state.timeLeft = 0;
    kitchen.coins = 142;
    kitchen.score = 142;
    kitchen.combo = 0;
    kitchen.bestCombo = 5;
    kitchen.servedCount = 11;
    kitchen.mistakes = 2;
    board.orders = [];
    return true;
  }
  return false;
}

/** The four screenshots the entry hands in, in cover order. */
export const SHOTS = [
  { name: '1-start.jpg', query: '?shot=start&seed=1' },
  { name: '2-play.jpg', query: '?shot=play&seed=1' },
  { name: '3-rush.jpg', query: '?shot=rush&seed=1' },
  { name: '4-end.jpg', query: '?shot=end&seed=1' },
];
