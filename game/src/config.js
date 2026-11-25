// Simmer & Serve — every tuning number and colour in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** A shift lasts two minutes; the last thirty seconds are the rush. */
export const SHIFT = { seconds: 120, rushAt: 30 };

/** How long each kitchen job takes, in seconds. */
export const TIMING = {
  chop: 1.4,
  cook: 3.2,
  burnAfter: 3.0,
  orderGap: 4.5,
  orderGapRush: 2.8,
  patience: 34,
  patienceRush: 26,
};

/** Points and money: a dish pays its price, a fast serve adds a tip. */
export const PAY = {
  tipFull: 6,
  tipHalf: 3,
  comboStep: 0.1,
  comboCap: 0.5,
  wrongServe: -2,
};

/** The chef walks at this speed in logical pixels per second. */
export const CHEF = { speed: 420, radius: 26 };

/** Warm kitchen palette: cream tiles, terracotta counters, brass trim. */
export const PALETTE = {
  wall: '#f7e8c8',
  wallTrim: '#e8c98f',
  floorA: '#d9a066',
  floorB: '#c98f52',
  counter: '#b4552d',
  counterTop: '#d97b4a',
  counterEdge: '#8a3d1e',
  board: '#e9c893',
  stove: '#3a3f4a',
  burner: '#22252c',
  flame: '#ff9f2e',
  plate: '#fdfdf6',
  plateRim: '#7fb3d5',
  bell: '#f2c94c',
  ticket: '#fff8e1',
  ticketEdge: '#d9b96a',
  ink: '#2e2118',
  muted: '#7a6a58',
  good: '#3e8e4d',
  warn: '#d9821e',
  bad: '#c0392b',
  chefHat: '#fdfdf6',
  chefCoat: '#f2f2ee',
  chefSkin: '#e8b88a',
  chefPants: '#3a3f4a',
  hud: '#2e2118',
  hudText: '#fff8e1',
};

/** System font stack only — the game loads no font files. */
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Best shift score, kept in this browser only. */
export const BEST_KEY = 'simmer-and-serve.best';

/** Layout of the stations, in logical pixels. Stations are clicked, not walked to. */
export const STATIONS = {
  bins: { x: 40, y: 470, w: 560, h: 190 },
  board: { x: 640, y: 470, w: 170, h: 190 },
  stove: { x: 850, y: 470, w: 200, h: 190 },
  plate: { x: 1090, y: 470, w: 150, h: 190 },
  bell: { x: 1150, y: 280, w: 90, h: 70 },
  trash: { x: 40, y: 280, w: 80, h: 70 },
};
