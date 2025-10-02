import React from 'react';

import { RarityStars, Rarity, DamageType, Rank } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';

import { StatsCalculatorService } from '../stats-calculator.service';

interface Props {
    character: ICharacter2;
    rank: Rank;
    rarity: Rarity;
    rarityStars: RarityStars;
    numDamageUpgrades: number;
}

export const DamageCell: React.FC<Props> = ({ character, rank, rarity, rarityStars, numDamageUpgrades }) => {
    /** @returns the computed damage with this attack against infinite armor. */
    const computeDamvarInfArmour = (damage: number, hits: number, damageType: DamageType | undefined) => {
        if (damageType == undefined) return <>N/A</>;
        if (hits == 0) return <>N/A</>;
        return <>{Math.round(damage * hits * computePierce(damageType))}</>;
    };

    /** @returns the pierce ratio for the specified damage type, or -1 if the type is invalid. */
    const computePierce = (damageType: DamageType) => {
        switch (damageType) {
            case DamageType.Bio:
                return 0.3;
            case DamageType.Blast:
                return 0.15;
            case DamageType.Bolter:
                return 0.2;
            case DamageType.Chain:
                return 0.15;
            case DamageType.Direct:
                return 1.0;
            case DamageType.Energy:
                return 0.3;
            case DamageType.Eviscerate:
                return 0.5;
            case DamageType.Flame:
                return 0.25;
            case DamageType.HeavyRound:
                return 0.55;
            case DamageType.Las:
                return 0.1;
            case DamageType.Melta:
                return 0.75;
            case DamageType.Molecular:
                return 0.6;
            case DamageType.Particle:
                return 0.35;
            case DamageType.Physical:
                return 0.01;
            case DamageType.Piercing:
                return 0.8;
            case DamageType.Plasma:
                return 0.6;
            case DamageType.Power:
                return 0.4;
            case DamageType.Projectile:
                return 0.15;
            case DamageType.Pulse:
                return 0.2;
            case DamageType.Psychic:
                return 1.0;
            case DamageType.Toxic:
                return 0.7;
            default:
                return -1;
        }
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
                                    character.snowprintId!,
                                    rarity,
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
                                        character.snowprintId!,
                                        rarity,
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
                                        character.snowprintId!,
                                        rarity,
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
                                        character.snowprintId!,
                                        rarity,
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
