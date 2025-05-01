import React, { useEffect } from 'react';

import { CharacterImage } from 'src/shared-components/character-image';
import { NumberInput } from 'src/v2/components/inputs/number-input';
import { UnitsAutocomplete } from 'src/v2/components/inputs/units-autocomplete';
import { IMow } from 'src/v2/features/characters/characters.models';
import { IMowLookupInputs } from 'src/v2/features/lookup/lookup.models';
import { useQueryState } from 'src/v2/hooks/query-state';

interface Props {
    mows: IMow[];
    inputs: IMowLookupInputs;
    inputsChange: (value: IMowLookupInputs) => void;
}

export const MowLookupInputs: React.FC<Props> = ({ mows, inputs, inputsChange }) => {
    const [mow, setMow] = useQueryState<IMow | null>(
        'mow',
        mowQueryParam => mows.find(x => x.id === mowQueryParam) ?? inputs.mow,
        mow => mow?.id
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
            {mow && <CharacterImage icon={mow.badgeIcon} />}
            <UnitsAutocomplete style={{ maxWidth: 250 }} unit={mow} options={mows} onUnitChange={setMow} />
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
