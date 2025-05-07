import { Tooltip } from '@mui/material';
import React from 'react';

import { ICampaignBattleComposed } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { UpgradeImage } from 'src/shared-components/upgrade-image';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

import { CampaignBattleEnemies } from './campaign-battle-enemies';

interface Props {
    battle: ICampaignBattleComposed;
    scale: number;
}

export const CampaignBattle: React.FC<Props> = ({ battle, scale }) => {
    const getReward = () => {
        const upgrade = StaticDataService.recipeDataFull[battle.reward];
        if (upgrade) {
            const character = StaticDataService.getUnit(upgrade.label);
            if (character) {
                return (
                    <div>
                        <Tooltip title={upgrade.label}>
                            <CharacterShardIcon
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
                    <UpgradeImage material={upgrade.label} iconPath={upgrade.iconPath} rarity={upgrade.rarity} />
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
