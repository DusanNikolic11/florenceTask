/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // minimatch v10 and uuid v10 ship as dual CJS/ESM packages.
  // Telling Jest to use the `require` condition ensures the CJS
  // build is loaded instead of the ESM build, which would fail
  // in a CommonJS test environment.
  testEnvironmentOptions: {
    customExportConditions: ['require', 'node', 'node-addons'],
  },
};
