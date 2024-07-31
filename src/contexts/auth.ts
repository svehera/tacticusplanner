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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    login(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    logout(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setUser(): void {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setUserInfo(): void {},
});

export function useAuth() {
    return useContext(AuthContext);
}
