import React from 'react';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign';

import { CampaignBattleEnemies } from './campaign-battle-enemies';

interface Props {
    battle: ICampaignBattleComposed;
    scale: number;
}

export const CampaignBattle: React.FC<Props> = ({ battle, scale }) => {
    return (
        <div className="content-center">
            <table>
                <tbody>
                    <tr>
                        <td>
                            {battle.detailedEnemyTypes && battle.detailedEnemyTypes.length > 0 && (
                                <CampaignBattleEnemies
                                    keyPrefix="battle"
                                    battleId={battle.id}
                                    enemies={battle.detailedEnemyTypes}
                                    scale={scale}
                                />
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                            <div>
                                {battle.rewards.guaranteed.map((reward, index) => {
                                    return (
                                        <span key={index}>
                                            Guaranteed: {reward.id}{' '}
                                            {reward.min !== reward.max
                                                ? reward.min + ' - ' + reward.max
                                                : ': ' + reward.min}
                                        </span>
                                    );
                                })}
                            </div>
                            <div>
                                {battle.rewards.potential.map((reward, index) => {
                                    return (
                                        <span key={index}>
                                            Potential: {reward.id}
                                            {' ' +
                                                reward.chance_numerator +
                                                ' / ' +
                                                reward.chance_denominator +
                                                ' (eff: ' +
                                                (reward.effective_rate * 100).toFixed(2) +
                                                '%)'}
                                            )
                                        </span>
                                    );
                                })}
                            </div>
                            <div>Character Slots: {battle.slots!}</div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
