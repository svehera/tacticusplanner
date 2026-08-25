import React from 'react';

import { RarityStars, DamageType, Rank, getPierceRatio } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';

import { StatsCalculatorService } from '../stats-calculator.service';

interface Props {
    character: ICharacter2;
    rank: Rank;
    rarityStars: RarityStars;
    numDamageUpgrades: number;
}

export const DamageCell: React.FC<Props> = ({ character, rank, rarityStars, numDamageUpgrades }) => {
    /** @returns the computed damage with this attack against infinite armor. */
    const computeDamvarInfArmour = (damage: number, hits: number, damageType: DamageType | undefined) => {
        if (damageType == undefined) return <>N/A</>;
        if (hits == 0) return <>N/A</>;
        const pierce = getPierceRatio(damageType);
        // A damage type getPierceRatio doesn't recognize returns its -1 sentinel; showing that
        // multiplied through would read as a nonsense negative DAMVAR instead of "unknown".
        if (pierce < 0) return <>N/A</>;
        return <>{Math.round(damage * hits * pierce)}</>;
    };

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>
                            <div className="bg-cyan-500/25">
                                {' '}
                                vs <MiscIcon icon={'armour'} width={15} height={15} /> 0{' '}
                            </div>
                        </th>
                        <th>
                            <div className="bg-cyan-500/50">
                                {' '}
                                vs <MiscIcon icon={'armour'} width={15} height={15} /> &infin;{' '}
                            </div>
                        </th>
                    </tr>
                    <tr>
                        <th>
                            <div className="bg-cyan-500/25">melee</div>
                        </th>
                        <td>
                            <div className="bg-cyan-500/50">
                                {StatsCalculatorService.calculateDamage(
                                    character.snowprintId,
                                    rarityStars,
                                    rank,
                                    numDamageUpgrades
                                ) * (character.meleeHits ?? 0)}
                            </div>
                        </td>
                        <td>
                            <div className="bg-cyan-500/25">
                                {computeDamvarInfArmour(
                                    StatsCalculatorService.calculateDamage(
                                        character.snowprintId,
                                        rarityStars,
                                        rank,
                                        numDamageUpgrades
                                    ),
                                    character.meleeHits ?? 0,
                                    character.damageTypes.melee ?? undefined
                                )}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>
                            <div className="bg-cyan-500/50">range</div>
                        </th>
                        <td>
                            <div className="bg-cyan-500/25">
                                {(character.rangeHits ?? 0) == 0 ? (
                                    <>N/A</>
                                ) : (
                                    StatsCalculatorService.calculateDamage(
                                        character.snowprintId,
                                        rarityStars,
                                        rank,
                                        numDamageUpgrades
                                    ) * (character.rangeHits ?? 0)
                                )}
                            </div>
                        </td>
                        <td>
                            <div className="bg-cyan-500/50">
                                {computeDamvarInfArmour(
                                    StatsCalculatorService.calculateDamage(
                                        character.snowprintId,
                                        rarityStars,
                                        rank,
                                        numDamageUpgrades
                                    ),
                                    character.rangeHits ?? 0,
                                    character.damageTypes.range ?? undefined
                                )}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
