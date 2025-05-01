import { createContext, useContext } from 'react';

import { UserRole } from 'src/models/enums';
import { IUserInfo } from 'src/models/interfaces';

export interface IAuthContext {
    username: string;
    shareToken?: string;
    isAuthenticated: boolean;
    token: string;
    userInfo: IUserInfo;

    login(token: string): void;

    logout(): void;

    setUserInfo(userInfo: IUserInfo): void;

    setUser(username: string, shareToken?: string): void;
}

const localStorageKey = 'token';

export const AuthContext = createContext<IAuthContext>({
    username: 'Tactician',
    isAuthenticated: !!localStorage.getItem(localStorageKey),
    token: localStorage.getItem(localStorageKey) ?? '',
    userInfo: {} as any,

    login(): void {},

    logout(): void {},

    setUser(): void {},

    setUserInfo(): void {},
});

export function useAuth() {
    return useContext(AuthContext);
}
