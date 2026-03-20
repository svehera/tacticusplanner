import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Create a dummy storage object
const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

// 2. Attach it to BOTH the global (Node) and window (JSDOM) scopes
global.localStorage = localStorageMock as any;
if (typeof window !== 'undefined') {
    window.localStorage = localStorageMock as any;
}
