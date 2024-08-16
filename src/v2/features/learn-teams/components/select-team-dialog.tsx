﻿import React, { useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { isMobile } from 'react-device-detect';
import { cloneDeep } from 'lodash';

import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { Alliance } from 'src/models/enums';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { isCharacter, isMow } from 'src/v2/features/characters/units.functions';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { IMenuOption } from 'src/v2/models/menu-option';
import { ITeamSlot } from 'src/v2/features/learn-teams/learn-teams.models';
import { TeamSlotEdit } from 'src/v2/features/learn-teams/components/team-slot-edit';
import { UnitsGrid } from 'src/v2/features/learn-teams/components/units-grid';
import { SlotType } from 'src/v2/features/learn-teams/learn-teams.enums';

type Props = {
    units: IUnit[];
    slots: ITeamSlot[];
    onClose: (slots: ITeamSlot[]) => void;
};

type FilterBy = 'none' | 'xenos' | 'chaos' | 'imperial';

export const SelectTeamDialog: React.FC<Props> = ({ onClose, slots, units }) => {
    const [lineup, setLineup] = useState(cloneDeep(slots));
    const [quickFilter, setQuickFilter] = useDebounceValue('', 300);
    const [filterByVar, setFilterByVar] = useState<FilterBy>('none');
    const [editSlotData, setEditSlotData] = useState<{ slotNumber: number; index: number }>({
        slotNumber: 1,
        index: 0,
    });

    const cancel = () => onClose(slots);
    const select = () => onClose(lineup);

    const selectedUnits = useMemo(() => lineup.flatMap(slot => slot.unitIds), [lineup]);

    const handleSlotTypeChange = (slotNumber: number, slotType: SlotType) => {
        setLineup(curr => {
            const editedSlot = curr.find(x => x.slotNumber === slotNumber);
            if (!editedSlot) {
                return curr;
            }

            editedSlot.slotType = slotType;
            editedSlot.unitIds = editedSlot.unitIds[0] ? [editedSlot.unitIds[0]] : [];

            return [...curr];
        });
    };

    const handleCharacterSelect = (unit: IUnit) => {
        const isSelected = selectedUnits.includes(unit.id);

        if (isSelected) {
            setLineup(curr => {
                const editedSlot = curr.find(x => x.slotNumber === editSlotData.slotNumber);
                if (!editedSlot) {
                    return curr;
                }

                delete editedSlot.unitIds[editSlotData.index];

                return [...curr];
            });
        } else {
            setLineup(curr => {
                const editedSlot = curr.find(x => x.slotNumber === editSlotData.slotNumber);
                if (!editedSlot) {
                    return curr;
                }

                editedSlot.unitIds[editSlotData.index] = unit.id;

                return [...curr];
            });
        }
    };

    const filteredUnits = useMemo(() => {
        const filterUnits = () => {
            const typeFiltered: IUnit[] =
                editSlotData.slotNumber === 6 ? units.filter(isMow) : units.filter(isCharacter);

            const nameFiltered = !quickFilter
                ? typeFiltered
                : typeFiltered.filter(x => x.name.toLowerCase().includes(quickFilter.toLowerCase()));

            switch (filterByVar) {
                case 'xenos':
                    return nameFiltered.filter(x => x.alliance === Alliance.Xenos);
                case 'chaos':
                    return nameFiltered.filter(x => x.alliance === Alliance.Chaos);
                case 'imperial':
                    return nameFiltered.filter(x => x.alliance === Alliance.Imperial);
                case 'none':
                default:
                    return nameFiltered;
            }
        };

        return filterUnits();
    }, [units, quickFilter, filterByVar, editSlotData.slotNumber]);

    const filterByOptions: IMenuOption[] = [
        {
            value: 'none',
            label: 'None',
            selected: true,
        },
        {
            value: 'chaos',
            label: 'Chaos',
            selected: false,
        },
        {
            value: 'imperial',
            label: 'Imperial',
            selected: false,
        },
        {
            value: 'xenos',
            label: 'Xenos',
            selected: false,
        },
    ];

    const changeFilter = (value: string[]): void => {
        setFilterByVar(value[0] as FilterBy);
    };

    return (
        <Dialog open={true} onClose={cancel} fullWidth fullScreen={isMobile}>
            <DialogTitle>
                Select team
                <div className="flex-box gap5 start">
                    {lineup.map(slot => (
                        <TeamSlotEdit
                            key={slot.slotNumber}
                            units={units}
                            slot={slot}
                            editable={true}
                            selectedIndex={editSlotData.slotNumber === slot.slotNumber ? editSlotData.index : -1}
                            editSlot={index =>
                                setEditSlotData({
                                    slotNumber: slot.slotNumber,
                                    index,
                                })
                            }
                            editType={type => handleSlotTypeChange(slot.slotNumber, type)}
                        />
                    ))}
                </div>
            </DialogTitle>
            <DialogContent>
                <br />
                <div className="flex-box gap10">
                    <TextField
                        size="small"
                        sx={{ margin: '10px', minWidth: 100, width: 220 }}
                        label="Quick Search"
                        variant="outlined"
                        onChange={event => setQuickFilter(event.target.value)}
                    />
                    <MultipleSelect
                        label="Filter by"
                        multiple={false}
                        options={filterByOptions}
                        optionsChange={changeFilter}
                        size="small"
                        minWidth={100}
                    />
                </div>
                <UnitsGrid units={filteredUnits} onUnitClick={handleCharacterSelect} selectedUnits={selectedUnits} />
            </DialogContent>
            <DialogActions>
                <Button onClick={cancel}>Cancel</Button>
                <Button onClick={select}>Select</Button>
            </DialogActions>
        </Dialog>
    );
};