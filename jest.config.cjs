const config = {
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js)"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "node",
  clearMocks: true,
};

module.exports = config;
