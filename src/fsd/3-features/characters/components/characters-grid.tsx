/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
/* eslint-disable no-restricted-imports */
import React, { useContext } from 'react';
import { isMobile } from 'react-device-detect';

import { UnitType } from '@/fsd/5-shared/model';
import { Conditional } from '@/fsd/5-shared/ui';

import { IUnit } from '@/fsd/4-entities/unit';
import { isUnlocked } from '@/fsd/4-entities/unit/units.functions';

import { RosterSnapshotCharacter } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshot-character';
import { RosterSnapshotsService } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshots-service';

import { RosterSnapshotShowVariableSettings } from '../../view-settings/model';
import { CharactersViewContext } from '../characters-view.context';

const CharactersGridFn = ({
    characters,
    blockedCharacters = [],
    onAvailableCharacterClick,
    onLockedCharacterClick,
    onlyBlocked,
}: {
    characters: IUnit[];
    blockedCharacters?: string[];
    onAvailableCharacterClick?: (character: IUnit) => void;
    onLockedCharacterClick?: (character: IUnit) => void;
    onlyBlocked?: boolean;
}) => {
    const viewContext = useContext(CharactersViewContext);
    const unlockedCharacters = characters
        .filter(unit => isUnlocked(unit) && !blockedCharacters.includes(unit.name))
        .map(unit => {
            const isCharacter = unit.unitType === UnitType.character;
            return (
                <div
                    key={unit.snowprintId!}
                    onClick={() => onAvailableCharacterClick?.(unit)}
                    className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                    title={`Select ${unit.name || 'Unit'}`}>
                    <RosterSnapshotCharacter
                        key={unit.snowprintId!}
                        char={isCharacter ? RosterSnapshotsService.snapshotCharacter(unit) : undefined}
                        charData={isCharacter ? unit : undefined}
                        mow={!isCharacter ? RosterSnapshotsService.snapshotMachineOfWar(unit) : undefined}
                        mowData={!isCharacter ? unit : undefined}
                        showShards={
                            viewContext.showCharacterLevel
                                ? RosterSnapshotShowVariableSettings.Always
                                : RosterSnapshotShowVariableSettings.Never
                        }
                        showMythicShards={
                            viewContext.showCharacterLevel
                                ? RosterSnapshotShowVariableSettings.Always
                                : RosterSnapshotShowVariableSettings.Never
                        }
                        showXpLevel={
                            viewContext.showCharacterLevel
                                ? RosterSnapshotShowVariableSettings.Always
                                : RosterSnapshotShowVariableSettings.Never
                        }
                        showAbilities={
                            viewContext.showAbilitiesLevel
                                ? RosterSnapshotShowVariableSettings.Always
                                : RosterSnapshotShowVariableSettings.Never
                        }
                        showEquipment={
                            viewContext.showEquipment
                                ? RosterSnapshotShowVariableSettings.Always
                                : RosterSnapshotShowVariableSettings.Never
                        }
                        showTooltip={true}
                        isDisabled={false}
                    />
                </div>
            );
        });

    const lockedCharacters = characters
        .filter(x => (!onlyBlocked && !isUnlocked(x)) || blockedCharacters.includes(x.name))
        .map(unit => {
            const isCharacter = unit.unitType === UnitType.character;
            return (
                <div
                    key={unit.snowprintId!}
                    onClick={() => onLockedCharacterClick?.(unit)}
                    className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                    title={`Select ${unit.name || 'Unit'}`}>
                    <RosterSnapshotCharacter
                        key={unit.snowprintId!}
                        char={isCharacter ? RosterSnapshotsService.snapshotCharacter(unit) : undefined}
                        charData={isCharacter ? unit : undefined}
                        mow={!isCharacter ? RosterSnapshotsService.snapshotMachineOfWar(unit) : undefined}
                        mowData={!isCharacter ? unit : undefined}
                        showShards={RosterSnapshotShowVariableSettings.Always}
                        showMythicShards={RosterSnapshotShowVariableSettings.Always}
                        showXpLevel={RosterSnapshotShowVariableSettings.Never}
                        showAbilities={RosterSnapshotShowVariableSettings.Never}
                        showEquipment={RosterSnapshotShowVariableSettings.Always}
                        showTooltip={true}
                        isDisabled={false}
                    />
                </div>
            );
        });
    return (
        <div>
            <h4>Available ({unlockedCharacters.length})</h4>
            <div
                className="flex flex-wrap [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]"
                style={{ zoom: isMobile ? 0.8 : 1 }}>
                {unlockedCharacters}
            </div>

            <Conditional condition={!!lockedCharacters.length}>
                <h4>Locked ({lockedCharacters.length})</h4>
                <div
                    className="flex flex-wrap [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)]"
                    style={{ zoom: isMobile ? 0.8 : 1 }}>
                    {lockedCharacters}
                </div>
            </Conditional>
        </div>
    );
};

export const CharactersGrid = React.memo(CharactersGridFn);
