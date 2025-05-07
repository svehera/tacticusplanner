import React, { PropsWithChildren, useState } from 'react';

import { AuthContext } from './auth';
import { IUserInfo } from './user-info.model';

const localStorageKey = 'token';
const localStorageUserKey = 'user';

export function AuthProvider({ children }: PropsWithChildren) {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(localStorageKey));
    const [token, setToken] = useState(localStorage.getItem(localStorageKey) ?? '');
    const [username, setUsername] = useState(localStorage.getItem(localStorageUserKey) ?? 'Tactician');
    const [shareToken, setShareToken] = useState<string | undefined>('');
    const [userInfo, setUserInfo] = useState<IUserInfo>({ tacticusApiKey: 'key' } as any);

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
        localStorage.setItem(localStorageUserKey + 'Old', localStorage.getItem(localStorageUserKey) ?? '');
        localStorage.removeItem(localStorageKey);
        localStorage.removeItem(localStorageUserKey);
    };

    const setUser = (username: string, shareToken?: string) => {
        setUsername(username);
        setShareToken(shareToken);
        localStorage.setItem(localStorageUserKey, username);
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, token, userInfo, username, shareToken, setUser, setUserInfo, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
