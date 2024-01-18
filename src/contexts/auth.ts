import { createContext, useContext } from 'react';

export interface IAuthContext {
    username: string;
    shareToken?: string;
    isAuthenticated: boolean;
    token: string;

    login(token: string): void;

    logout(): void;

    setUser(username: string, shareToken?: string): void;
}

const localStorageKey = 'token';

export const AuthContext = createContext<IAuthContext>({
    username: 'Tactician',
    isAuthenticated: !!localStorage.getItem(localStorageKey),
    token: localStorage.getItem(localStorageKey) ?? '',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    login(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    logout(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setUser(): void {},
});

export function useAuth() {
    return useContext(AuthContext);
}
