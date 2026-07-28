import { enqueueSnackbar } from 'notistack';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { updateTacticusApiKey } from '@/fsd/5-shared/lib/tacticus-api';
import { useAuth } from '@/fsd/5-shared/model';
import { useLoader } from '@/fsd/5-shared/ui/contexts';

function buildErrorMessage(error: string | Error | undefined): string {
    const baseMessage = 'Failed to update settings';
    const detail = typeof error === 'string' ? error : error?.message;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
}

interface UpdateTacticusSettingsArguments {
    apiKey: string;
    guildApiKey: string;
    userId: string;
    shareInGameName: boolean;
    shareRosterData: boolean;
    guildTag: string;
    loader: Pick<ReturnType<typeof useLoader>, 'startLoading' | 'endLoading'>;
    auth: Pick<ReturnType<typeof useAuth>, 'userInfo' | 'setUserInfo'>;
}

export async function updateTacticusSettings({
    apiKey,
    guildApiKey,
    userId,
    shareInGameName,
    shareRosterData,
    guildTag,
    loader,
    auth,
}: UpdateTacticusSettingsArguments): Promise<boolean> {
    loader.startLoading('Updating settings. Please wait…');
    try {
        const response = await updateTacticusApiKey(apiKey, guildApiKey, userId, {
            shareInGameName,
            shareRosterData,
            guildTag,
        });

        if (response.error) {
            enqueueSnackbar(buildErrorMessage(response.error), { variant: 'error' });
            return false;
        }

        auth.setUserInfo({
            ...auth.userInfo,
            tacticusApiKey: apiKey,
            tacticusGuildApiKey: guildApiKey,
            tacticusUserId: userId,
            shareInGameName,
            shareRosterData,
            guildTag,
        });

        enqueueSnackbar('Settings updated', { variant: 'success' });
        return true;
    } catch (error) {
        console.error(error);
        const parsedError =
            typeof error === 'string' || error instanceof Error || error === undefined ? error : String(error);
        enqueueSnackbar(buildErrorMessage(parsedError), { variant: 'error' });
        return false;
    } finally {
        loader.endLoading();
    }
}
