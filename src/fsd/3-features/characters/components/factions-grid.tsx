import React from 'react';

import { IFaction, IUnit } from '../characters.models';

import { FactionsTile } from './faction-tile';

const FactionsGridFn = ({
    factions,
    onCharacterClick,
}: {
    factions: IFaction[];
    onCharacterClick?: (character: IUnit) => void;
}) => {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(375px,720px))] place-content-around gap-4 gap-x-6">
            {' '}
            {factions.map(x => (
                <FactionsTile key={x.name} faction={x} onCharacterClick={onCharacterClick} />
            ))}
        </div>
    );
};

export const FactionsGrid = React.memo(FactionsGridFn);
