// Simmer & Serve — the pantry and the menu.
// Every dish is built from the same six ingredients, each with its own prep
// path: some are chopped, some are cooked, some are both, one needs neither.
// A dish is finished when the plate holds exactly its parts, each in the
// state the recipe asks for. Nothing here names another game.

/** An ingredient's prep path: 'chop', 'cook', 'both' or 'none'. */
export const INGREDIENTS = [
  { id: 'tomato', name: 'Tomato', color: '#e74c3c', dark: '#b93226', shape: 'round', prep: 'chop', key: '1' },
  { id: 'noodle', name: 'Noodle', color: '#f2c94c', dark: '#c9a227', shape: 'wavy', prep: 'cook', key: '2' },
  { id: 'egg', name: 'Egg', color: '#fdf3d0', dark: '#d9c27a', shape: 'oval', prep: 'cook', key: '3' },
  { id: 'rice', name: 'Rice', color: '#e9d9a8', dark: '#b89b5e', shape: 'grain', prep: 'cook', key: '4' },
  { id: 'berry', name: 'Berry', color: '#8e44ad', dark: '#6b2d84', shape: 'round', prep: 'none', key: '5' },
  { id: 'flour', name: 'Flour', color: '#efe6d0', dark: '#cbb98f', shape: 'pile', prep: 'cook', key: '6' },
];

/** Look an ingredient up by id. */
export function ingredientById(id) {
  return INGREDIENTS.find((g) => g.id === id) || null;
}

/** The state an ingredient must reach before it can go on a plate. */
export function readyState(ingredient) {
  if (ingredient.prep === 'chop') return 'chopped';
  if (ingredient.prep === 'cook') return 'cooked';
  if (ingredient.prep === 'both') return 'cooked';
  return 'raw';
}

/** A dish: a name, a price, and the parts it needs on the plate. */
export const DISHES = [
  {
    id: 'noodle-bowl',
    name: 'Tomato Noodle Bowl',
    price: 12,
    parts: [
      { ingredient: 'noodle', state: 'cooked' },
      { ingredient: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'fried-rice',
    name: 'Golden Fried Rice',
    price: 14,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'egg', state: 'cooked' },
    ],
  },
  {
    id: 'pancake',
    name: 'Berry Pancake Stack',
    price: 13,
    parts: [
      { ingredient: 'flour', state: 'cooked' },
      { ingredient: 'berry', state: 'raw' },
    ],
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    price: 9,
    parts: [
      { ingredient: 'tomato', state: 'chopped' },
      { ingredient: 'berry', state: 'raw' },
    ],
  },
  {
    id: 'noodle-egg',
    name: 'Sunrise Noodles',
    price: 15,
    parts: [
      { ingredient: 'noodle', state: 'cooked' },
      { ingredient: 'egg', state: 'cooked' },
      { ingredient: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'rice-pudding',
    name: 'Berry Rice Pudding',
    price: 11,
    parts: [
      { ingredient: 'rice', state: 'cooked' },
      { ingredient: 'berry', state: 'raw' },
    ],
  },
];

/** Look a dish up by id. */
export function dishById(id) {
  return DISHES.find((d) => d.id === id) || null;
}

/** Does this plate hold exactly the dish's parts, no more and no less? */
export function plateMatchesDish(plate, dish) {
  if (plate.length !== dish.parts.length) return false;
  const wanted = dish.parts.map((p) => `${p.ingredient}:${p.state}`).sort().join('|');
  const got = plate.map((p) => `${p.ingredient}:${p.state}`).sort().join('|');
  return wanted === got;
}

/** The first open order this plate completes, or null. */
export function matchingOrder(plate, orders) {
  for (const order of orders) {
    const dish = dishById(order.dishId);
    if (dish && plateMatchesDish(plate, dish)) return order;
  }
  return null;
}

/** A short label for one plated part, for the ticket and the plate. */
export function partLabel(part) {
  const ingredient = ingredientById(part.ingredient);
  const name = ingredient ? ingredient.name : part.ingredient;
  if (part.state === 'raw') return name;
  if (part.state === 'chopped') return `${name} (chopped)`;
  if (part.state === 'cooked') return `${name} (cooked)`;
  return `${name} (${part.state})`;
}
