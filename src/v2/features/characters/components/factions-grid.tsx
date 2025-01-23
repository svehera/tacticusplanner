import React from 'react';

import { IFaction, IUnit } from '../characters.models';

import { FactionsTile } from './faction-tile';

import './factions-grid.scss';

export const FactionsGrid = ({
    factions,
    onCharacterClick,
}: {
    factions: IFaction[];
    onCharacterClick?: (character: IUnit) => void;
}) => {
    return (
        <div className="factions-grid">
            {factions.map(x => (
                <FactionsTile key={x.name} faction={x} onCharacterClick={onCharacterClick} />
            ))}
        </div>
    );
};

export default React.memo(FactionsGrid);
