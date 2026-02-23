/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
/* eslint-disable no-restricted-imports */
import { Divider } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { ICharacter2 } from 'src/models/interfaces';

import { IMow2, IUnit } from '@/fsd/3-features/characters/characters.models';
import { EmptyTile } from '@/fsd/3-features/characters/components/empty-tile';

import { RosterSnapshotCharacter } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshot-character';
import { RosterSnapshotsService } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshots-service';

import { RosterSnapshotShowVariableSettings } from '../../view-settings/model';

interface Props {
    characters: (ICharacter2 | undefined)[];
    onClick?: (unit: IUnit) => void;
    onEmptyClick?: (isMow: boolean) => void;
    mow?: IMow2 | null;
    withMow?: boolean;
}

export const TeamView: React.FC<Props> = ({ characters, mow, withMow = false, onClick, onEmptyClick }) => {
    const onMowClick = (relatedMow: IMow2) => {
        if (onClick) {
            onClick(relatedMow);
        }
    };

    const onEmptyMowClick = () => {
        if (onEmptyClick) {
            onEmptyClick(true);
        }
    };

    const onCharacterClick = (character: ICharacter2) => {
        if (onClick) {
            onClick(character);
        }
    };

    const onEmptyCharacterClick = () => {
        if (onEmptyClick) {
            onEmptyClick(false);
        }
    };

    return (
        <div className="flex-box" style={{ zoom: isMobile ? '50%' : '100%' }}>
            <div className="grid grid-cols-[repeat(5,auto)] justify-items-center gap-x-2 gap-y-2">
                {(() => {
                    const slotCount = Math.max(5, characters.length);
                    return Array.from({ length: slotCount }).map((_, index) => {
                        const character = characters[index];
                        return character ? (
                            <div
                                key={character.snowprintId!}
                                onClick={() => onCharacterClick(character)}
                                className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                                title={`Select ${character.name || 'Unit'}`}>
                                <RosterSnapshotCharacter
                                    key={character.id}
                                    char={RosterSnapshotsService.snapshotCharacter(character)}
                                    charData={character}
                                    showShards={RosterSnapshotShowVariableSettings.Never}
                                    showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                    showAbilities={RosterSnapshotShowVariableSettings.Always}
                                    showEquipment={RosterSnapshotShowVariableSettings.Always}
                                    showTooltip={false}
                                    showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                    isDisabled={false}
                                />
                            </div>
                        ) : (
                            <EmptyTile key={`empty-${index}`} onClick={onEmptyCharacterClick} />
                        );
                    });
                })()}
            </div>
            {withMow && (
                <>
                    <Divider orientation="vertical" flexItem />
                    {mow ? (
                        <div
                            key={mow.snowprintId!}
                            onClick={() => onMowClick(mow)}
                            className="flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
                            title={`Select ${mow.name || 'Unit'}`}>
                            <RosterSnapshotCharacter
                                key={mow.id}
                                mow={RosterSnapshotsService.snapshotMachineOfWar(mow)}
                                mowData={mow}
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={RosterSnapshotShowVariableSettings.Always}
                                showTooltip={false}
                                showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                isDisabled={false}
                            />
                        </div>
                    ) : (
                        <EmptyTile isMow onClick={onEmptyMowClick} />
                    )}
                </>
            )}
        </div>
    );
};
