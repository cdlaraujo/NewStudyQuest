/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js', '!src/main.js'],
};
