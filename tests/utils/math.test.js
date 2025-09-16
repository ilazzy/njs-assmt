import { add } from '../utils/math.js';

describe('Math Utilities', () => {
  test('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
