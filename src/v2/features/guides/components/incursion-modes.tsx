import React, { useEffect, useMemo, useState } from 'react';

import { IMenuOption } from '@/models/menu-option';

import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

import { mowsData } from '@/fsd/4-entities/mow';
import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

import { IUnit } from 'src/v2/features/characters/characters.models';

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
