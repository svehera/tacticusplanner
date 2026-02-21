/* eslint-disable boundaries/element-types */
/* eslint-disable no-restricted-imports */
/* eslint-disable import-x/no-internal-modules */
import { useContext, useMemo } from 'react';

import { numberToThousandsString, numberToThousandsStringOld } from '@/fsd/5-shared/lib';
import { Rank, UnitType } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { FactionImage } from '@/fsd/4-entities/faction';
import { IUnit } from '@/fsd/4-entities/unit';

import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';

import { RosterSnapshotCharacter } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshot-character';
import { RosterSnapshotsService } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshots-service';

import { RosterSnapshotShowVariableSettings } from '../../view-settings/model';
import { IFaction } from '../characters.models';

export const FactionsTile = ({
    faction,
    onCharacterClick,
}: {
    faction: IFaction;
    onCharacterClick?: (character: IUnit) => void;
}) => {
    const viewContext = useContext(CharactersViewContext);
    const factionPower = numberToThousandsString(faction.power);
    const factionValue = numberToThousandsString(faction.bsValue);
    const factionClass = useMemo(() => {
        const isComplete = faction.units.length === 5;
        const isIncomplete = faction.units.length < 5;
        const isMow = faction.units.length > 5;

        if (isComplete) {
            return 'justify-start';
        }
        if (isIncomplete) {
            return 'justify-start ps-[5px]';
        }

        if (isMow) {
            return 'justify-start';
        }
        return '';
    }, [faction.units.length]);
    const { showBsValue, showPower } = useContext(CharactersViewContext);
    return (
        <div className="flex max-w-[525px] min-w-[375px] flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#1a1a1a] shadow-lg max-[500px]:max-w-[375px] lg:max-w-[800px]">
            {/* Modern Card Header */}
            <div
                className="flex items-center justify-between px-3 py-2 font-medium text-white shadow-md"
                style={{
                    background: `linear-gradient(90deg, ${faction.color}CC 0%, #1a1a1a 100%)`,
                    borderLeft: `4px solid ${faction.color}`,
                }}>
                <div className="flex items-center gap-2">
                    <div className="drop-shadow-md">
                        <FactionImage faction={faction.snowprintId} />
                    </div>
                    <span className="text-sm tracking-wide sm:text-base">{faction.name.toUpperCase()}</span>
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <Conditional condition={showBsValue}>
                        <AccessibleTooltip title={numberToThousandsStringOld(faction.bsValue)}>
                            <div className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5">
                                <MiscIcon icon={'blackstone'} height={16} width={12} />
                                {factionValue}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>

                    <Conditional condition={showPower}>
                        <AccessibleTooltip title={numberToThousandsStringOld(faction.power)}>
                            <div className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5">
                                <MiscIcon icon={'power'} height={16} width={12} />
                                {factionPower}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>
                </div>
            </div>

            {/* Units Container */}
            <div className={`flex flex-wrap items-center gap-1 bg-[#121212]/50 p-2 ${factionClass}`}>
                {faction.units.map(unit => {
                    const isCharacter = unit.unitType === UnitType.character;
                    return (
                        <div
                            key={unit.snowprintId!}
                            onClick={() => onCharacterClick?.(unit)}
                            className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                            title={`Select ${unit.name || 'Unit'}`}>
                            <RosterSnapshotCharacter
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
                                isDisabled={isCharacter ? unit.rank === Rank.Locked : !unit.unlocked}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
