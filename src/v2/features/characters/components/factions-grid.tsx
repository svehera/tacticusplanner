import React from 'react';

import { IFaction } from '../characters.models';

import { FactionsTile } from './faction-tile';

import './factions-grid.scss';
import { ICharacter2 } from 'src/models/interfaces';

export const FactionsGrid = ({
    factions,
    onCharacterClick,
}: {
    factions: IFaction[];
    onCharacterClick?: (character: ICharacter2) => void;
}) => {
    return (
        <div className="factions-grid">
            {factions.map(x => (
                <FactionsTile key={x.name} faction={x} onCharacterClick={onCharacterClick} />
            ))}
        </div>
    );
};
