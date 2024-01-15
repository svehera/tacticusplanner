import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

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
const localStorageUserKey = 'user';

const AuthContext = createContext<IAuthContext>({
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

export function AuthProvider({ children }: PropsWithChildren) {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(localStorageKey));
    const [token, setToken] = useState(localStorage.getItem(localStorageKey) ?? '');
    const [username, setUsername] = useState(localStorage.getItem(localStorageUserKey) ?? 'Tactician');
    const [shareToken, setShareToken] = useState<string | undefined>('');

    const login = (accessToken: string) => {
        setIsAuthenticated(true);
        setToken(accessToken);
        setUsername(username);
        localStorage.setItem(localStorageKey, accessToken);
    };
    const logout = () => {
        setIsAuthenticated(false);
        setToken('');
        setUsername('Tactician');
        localStorage.removeItem(localStorageKey);
        localStorage.removeItem(localStorageUserKey);
    };

    const setUser = (username: string, shareToken?: string) => {
        setUsername(username);
        setShareToken(shareToken);
        localStorage.setItem(localStorageUserKey, username);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, username, shareToken, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
