import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

export interface IAuthContext {
    username: string;
    isAuthenticated: boolean;
    token: string;
    login(token: string): void;
    logout(): void;
    setUser(username: string, id: number): void;
}

const localStorageKey = 'token';
const localStorageUserKey = 'user';

const AuthContext = createContext<IAuthContext>({
    username: 'Tactition',
    isAuthenticated: !!localStorage.getItem(localStorageKey),
    token: localStorage.getItem(localStorageKey) ?? '',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    login(token: string): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    logout(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setUser(username: string, id: number): void {},
});

export function AuthProvider({ children }: PropsWithChildren) {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(localStorageKey));
    const [token, setToken] = useState(localStorage.getItem(localStorageKey) ?? '');
    const [username, setUsername] = useState(localStorage.getItem(localStorageUserKey) ?? 'Tactition');

    const login = (accessToken: string) => {
        setIsAuthenticated(true);
        setToken(accessToken);
        setUsername(username);
        localStorage.setItem(localStorageKey, accessToken);
    };
    const logout = () => {
        setIsAuthenticated(false);
        setToken('');
        setUsername('Tactition');
        localStorage.removeItem(localStorageKey);
        localStorage.removeItem(localStorageUserKey);
    };

    const setUser = (username: string, _id: number) => {
        setUsername(username);
        localStorage.setItem(localStorageUserKey, username);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, username, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
