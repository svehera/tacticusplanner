/* eslint-disable import-x/no-internal-modules */
import { orderBy } from 'lodash';
import { Star, X } from 'lucide-react';
import React, { useMemo } from 'react';

import { ICharacter2, IPersonalGoal } from '@/models/interfaces';
import { SetGoalDialog } from '@/shared-components/goals/set-goal-dialog';

import { IMow2 } from '@/fsd/4-entities/mow';
import { ISurvivalEvent } from '@/fsd/4-entities/survival';
import { CharactersPowerService, convertCharacterToSnapshot, convertMowToSnapshot } from '@/fsd/4-entities/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';
import { CharacterSelectGrid, MowSelectGrid } from '@/fsd/2-widgets/unit-select-grid';

import { RelatedGoals } from '../related-goals';

const MAX_CHARACTERS = 10;
const MAX_MOWS = 3;

interface Props {
    event: ISurvivalEvent;
    characters: ICharacter2[];
    mows: IMow2[];
    teamUnitIds: string[];
    onTeamChange: (unitIds: string[]) => void;
    goals: IPersonalGoal[];
}

export const TeamTab: React.FC<Props> = ({ event, characters, mows, teamUnitIds, onTeamChange, goals }) => {
    // The featured hero is a required part of every team (a survival mechanic, not a pick) — it's
    // always shown, can't be removed, doesn't count against the character cap, and never gets
    // persisted in teamUnitIds since it's implied by the event rather than chosen by the player.
    const featuredCharacter = useMemo(
        () => characters.find(c => c.snowprintId === event.featuredHero.id),
        [characters, event.featuredHero.id]
    );

    const teamChars = useMemo(
        () => teamUnitIds.map(id => characters.find(c => c.snowprintId === id)).filter((c): c is ICharacter2 => !!c),
        [teamUnitIds, characters]
    );
    const teamMows = useMemo(
        () => teamUnitIds.map(id => mows.find(m => m.snowprintId === id)).filter((m): m is IMow2 => !!m),
        [teamUnitIds, mows]
    );

    const mowsAllowed = event.survival.isMachinesOfWarAllowedInBattle;
    const disallowedFactions = event.battle.disallowedFactions;

    const availableCharacters = useMemo(
        () =>
            orderBy(
                characters.filter(
                    c => c.snowprintId !== event.featuredHero.id && !disallowedFactions.includes(c.faction)
                ),
                c => CharactersPowerService.getCharacterPower(c),
                'desc'
            ),
        [characters, disallowedFactions, event.featuredHero.id]
    );

    const availableMows = useMemo(
        () =>
            mowsAllowed
                ? orderBy(
                      mows.filter(m => !disallowedFactions.includes(m.faction)),
                      m => CharactersPowerService.getCharacterPower(m),
                      'desc'
                  )
                : [],
        [mows, disallowedFactions, mowsAllowed]
    );

    const charsAtCap = teamChars.length >= MAX_CHARACTERS;
    const mowsAtCap = teamMows.length >= MAX_MOWS;

    const addCharacter = (id: string) => {
        if (charsAtCap || teamUnitIds.includes(id)) return;
        onTeamChange([...teamUnitIds, id]);
    };

    const addMow = (id: string) => {
        if (mowsAtCap || teamUnitIds.includes(id)) return;
        onTeamChange([...teamUnitIds, id]);
    };

    const removeUnit = (id: string) => {
        onTeamChange(teamUnitIds.filter(unitId => unitId !== id));
    };

    const relatedGoals = goals.filter(
        goal => goal.character === event.featuredHero.id || teamUnitIds.includes(goal.character)
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Team</h3>
                <SetGoalDialog />
            </div>

            <div className="min-h-[220px] rounded-lg border-2 border-dashed border-(--border) bg-(--card)/50 p-3">
                <div className="flex flex-wrap gap-3">
                    {featuredCharacter && (
                        <div className="relative">
                            <RosterSnapshotsUnit
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showXpLevel={RosterSnapshotShowVariableSettings.Always}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={RosterSnapshotShowVariableSettings.Always}
                                showTooltip={true}
                                char={convertCharacterToSnapshot(featuredCharacter)}
                                isEnabled={true}
                            />
                            <div
                                title="Featured hero — required for this survival, always part of the team"
                                className="absolute -top-2 -left-2 flex items-center gap-1 rounded-full bg-(--primary) px-2 py-0.5 text-[10px] font-semibold text-(--primary-fg) shadow">
                                <Star className="size-3" fill="currentColor" />
                                Featured
                            </div>
                        </div>
                    )}
                    {teamChars.map(char => (
                        <div key={char.snowprintId} className="relative">
                            <RosterSnapshotsUnit
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showXpLevel={RosterSnapshotShowVariableSettings.Always}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={RosterSnapshotShowVariableSettings.Always}
                                showTooltip={true}
                                char={convertCharacterToSnapshot(char)}
                                isEnabled={true}
                            />
                            <button
                                type="button"
                                onClick={() => removeUnit(char.snowprintId)}
                                title="Remove from team"
                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-(--danger) text-(--danger-fg) shadow">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    ))}
                    {teamMows.map(mow => (
                        <div key={mow.snowprintId} className="relative">
                            <RosterSnapshotsUnit
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showXpLevel={RosterSnapshotShowVariableSettings.Always}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={RosterSnapshotShowVariableSettings.Always}
                                showTooltip={true}
                                mow={convertMowToSnapshot(mow)}
                                isEnabled={true}
                            />
                            <button
                                type="button"
                                onClick={() => removeUnit(mow.snowprintId)}
                                title="Remove from team"
                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-(--danger) text-(--danger-fg) shadow">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
                {teamChars.length === 0 && teamMows.length === 0 && (
                    <p className="mt-3 text-center text-sm text-(--soft-fg)">
                        Pick characters and Machines of War from the grids below.
                    </p>
                )}
            </div>

            <div>
                <h4 className="mb-2 text-sm font-semibold text-(--soft-fg) uppercase">Related Goals</h4>
                <RelatedGoals goals={relatedGoals} characters={characters} mows={mows} />
            </div>

            {(charsAtCap || mowsAtCap) && (
                <div className="rounded border border-(--warning) bg-(--warning)/10 px-3 py-2 text-sm text-(--warning)">
                    {charsAtCap && mowsAtCap
                        ? `You've picked the max of ${MAX_CHARACTERS} characters and ${MAX_MOWS} Machines of War.`
                        : charsAtCap
                          ? `You've picked the max of ${MAX_CHARACTERS} characters.`
                          : `You've picked the max of ${MAX_MOWS} Machines of War.`}{' '}
                    Remove a unit to pick another.
                </div>
            )}

            <div className={charsAtCap ? 'pointer-events-none opacity-40' : undefined}>
                <CharacterSelectGrid
                    characters={availableCharacters}
                    onCharacterSelect={addCharacter}
                    showHeader={true}
                    zoom={1}
                    deployedUnitIds={teamUnitIds}
                />
            </div>

            {mowsAllowed && (
                <div className={mowsAtCap ? 'pointer-events-none opacity-40' : undefined}>
                    <MowSelectGrid
                        mows={availableMows}
                        onMowSelect={addMow}
                        showHeader={true}
                        zoom={1}
                        deployedUnitIds={teamUnitIds}
                    />
                </div>
            )}
        </div>
    );
};
