const tsJestPath = require.resolve("ts-jest");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
  transform: {
    "^.+\\.tsx?$": [
      tsJestPath,
      {
        useESM: true,
        isolatedModules: true
      }
    ]
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  testMatch: ["**/tests/**/*.test.ts"],
  verbose: true,
  clearMocks: true,
  testTimeout: 15000
};
