import InfoIcon from '@mui/icons-material/Info';
import { DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { cloneDeep } from 'lodash';
import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDebounceValue } from 'usehooks-ts';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMenuOption } from '@/models/menu-option';

import { Alliance } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamSlotEdit } from '@/fsd/3-features/guides/components/team-slot-edit';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { UnitsGrid } from '@/fsd/3-features/guides/components/units-grid';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SlotType } from '@/fsd/3-features/guides/guides.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ITeamSlot } from '@/fsd/3-features/guides/guides.models';

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
            switch (slotType) {
                case SlotType.none: {
                    editedSlot.unitIds = [];
                    break;
                }
                default: {
                    editedSlot.unitIds = editedSlot.unitIds[0] ? [editedSlot.unitIds[0]] : [];
                    break;
                }
            }

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

                if (editedSlot.slotType === SlotType.core) {
                    const nextSlot = curr.find(x => x.slotNumber === editSlotData.slotNumber + 1);
                    if (nextSlot && !nextSlot.unitIds.filter(x => !!x).length && nextSlot.slotType !== SlotType.none) {
                        setEditSlotData({
                            index: 0,
                            slotNumber: editSlotData.slotNumber + 1,
                        });
                    }
                }

                if (editedSlot.slotType === SlotType.flex) {
                    const nextSlot = editedSlot.unitIds[editSlotData.index + 1];
                    if (!nextSlot && editSlotData.index <= 1) {
                        setEditSlotData({
                            index: editSlotData.index + 1,
                            slotNumber: editSlotData.slotNumber,
                        });
                    }

                    if (editSlotData.index === 2) {
                        const nextSlot = curr.find(x => x.slotNumber === editSlotData.slotNumber + 1);
                        if (
                            nextSlot &&
                            !nextSlot.unitIds.filter(x => !!x).length &&
                            nextSlot.slotType !== SlotType.none
                        ) {
                            setEditSlotData({
                                index: 0,
                                slotNumber: editSlotData.slotNumber + 1,
                            });
                        }
                    }
                }

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

    const handleTeamUnitClick = (slotNumber: number, index: number) => {
        const isTheSameSlot = editSlotData.slotNumber === slotNumber && editSlotData.index === index;
        if (isTheSameSlot) {
            const slot = lineup.find(x => x.slotNumber === slotNumber);
            const isOccupiedSlot = !!slot && !!slot.unitIds[index]?.length;
            if (isOccupiedSlot) {
                setLineup(curr => {
                    const editedSlot = curr.find(x => x.slotNumber === slotNumber);
                    if (!editedSlot) {
                        return curr;
                    }

                    delete editedSlot.unitIds[index];

                    return [...curr];
                });
            }
        } else {
            setEditSlotData({
                slotNumber,
                index,
            });
        }
    };

    return (
        <Dialog open={true} onClose={cancel} fullWidth fullScreen={isMobile}>
            <DialogTitle>
                Select team
                <Typography className="flex-box mx-0 my-2.5">
                    <InfoIcon color="primary" />
                    <span>
                        Toggle between &ldquo;Core&ldquo; and &ldquo;Flex&ldquo; slot types by clicking on the slot type
                    </span>
                </Typography>
                <div className="flex gap-[5px]">
                    {lineup.map(slot => (
                        <TeamSlotEdit
                            key={slot.slotNumber}
                            units={units}
                            slot={slot}
                            editable={true}
                            selectedIndex={editSlotData.slotNumber === slot.slotNumber ? editSlotData.index : -1}
                            editSlot={index => handleTeamUnitClick(slot.slotNumber, index)}
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
