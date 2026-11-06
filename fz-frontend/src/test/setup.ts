import '@testing-library/jest-dom/vitest';

if (!import.meta.env.VITE_USE_MOCK) {
  import.meta.env.VITE_USE_MOCK = 'true';
}
