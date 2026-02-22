/* eslint-disable no-restricted-imports */
/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import { ICharacter2 } from 'src/models/interfaces';

import { unsetCharacter } from '@/fsd/3-features/characters/characters.constants';

import { RosterSnapshotCharacter } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshot-character';
import { RosterSnapshotsService } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshots-service';

import { RosterSnapshotShowVariableSettings } from '../../view-settings/model';

type Props = {
    characters: ICharacter2[];
    size?: 5 | 7;
    onSetSlotClick: (character: ICharacter2) => void;
    onEmptySlotClick?: () => void;
};

export const Team: React.FC<Props> = ({ characters, size = 5, onSetSlotClick, onEmptySlotClick }) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;

    return (
        <div className="flex flex-wrap items-center justify-center">
            {Array.from({ length: size }, (_, i) => {
                const char = characters[i];

                if (char) {
                    return (
                        <div
                            key={char.snowprintId! + i}
                            onClick={() => onSetSlotClick(char)}
                            className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                            title={'Select Unit'}>
                            <RosterSnapshotCharacter
                                char={RosterSnapshotsService.snapshotCharacter(char)}
                                charData={char}
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={RosterSnapshotShowVariableSettings.Always}
                                showTooltip={false}
                                showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                isDisabled={false}
                            />
                        </div>
                    );
                }

                return (
                    <div
                        key={fallbackCharacter.name + i}
                        onClick={() => onEmptySlotClick?.()}
                        className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                        title={'Select Unit'}>
                        <RosterSnapshotCharacter
                            char={RosterSnapshotsService.snapshotCharacter(fallbackCharacter)}
                            charData={fallbackCharacter}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showAbilities={RosterSnapshotShowVariableSettings.Always}
                            showEquipment={RosterSnapshotShowVariableSettings.Always}
                            showTooltip={false}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            isDisabled={false}
                        />
                    </div>
                );
            })}
        </div>
    );
};
