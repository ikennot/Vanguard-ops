export const Utils = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  },
  intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
};
