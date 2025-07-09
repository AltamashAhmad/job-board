module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/setup.js'
  ]
}; 