import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/fsd/5-shared/model/auth';
import { IUserInfo } from '@/fsd/5-shared/model/user-info.model';
import { UserRole } from '@/fsd/5-shared/model/user-role.enum';

import { purgeUserData } from './auth.endpoints';
import { PurgeUserDataDialog } from './purge-user-data-dialog';

vi.mock('./auth.endpoints', () => ({ purgeUserData: vi.fn() }));

const purgeUserDataMock = vi.mocked(purgeUserData);
const logoutMock = vi.fn();
const onCloseMock = vi.fn();
const userInfo: IUserInfo = {
    username: 'Tactician',
    userId: 1,
    role: UserRole.user,
    pendingTeamsCount: 0,
    rejectedTeamsCount: 0,
    tacticusApiKey: '',
    tacticusUserId: '',
    tacticusGuildApiKey: '',
};

const renderDialog = () =>
    render(
        <SnackbarProvider>
            <AuthContext.Provider
                value={{
                    username: 'Tactician',
                    isAuthenticated: true,
                    token: 'token',
                    userInfo,
                    login: vi.fn(),
                    logout: logoutMock,
                    setUser: vi.fn(),
                    setUserInfo: vi.fn(),
                }}>
                <PurgeUserDataDialog isOpen onClose={onCloseMock} />
            </AuthContext.Provider>
        </SnackbarProvider>
    );

describe('PurgeUserDataDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('purges the server account and logs out after a successful deletion', async () => {
        purgeUserDataMock.mockResolvedValue({ data: undefined, error: undefined });
        renderDialog();

        const deleteButton = screen.getByRole('button', { name: 'Delete account' });
        expect(deleteButton).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
        fireEvent.click(deleteButton);

        await waitFor(() => expect(purgeUserDataMock).toHaveBeenCalledOnce());
        expect(logoutMock).toHaveBeenCalledOnce();
        expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('keeps the user signed in when the deletion request fails', async () => {
        purgeUserDataMock.mockResolvedValue({ data: undefined, error: 'Network error' });
        renderDialog();

        fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

        await waitFor(() => expect(purgeUserDataMock).toHaveBeenCalledOnce());
        expect(logoutMock).not.toHaveBeenCalled();
        expect(onCloseMock).not.toHaveBeenCalled();
    });
});
