import React, { useContext, useMemo } from 'react';

import { FactionImage } from 'src/v2/components/images/faction-image';
import { numberToThousandsString, numberToThousandsStringOld } from 'src/v2/functions/number-to-thousands-string';

import { AccessibleTooltip, Conditional  } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { MowTile } from 'src/v2/features/characters/components/mow-tile';
import { UnitType } from 'src/v2/features/characters/units.enums';

import { IFaction, IUnit } from '../characters.models';

import { CharacterTile } from './character-tile';

import './faction-tile.scss';

export const FactionsTile = ({
    faction,
    onCharacterClick,
}: {
    faction: IFaction;
    onCharacterClick?: (character: IUnit) => void;
}) => {
    const factionPower = numberToThousandsString(faction.power);
    const factionValue = numberToThousandsString(faction.bsValue);
    const isCompleteFaction = faction.units.length >= 5;
    const factionClass = useMemo(() => {
        const isComplete = faction.units.length === 5;
        const isIncomplete = faction.units.length < 5;
        const isMow = faction.units.length > 5;

        if (isComplete) {
            return 'complete-faction';
        }
        if (isIncomplete) {
            return 'incomplete-faction';
        }

        if (isMow) {
            return 'mow-faction';
        }
        return '';
    }, [faction.units.length]);
    const { showBsValue, showPower } = useContext(CharactersViewContext);
    return (
        <div className="faction">
            <h4 className="faction-title" style={{ backgroundColor: faction.color }}>
                <div className="faction-icon">
                    <FactionImage faction={faction.name} />
                    <span>{faction.name.toUpperCase()}</span>
                </div>
                <Conditional condition={showBsValue}>
                    <AccessibleTooltip title={numberToThousandsStringOld(faction.bsValue)}>
                        <div className="faction-value">
                            <MiscIcon icon={'blackstone'} height={20} width={15} />
                            {''}
                            {factionValue}
                        </div>
                    </AccessibleTooltip>
                </Conditional>
                <Conditional condition={showPower}>
                    <AccessibleTooltip title={numberToThousandsStringOld(faction.power)}>
                        <div className="faction-power">
                            <MiscIcon icon={'power'} height={20} width={15} />
                            {''}
                            {factionPower}
                        </div>
                    </AccessibleTooltip>
                </Conditional>
            </h4>
            <div className={`characters-box ${factionClass}`}>
                {faction.units.map(unit => {
                    if (unit.unitType === UnitType.character) {
                        return <CharacterTile key={unit.id} character={unit} onCharacterClick={onCharacterClick} />;
                    }
                    if (unit.unitType === UnitType.mow) {
                        return <MowTile key={unit.id} mow={unit} onClick={onCharacterClick} />;
                    }
                })}
            </div>
        </div>
    );
};
