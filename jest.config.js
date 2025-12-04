module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  collectCoverageFrom: [
    "server/**/*.js",
    "!server/index.js",
    "!server/db/prisma.js",
  ],
};