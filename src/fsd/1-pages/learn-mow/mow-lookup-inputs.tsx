import React, { useEffect } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input';

import { IMow2 } from '@/fsd/4-entities/mow';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit';

import { IMowLookupInputs } from './lookup.models';

interface Props {
    mows: IMow2[];
    inputs: IMowLookupInputs;
    inputsChange: (value: IMowLookupInputs) => void;
}

export const MowLookupInputs: React.FC<Props> = ({ mows, inputs, inputsChange }) => {
    const [mow, setMow] = useQueryState<IMow2 | null>(
        'mow',
        mowQueryParam => mows.find(x => x.snowprintId === mowQueryParam) ?? inputs.mow,
        mow => mow?.name
    );

    const [primaryAbilityStart, setPrimaryAbilityStart] = useQueryState<number>(
        'pStart',
        primaryAbilityStartParam => (primaryAbilityStartParam ? +primaryAbilityStartParam : inputs.primaryAbilityStart),
        primaryAbilityStart => primaryAbilityStart.toString()
    );

    const [primaryAbilityEnd, setPrimaryAbilityEnd] = useQueryState<number>(
        'pEnd',
        primaryAbilityEndParam => (primaryAbilityEndParam ? +primaryAbilityEndParam : inputs.primaryAbilityEnd),
        primaryAbilityEnd => primaryAbilityEnd.toString()
    );

    const [secondaryAbilityStart, setSecondaryAbilityStart] = useQueryState<number>(
        'sStart',
        secondaryAbilityStartParam =>
            secondaryAbilityStartParam ? +secondaryAbilityStartParam : inputs.secondaryAbilityStart,
        secondaryAbilityStart => secondaryAbilityStart.toString()
    );

    const [secondaryAbilityEnd, setSecondaryAbilityEnd] = useQueryState<number>(
        'sEnd',
        secondaryAbilityEndParam => (secondaryAbilityEndParam ? +secondaryAbilityEndParam : inputs.secondaryAbilityEnd),
        secondaryAbilityEnd => secondaryAbilityEnd.toString()
    );

    useEffect(() => {
        inputsChange({
            mow,
            primaryAbilityStart,
            primaryAbilityEnd,
            secondaryAbilityStart,
            secondaryAbilityEnd,
        });
    }, [mow, primaryAbilityStart, primaryAbilityEnd, secondaryAbilityStart, secondaryAbilityEnd]);

    return (
        <div className="flex-box gap20 wrap">
            {mow && <UnitShardIcon icon={mow.icon} />}
            <UnitsAutocomplete className="max-w-[250px]" unit={mow} options={mows} onUnitChange={setMow} />
            <div className="flex-box gap15 p10">
                <span>Primary:</span>

                <NumberInput label="Start" value={primaryAbilityStart} valueChange={setPrimaryAbilityStart} />
                <NumberInput label="End" value={primaryAbilityEnd} valueChange={setPrimaryAbilityEnd} />
            </div>
            <div className="flex-box gap15 p10">
                <span>Secondary:</span>

                <NumberInput label="Start" value={secondaryAbilityStart} valueChange={setSecondaryAbilityStart} />
                <NumberInput label="End" value={secondaryAbilityEnd} valueChange={setSecondaryAbilityEnd} />
            </div>
        </div>
    );
};
