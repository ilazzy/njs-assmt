export default {
  testEnvironment: 'node',
  transform: {
    // '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  roots: ['<rootDir>', '<rootDir>/tests'], // Include root and tests directory
  testMatch: [
    '**/tests/**/*.test.js' // Look for test files within the tests directory
  ],
  moduleNameMapper: {
    '^../utils/math.js$': '<rootDir>/utils/math.js',
    '^../server.js$': '<rootDir>/server.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!node-fetch)',
  ],
};
