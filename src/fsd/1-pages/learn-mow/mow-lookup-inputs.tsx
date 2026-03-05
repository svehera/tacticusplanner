import React, { useEffect } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { NumberInput } from '@/fsd/5-shared/ui/input';

import { IMow2 } from '@/fsd/4-entities/mow';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit';

import { IMowLookupInputs } from './lookup.models';

interface Properties {
    mows: IMow2[];
    inputs: IMowLookupInputs;
    inputsChange: (value: IMowLookupInputs) => void;
}

export const MowLookupInputs: React.FC<Properties> = ({ mows, inputs, inputsChange }) => {
    const [mow, setMow] = useQueryState<IMow2 | undefined>(
        'mow',
        mowQueryParameter => mows.find(x => x.snowprintId === mowQueryParameter) ?? inputs.mow,
        mow => mow?.name
    );

    const [primaryAbilityStart, setPrimaryAbilityStart] = useQueryState<number>(
        'pStart',
        primaryAbilityStartParameter =>
            primaryAbilityStartParameter ? +primaryAbilityStartParameter : inputs.primaryAbilityStart,
        primaryAbilityStart => primaryAbilityStart.toString()
    );

    const [primaryAbilityEnd, setPrimaryAbilityEnd] = useQueryState<number>(
        'pEnd',
        primaryAbilityEndParameter =>
            primaryAbilityEndParameter ? +primaryAbilityEndParameter : inputs.primaryAbilityEnd,
        primaryAbilityEnd => primaryAbilityEnd.toString()
    );

    const [secondaryAbilityStart, setSecondaryAbilityStart] = useQueryState<number>(
        'sStart',
        secondaryAbilityStartParameter =>
            secondaryAbilityStartParameter ? +secondaryAbilityStartParameter : inputs.secondaryAbilityStart,
        secondaryAbilityStart => secondaryAbilityStart.toString()
    );

    const [secondaryAbilityEnd, setSecondaryAbilityEnd] = useQueryState<number>(
        'sEnd',
        secondaryAbilityEndParameter =>
            secondaryAbilityEndParameter ? +secondaryAbilityEndParameter : inputs.secondaryAbilityEnd,
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
            {mow && <UnitShardIcon icon={mow.roundIcon} />}
            {/* eslint-disable-next-line unicorn/no-null */}
            <UnitsAutocomplete className="max-w-[250px]" unit={mow ?? null} options={mows} onUnitChange={setMow} />
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
