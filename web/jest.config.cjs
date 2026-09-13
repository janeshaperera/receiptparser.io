const tsJestPath = require.resolve("ts-jest");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": [
      tsJestPath,
      {
        tsconfig: {
          jsx: "react-jsx"
        }
      }
    ]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react$": "<rootDir>/tests/__mocks__/lucide-react.tsx"
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  verbose: true
};
