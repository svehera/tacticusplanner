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

globalThis.localStorage = localStorageMock as any;
