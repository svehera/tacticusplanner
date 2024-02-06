import React from 'react';

import { ICharacter2 } from 'src/models/interfaces';

import { FactionImage } from 'src/v2/components/images/faction-image';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';

import { IFaction } from '../characters.models';
import { CharacterTile } from './character-tile';

import './faction-tile.scss';
export const FactionsTile = ({
    faction,
    onCharacterClick,
}: {
    faction: IFaction;
    onCharacterClick?: (character: ICharacter2) => void;
}) => {
    const factionPower = numberToThousandsString(faction.power);
    const isCompleteFaction = faction.characters.length === 5;
    return (
        <div className="faction">
            <h4 className="faction-title" style={{ backgroundColor: faction.color }}>
                <div className="faction-icon">
                    <FactionImage faction={faction.icon} />
                    <span>{faction.name.toUpperCase()}</span>
                </div>
                <div className="faction-power">
                    <MiscIcon icon={'power'} height={20} width={15} />
                    {''}
                    {factionPower}
                </div>
            </h4>
            <div className={`characters-box ${isCompleteFaction ? 'complete-faction' : 'incomplete-faction'}`}>
                {faction.characters.map(character => {
                    return <CharacterTile key={character.name} character={character} onClick={onCharacterClick} />;
                })}
            </div>
        </div>
    );
};
