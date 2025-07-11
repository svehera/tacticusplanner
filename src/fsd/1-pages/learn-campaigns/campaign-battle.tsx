import { Tooltip } from '@mui/material';
import React from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradesService, UpgradeImage } from '@/fsd/4-entities/upgrade';

import { CampaignBattleEnemies } from './campaign-battle-enemies';

interface Props {
    battle: ICampaignBattleComposed;
    scale: number;
}

export const CampaignBattle: React.FC<Props> = ({ battle, scale }) => {
    const getReward = () => {
        const upgrade = UpgradesService.recipeDataFull[battle.reward];
        if (upgrade) {
            const character = CharactersService.getUnit(upgrade.label);
            if (character) {
                return (
                    <div>
                        <Tooltip title={upgrade.label}>
                            <UnitShardIcon
                                icon={character.icon}
                                name={upgrade.label}
                                height={30}
                                width={30}
                                tooltip={upgrade.label}
                            />
                        </Tooltip>
                    </div>
                );
            }
            return (
                <Tooltip title={upgrade.label}>
                    <UpgradeImage material={upgrade.label} iconPath={upgrade.iconPath} />
                </Tooltip>
            );
        }
        return <></>;
    };

    return (
        <div style={{ alignContent: 'center' }}>
            <table>
                <tbody>
                    <tr>
                        <td>
                            {battle.detailedEnemyTypes && battle.detailedEnemyTypes.length > 0 && (
                                <CampaignBattleEnemies enemies={battle.detailedEnemyTypes} scale={scale} />
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                            <div>
                                {getReward()}
                                {battle.dropRate ? `${(battle.dropRate * 100).toFixed(2)}%` : '(N/A)'}
                            </div>
                            <div>Character Slots: {battle.slots ?? 5}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
