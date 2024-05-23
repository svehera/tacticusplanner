import React, { useEffect } from 'react';
import { IMow } from 'src/v2/features/characters/characters.models';
import { useQueryState } from 'src/v2/hooks/query-state';
import { CharacterImage } from 'src/shared-components/character-image';
import { AbilityLevelInput } from 'src/v2/components/inputs/ability-level-input';
import { UnitsAutocomplete } from 'src/v2/components/inputs/units-autocomplete';
import { IMowLookupInputs } from 'src/v2/features/lookup/lookup.models';

interface Props {
    mows: IMow[];
    inputsChange: (value: IMowLookupInputs) => void;
}

export const MowLookupInputs: React.FC<Props> = ({ mows, inputsChange }) => {
    const [mow, setMow] = useQueryState<IMow | null>(
        'mow',
        mowQueryParam => mows.find(x => x.id === mowQueryParam) ?? mows[0],
        mow => mow?.id
    );

    const [primaryAbilityStart, setPrimaryAbilityStart] = useQueryState<number>(
        'pStart',
        primaryAbilityStartParam => (primaryAbilityStartParam ? +primaryAbilityStartParam : 1),
        primaryAbilityStart => primaryAbilityStart.toString()
    );

    const [primaryAbilityEnd, setPrimaryAbilityEnd] = useQueryState<number>(
        'pEnd',
        primaryAbilityEndParam => (primaryAbilityEndParam ? +primaryAbilityEndParam : 1),
        primaryAbilityEnd => primaryAbilityEnd.toString()
    );

    const [secondaryAbilityStart, setSecondaryAbilityStart] = useQueryState<number>(
        'sStart',
        secondaryAbilityStartParam => (secondaryAbilityStartParam ? +secondaryAbilityStartParam : 1),
        secondaryAbilityStart => secondaryAbilityStart.toString()
    );

    const [secondaryAbilityEnd, setSecondaryAbilityEnd] = useQueryState<number>(
        'sEnd',
        secondaryAbilityEndParam => (secondaryAbilityEndParam ? +secondaryAbilityEndParam : 1),
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

    const renderAutocompleteOption = (props: React.HTMLAttributes<any>, mow: IMow) => {
        return (
            <div {...props} className="flex-box gap5 p5">
                <CharacterImage icon={mow.badgeIcon} imageSize={35} />
                <span>{mow.name}</span>
            </div>
        );
    };

    return (
        <div className="flex-box gap20 wrap">
            <UnitsAutocomplete
                unit={mow}
                options={mows}
                onUnitChange={setMow}
                renderOption={renderAutocompleteOption}
            />
            <div className="flex-box gap15 p10">
                <span>Primary:</span>

                <AbilityLevelInput label="Start" value={primaryAbilityStart} valueChange={setPrimaryAbilityStart} />
                <AbilityLevelInput label="End" value={primaryAbilityEnd} valueChange={setPrimaryAbilityEnd} />
            </div>
            <div className="flex-box gap15 p10">
                <span>Secondary:</span>

                <AbilityLevelInput label="Start" value={secondaryAbilityStart} valueChange={setSecondaryAbilityStart} />
                <AbilityLevelInput label="End" value={secondaryAbilityEnd} valueChange={setSecondaryAbilityEnd} />
            </div>
        </div>
    );
};
