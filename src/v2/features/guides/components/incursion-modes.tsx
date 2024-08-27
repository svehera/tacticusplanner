﻿import React, { useEffect, useMemo, useState } from 'react';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import mowsData from 'src/v2/data/mows.json';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { IMenuOption } from 'src/v2/models/menu-option';
import { isCharacter } from 'src/v2/features/characters/units.functions';

interface Props {
    units: IUnit[];
    filterUnits: (filtered: IUnit[]) => void;
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const IncursionModes: React.FC<Props> = ({ selectedModes, updateSelection, units, filterUnits }) => {
    const [mow, setMow] = useState<string>(() => {
        return selectedModes[0] ?? '';
    });
    const relatedMowData = mowsData.find(x => x.id === mow);

    const allowedUnits = useMemo(() => {
        if (relatedMowData) {
            return units.filter(x => x.alliance === relatedMowData.deployableAlliance && isCharacter(x));
        }
        return units;
    }, [mow]);

    const options: IMenuOption[] = mowsData.map(m => ({
        value: m.id,
        label: `${m.name} (using ${m.deployableAlliance})`,
        selected: false,
    }));

    const handleMowChange = (value: string[]) => {
        updateSelection(value);
        setMow(value[0]);
    };

    useEffect(() => {
        return filterUnits(allowedUnits);
    }, [allowedUnits]);

    return (
        <>
            <div className="flex-box gap5">
                <MultipleSelect
                    multiple={false}
                    label="MoW"
                    selected={[mow]}
                    options={options}
                    optionsChange={handleMowChange}
                    minWidth={150}
                />
            </div>
            {!!allowedUnits.length && <span>Available characters - {allowedUnits.length}</span>}
        </>
    );
};