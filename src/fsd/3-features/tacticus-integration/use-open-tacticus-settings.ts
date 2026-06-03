import { usePopupManager } from 'react-popup-manager';

import { useAuth } from '@/fsd/5-shared/model';

import { TacticusIntegrationDialog } from './tacticus-integration.dialog';

export const useOpenTacticusSettings = () => {
    const popupManager = usePopupManager();
    const { userInfo } = useAuth();

    const openTacticusSettings = () => {
        popupManager.open(TacticusIntegrationDialog, {
            tacticusApiKey: userInfo.tacticusApiKey,
            tacticusUserId: userInfo.tacticusUserId,
            tacticusGuildApiKey: userInfo.tacticusGuildApiKey,
            shareInGameName: userInfo.shareInGameName ?? false,
            shareRosterData: userInfo.shareRosterData ?? false,
            shareGuildMemberPerformance: userInfo.shareGuildMemberPerformance ?? false,
            combinedGuildTags: userInfo.combinedGuildTags ?? [],
            guildTag: userInfo.guildTag ?? '',
            onClose: () => {},
        });
    };

    return { openTacticusSettings };
};
