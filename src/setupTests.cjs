// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Suprimir avisos do React Router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  warn: jest.fn(),
}));

// Suprimir avisos de console durante os testes
const originalConsoleWarn = console.warn;
console.warn = function (msg) {
  if (msg.includes('React Router')) return;
  originalConsoleWarn(msg);
};