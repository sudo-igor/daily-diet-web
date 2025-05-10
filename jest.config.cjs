/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        useESM: false,
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.cjs'],
  testMatch: ['**/__tests__/**/*.spec.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'jest-junit.xml',
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Daily Diet Web - Testes Jest',
        outputPath: 'reports/jest-html/test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
        sort: 'status',
        dateFormat: 'dd/mm/yyyy HH:MM:ss',
        theme: 'lightTheme',
      },
    ],
    [
      'jest-stare',
      {
        resultDir: 'reports/jest-stare',
        reportTitle: 'Daily Diet Web - Relatório Detalhado',
        reportHeadline: 'Relatório de Testes Jest',
        coverageLink: '../coverage/lcov-report/index.html',
      },
    ],
  ],
  transformIgnorePatterns: ['/node_modules/(?!(@testing-library)/)'],
};