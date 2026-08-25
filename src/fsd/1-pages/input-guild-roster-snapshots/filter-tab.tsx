/* eslint-disable import-x/no-internal-modules */

import { DeleteForever } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rank, Rarity } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';

import { CharactersService as FsdCharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';
import {
    ABILITY_MAX_BY_RARITY,
    ALL_RANK_VALUES,
    ALL_STAR_VALUES,
    enforceUnitThresholdMinimums,
    UnitThresholdPicker,
} from '@/fsd/2-widgets/unit-threshold-picker';

import { FilterCriterion, getMatchingMembers } from './filter-tab.utils';
import { MemberState } from './guild-roster-snapshots.models';

const SHOW_ALL = RosterSnapshotShowVariableSettings.Always;

interface FilterTabProps {
    members: string[] | undefined;
    memberStates: Map<string, MemberState>;
}

const createBlankCriterion = (): FilterCriterion => ({
    unit: undefined,
    rank: Rank.Stone1,
    rarity: Rarity.Common,
    stars: 1,
    activeAbilityLevel: 1,
    passiveAbilityLevel: 1,
});

export const FilterTab = ({ members, memberStates }: FilterTabProps) => {
    const { characters: charactersDefault, mows } = useContext(StoreContext);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const resolvedCharacters = useMemo(
        () => FsdCharactersService.resolveStoredCharacters(charactersDefault),
        [charactersDefault]
    );
    const options = useMemo<IUnit[]>(
        () => [...resolvedCharacters, ...resolvedMows],
        [resolvedCharacters, resolvedMows]
    );

    const [criteria, setCriteria] = useState<FilterCriterion[]>([]);

    const matchingMembers = useMemo(() => getMatchingMembers(memberStates, criteria), [memberStates, criteria]);
    const hasActiveCriterion = criteria.some(criterion => criterion.unit !== undefined);

    const updateCriterion = (index: number, update: Partial<FilterCriterion>) => {
        setCriteria(previous => {
            const next = [...previous];
            const merged = { ...next[index], ...update };
            next[index] = { ...merged, ...enforceUnitThresholdMinimums(merged) };
            return next;
        });
    };

    if (members === undefined) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">Click &ldquo;Load Members&rdquo; to get started.</p>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold">Filter by</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                    {criteria.map((criterion, index) => (
                        <div key={index} className="flex flex-col gap-2 rounded-lg border border-(--border) p-3">
                            <div className="flex justify-end">
                                <IconButton
                                    size="small"
                                    aria-label="Remove criterion"
                                    onClick={() =>
                                        setCriteria(previous => previous.filter((_, index_) => index_ !== index))
                                    }>
                                    <DeleteForever fontSize="small" />
                                </IconButton>
                            </div>
                            <UnitThresholdPicker
                                unit={criterion.unit}
                                options={options}
                                rank={criterion.rank}
                                rarity={criterion.rarity}
                                stars={criterion.stars}
                                activeAbilityLevel={criterion.activeAbilityLevel}
                                passiveAbilityLevel={criterion.passiveAbilityLevel}
                                rankValues={ALL_RANK_VALUES}
                                allStarValues={ALL_STAR_VALUES}
                                onUnitChange={unit => updateCriterion(index, { ...createBlankCriterion(), unit })}
                                onRankChange={rank => updateCriterion(index, { rank })}
                                onRarityChange={rarity => updateCriterion(index, { rarity })}
                                onStarsChange={stars => updateCriterion(index, { stars })}
                                onActiveAbilityLevelChange={value =>
                                    updateCriterion(index, {
                                        activeAbilityLevel: Math.max(
                                            1,
                                            Math.min(ABILITY_MAX_BY_RARITY[criterion.rarity] ?? 60, value)
                                        ),
                                    })
                                }
                                onPassiveAbilityLevelChange={value =>
                                    updateCriterion(index, {
                                        passiveAbilityLevel: Math.max(
                                            1,
                                            Math.min(ABILITY_MAX_BY_RARITY[criterion.rarity] ?? 60, value)
                                        ),
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
                <div>
                    <Button
                        appearance="outline"
                        onPress={() => setCriteria(previous => [...previous, createBlankCriterion()])}>
                        Add Character
                    </Button>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                {hasActiveCriterion ? (
                    matchingMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No guild members match this filter.</p>
                    ) : (
                        matchingMembers.map(member => (
                            <div key={member.userId} className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold">{member.playerName}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {member.matchedUnits.map(unit =>
                                        unit.char ? (
                                            <RosterSnapshotsUnit
                                                key={unit.char.id}
                                                char={unit.char}
                                                showShards={SHOW_ALL}
                                                showMythicShards={SHOW_ALL}
                                                showXpLevel={SHOW_ALL}
                                                showAbilities={SHOW_ALL}
                                                showEquipment={RosterSnapshotShowVariableSettings.Never}
                                                showTooltip
                                                isEnabled
                                            />
                                        ) : unit.mow ? (
                                            <RosterSnapshotsUnit
                                                key={unit.mow.id}
                                                mow={unit.mow}
                                                showShards={SHOW_ALL}
                                                showMythicShards={SHOW_ALL}
                                                showXpLevel={SHOW_ALL}
                                                showAbilities={SHOW_ALL}
                                                showEquipment={RosterSnapshotShowVariableSettings.Never}
                                                showTooltip
                                                isEnabled
                                            />
                                        ) : undefined
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select at least one character or MoW above to see which guild members have it.
                    </p>
                )}
            </section>
        </div>
    );
};
