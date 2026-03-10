import React, { useMemo } from 'react';

import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { ICampaignBattleComposed } from 'src/models/interfaces';
import { NumbersInput } from 'src/shared-components/goals/numbers-input';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';

import { ICharacterAscendGoal } from '@/fsd/3-features/goals/goals.models';

interface Props {
    goal: ICharacterAscendGoal;
    possibleLocations: ICampaignBattleComposed[];
    unlockedLocations: string[];
    possibleMythicLocations: ICampaignBattleComposed[];
    unlockedMythicLocations: string[];
    onChange: (key: keyof ICharacterAscendGoal, value: number) => void;
}

export const EditAscendGoal: React.FC<Props> = ({ goal, possibleLocations, possibleMythicLocations, onChange }) => {
    const rarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter(x => x >= goal.rarityStart);
    }, [goal.rarityStart]);

    const starsEntries = useMemo(() => {
        const maxStars = rarityToMaxStars[goal.rarityStart];
        return getEnumValues(RarityStars).filter(x => x >= goal.starsStart && x <= maxStars);
    }, [goal.starsStart, goal.rarityStart]);

    const starsTargetEntries = useMemo(() => {
        const minStars = rarityToStars[goal.rarityEnd];
        const maxStars = rarityToMaxStars[goal.rarityEnd];
        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [goal.rarityEnd]);

    return (
        <>
            <div className="flex gap-3">
                <RaritySelect
                    label={'Current Rarity'}
                    rarityValues={rarityValues}
                    value={goal.rarityStart}
                    valueChanges={value => onChange('rarityStart', value)}
                />

                <RaritySelect
                    label={'Target Rarity'}
                    rarityValues={rarityValues}
                    value={goal.rarityEnd}
                    valueChanges={value => onChange('rarityEnd', value)}
                />
            </div>

            <div className="flex gap-3">
                <StarsSelect
                    label={'Current stars'}
                    starsValues={starsEntries}
                    value={goal.starsStart}
                    valueChanges={value => onChange('starsStart', value)}
                />
                <StarsSelect
                    label={'Target stars'}
                    starsValues={starsTargetEntries}
                    value={goal.starsEnd ?? starsTargetEntries[0]}
                    valueChanges={value => onChange('starsEnd', value)}
                />
            </div>

            {(goal.rarityStart < Rarity.Mythic || goal.starsStart < RarityStars.OneBlueStar) && (
                <>
                    {possibleLocations.length !== 0 && (
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <NumbersInput
                                    title="Shards per onslaught"
                                    helperText="Put 0 to ignore Onslaught raids"
                                    value={goal.onslaughtShards}
                                    valueChange={value => onChange('onslaughtShards', value)}
                                />
                            </div>
                        </div>
                    )}

                    {possibleLocations.length === 0 && (
                        <div className="flex-box gap10 full-width">
                            <NumbersInput
                                title="Shards per onslaught"
                                helperText="You should put more than 0 to be able to create the goal"
                                value={goal.onslaughtShards}
                                valueChange={value => onChange('onslaughtShards', value)}
                            />
                        </div>
                    )}
                </>
            )}

            {goal.rarityEnd >= Rarity.Mythic && (
                <>
                    {!!possibleMythicLocations.length && (
                        <div className="flex gap-3">
                            <div className="w-1/2">
                                <NumbersInput
                                    title="Mythic Shards per onslaught"
                                    helperText="Put 0 to ignore mythic Onslaught raids"
                                    value={goal.onslaughtMythicShards}
                                    valueChange={value => onChange('onslaughtMythicShards', value)}
                                />
                            </div>
                        </div>
                    )}

                    {!possibleMythicLocations.length && (
                        <div className="flex-box gap10 full-width">
                            <NumbersInput
                                title="Mythic Shards per onslaught"
                                helperText="You should put more than 0 to be able to create the goal"
                                value={goal.onslaughtMythicShards}
                                valueChange={value => onChange('onslaughtMythicShards', value)}
                            />
                        </div>
                    )}
                </>
            )}
        </>
    );
};
