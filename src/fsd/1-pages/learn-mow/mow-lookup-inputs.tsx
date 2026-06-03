import React, { useEffect } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { trackEvent } from '@/fsd/5-shared/monitoring';
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

const trackMowLookupFilter = (action: string) => {
    trackEvent('search', {
        feature: 'mow_lookup',
        action,
        search_location: 'mow_lookup_inputs',
    });
};

export const MowLookupInputs: React.FC<Props> = ({ mows, inputs, inputsChange }) => {
    const [mow, setMow] = useQueryState<IMow2 | null>(
        'mow',
        // eslint-disable-next-line unicorn/no-null -- autocomplete requires null
        mowQueryParameter => mows.find(x => x.snowprintId === mowQueryParameter) ?? inputs.mow ?? null,
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
            mow: mow ?? undefined,
            primaryAbilityStart,
            primaryAbilityEnd,
            secondaryAbilityStart,
            secondaryAbilityEnd,
        });
    }, [mow, primaryAbilityStart, primaryAbilityEnd, secondaryAbilityStart, secondaryAbilityEnd]);

    return (
        <div className="flex-box gap20 wrap">
            {mow && <UnitShardIcon icon={mow.roundIcon} />}
            {}
            <UnitsAutocomplete
                className="max-w-[250px]"
                unit={mow}
                options={mows}
                onUnitChange={value => {
                    trackMowLookupFilter('select_unit');
                    setMow(value);
                }}
            />
            <div className="flex-box gap15 p10">
                <span>Primary:</span>

                <NumberInput
                    label="Start"
                    value={primaryAbilityStart}
                    valueChange={value => {
                        trackMowLookupFilter('change_primary_start');
                        setPrimaryAbilityStart(value);
                    }}
                />
                <NumberInput
                    label="End"
                    value={primaryAbilityEnd}
                    valueChange={value => {
                        trackMowLookupFilter('change_primary_end');
                        setPrimaryAbilityEnd(value);
                    }}
                />
            </div>
            <div className="flex-box gap15 p10">
                <span>Secondary:</span>

                <NumberInput
                    label="Start"
                    value={secondaryAbilityStart}
                    valueChange={value => {
                        trackMowLookupFilter('change_secondary_start');
                        setSecondaryAbilityStart(value);
                    }}
                />
                <NumberInput
                    label="End"
                    value={secondaryAbilityEnd}
                    valueChange={value => {
                        trackMowLookupFilter('change_secondary_end');
                        setSecondaryAbilityEnd(value);
                    }}
                />
            </div>
        </div>
    );
};
