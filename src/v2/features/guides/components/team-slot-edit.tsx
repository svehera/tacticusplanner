import React, { useState } from 'react';
import { ITeamSlot } from 'src/v2/features/guides/guides.models';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { SlotType } from 'src/v2/features/guides/guides.enums';
import { Tooltip } from '@mui/material';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';
import { isCharacter } from 'src/v2/features/characters/units.functions';

import './team-slot-edit.scss';
import { UnitType } from 'src/v2/features/characters/units.enums';

interface Props {
    units: IUnit[];
    slot: ITeamSlot;
    selectedIndex?: number;
    editable?: boolean;
    editSlot?: (index: number) => void;
    editType?: (type: SlotType) => void;
}

export const TeamSlotEdit: React.FC<Props> = ({
    slot,
    units,
    editable = false,
    editSlot,
    editType,
    selectedIndex = -1,
}) => {
    const [slotType, setSlotType] = useState(slot.slotType);

    const editUnitSlot = (index: number) => {
        if (!editable || !editSlot) {
            return;
        }

        editSlot(index);
    };

    const renderPortrait = (unitId: string, index: number) => {
        const unit = units.find(x => x.id === unitId);
        if (!unit) {
            return (
                <div
                    className={selectedIndex === index ? 'glow-border' : ''}
                    style={{ cursor: editSlot ? 'pointer' : 'default' }}
                    onClick={() => editUnitSlot(index)}>
                    <CharacterPortraitImage
                        icon={slot.unitType === UnitType.character ? 'unset.webp' : 'unsetMow.webp'}
                        key={index}
                    />
                </div>
            );
        }

        const portraitIcon = isCharacter(unit) ? unit.icon : unit.portraitIcon;

        return (
            <Tooltip placement={'top'} title={unit.name} key={unitId}>
                <div
                    className={selectedIndex === index ? 'glow-border' : ''}
                    style={{ cursor: editSlot ? 'pointer' : 'default' }}
                    onClick={() => editUnitSlot(index)}>
                    <CharacterPortraitImage icon={portraitIcon} />
                </div>
            </Tooltip>
        );
    };

    const toggleSlotType = () => {
        if (!editable || !editType) {
            return;
        }

        if (slotType === SlotType.core) {
            setSlotType(SlotType.flex);
            editType(SlotType.flex);
        }

        if (slotType === SlotType.flex) {
            if (slot.unitType === UnitType.character) {
                setSlotType(SlotType.core);
                editType(SlotType.core);
            } else if (slot.unitType === UnitType.mow) {
                setSlotType(SlotType.none);
                editType(SlotType.none);
            }
        }

        if (slotType === SlotType.none) {
            setSlotType(SlotType.core);
            editType(SlotType.core);
        }
    };

    return (
        <div>
            <div
                className="slot-type"
                style={{
                    textAlign: 'center',
                    cursor: editable ? 'pointer' : 'default',
                    backgroundColor:
                        slotType === SlotType.core ? '#2e7d32' : slotType === SlotType.flex ? '#ed6c02' : '',
                    marginBottom: 10,
                }}
                onClick={toggleSlotType}>
                {SlotType[slotType].toUpperCase()}
            </div>
            {slotType === SlotType.core ? (
                renderPortrait(slot.unitIds[0], 0)
            ) : slotType === SlotType.flex ? (
                <div className="flex-box column gap5">
                    <span>{renderPortrait(slot.unitIds[0], 0)}</span>
                    <span>{renderPortrait(slot.unitIds[1], 1)}</span>
                    <span>{renderPortrait(slot.unitIds[2], 2)}</span>
                </div>
            ) : (
                <> </>
            )}
        </div>
    );
};
