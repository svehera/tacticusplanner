import React from 'react';

import { IFaction, IUnit } from '../characters.models';

import { FactionsTile } from './faction-tile';

import './factions-grid.scss';

const FactionsGridFn = ({
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

export const FactionsGrid = React.memo(FactionsGridFn);
