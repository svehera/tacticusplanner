import { useContext, useMemo } from 'react';

import { numberToThousandsString, numberToThousandsStringOld } from '@/fsd/5-shared/lib';
import { UnitType } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { FactionImage } from '@/fsd/4-entities/faction';
import { IUnit } from '@/fsd/4-entities/unit';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MowTile } from '@/fsd/3-features/characters/components/mow-tile';

import { IFaction } from '../characters.models';

import { CharacterTile } from './character-tile';

export const FactionsTile = ({
    faction,
    onCharacterClick,
}: {
    faction: IFaction;
    onCharacterClick?: (character: IUnit) => void;
}) => {
    const factionPower = numberToThousandsString(faction.power);
    const factionValue = numberToThousandsString(faction.bsValue);
    const factionClass = useMemo(() => {
        const isComplete = faction.units.length === 5;
        const isIncomplete = faction.units.length < 5;
        const isMow = faction.units.length > 5;

        if (isComplete) {
            return 'justify-start';
        }
        if (isIncomplete) {
            return 'justify-start ps-[5px]';
        }

        if (isMow) {
            return 'justify-start';
        }
        return '';
    }, [faction.units.length]);
    const { showBsValue, showPower } = useContext(CharactersViewContext);
    return (
        <div className="max-w-[525px] min-w-[375px] max-[500px]:max-w-[375px]">
            <h4
                className="mt-[5px] mb-0 flex items-center justify-between border-t-2 border-solid border-[gold] font-medium text-white"
                style={{ backgroundColor: faction.color }}>
                <div className="flex items-center gap-[5px]">
                    <FactionImage faction={faction.snowprintId} />
                    <span>{faction.name.toUpperCase()}</span>
                </div>
                <Conditional condition={showBsValue}>
                    <AccessibleTooltip title={numberToThousandsStringOld(faction.bsValue)}>
                        <div className="flex">
                            <MiscIcon icon={'blackstone'} height={20} width={15} />
                            {''}
                            {factionValue}
                        </div>
                    </AccessibleTooltip>
                </Conditional>
                <Conditional condition={showPower}>
                    <AccessibleTooltip title={numberToThousandsStringOld(faction.power)}>
                        <div className="flex">
                            <MiscIcon icon={'power'} height={20} width={15} />
                            {''}
                            {factionPower}
                        </div>
                    </AccessibleTooltip>
                </Conditional>
            </h4>
            <div
                className={`flex items-center [box-shadow:1px_2px_3px_rgba(0,_0,_0,_0.6)] max-[500px]:flex-wrap ${factionClass}`}>
                {faction.units.map(unit => {
                    if (unit.unitType === UnitType.character) {
                        return (
                            <CharacterTile
                                key={unit.snowprintId!}
                                character={unit}
                                onCharacterClick={onCharacterClick}
                            />
                        );
                    }
                    if (unit.unitType === UnitType.mow) {
                        return <MowTile key={unit.id} mow={unit} onClick={onCharacterClick} />;
                    }
                })}
            </div>
        </div>
    );
};
