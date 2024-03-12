import React, { useContext } from 'react';

import { ICharacter2 } from 'src/models/interfaces';

import { FactionImage } from 'src/v2/components/images/faction-image';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';

import { IFaction } from '../characters.models';
import { CharacterTile } from './character-tile';

import './faction-tile.scss';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { Conditional } from 'src/v2/components/conditional';
export const FactionsTile = ({
    faction,
    onCharacterClick,
}: {
    faction: IFaction;
    onCharacterClick?: (character: ICharacter2) => void;
}) => {
    const factionPower = numberToThousandsString(faction.power);
    const factionValue = numberToThousandsString(faction.bsValue);
    const isCompleteFaction = faction.characters.length === 5;
    const { showBsValue, showPower } = useContext(CharactersViewContext);
    return (
        <div className="faction">
            <h4 className="faction-title" style={{ backgroundColor: faction.color }}>
                <div className="faction-icon">
                    <FactionImage faction={faction.icon} />
                    <span>{faction.name.toUpperCase()}</span>
                </div>
                <Conditional condition={showBsValue}>
                    <div className="faction-value">
                        <MiscIcon icon={'blackstone'} height={20} width={15} />
                        {''}
                        {factionValue}
                    </div>
                </Conditional>
                <Conditional condition={showPower}>
                    <div className="faction-power">
                        <MiscIcon icon={'power'} height={20} width={15} />
                        {''}
                        {factionPower}
                    </div>
                </Conditional>
            </h4>
            <div className={`characters-box ${isCompleteFaction ? 'complete-faction' : 'incomplete-faction'}`}>
                {faction.characters.map(character => {
                    return <CharacterTile key={character.name} character={character} onClick={onCharacterClick} />;
                })}
            </div>
        </div>
    );
};
