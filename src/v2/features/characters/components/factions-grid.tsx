import React from 'react';

import { IFaction } from '../characters.models';

import { FactionsTile } from './faction-tile';

import './factions-grid.scss';

export const FactionsGrid = ({ factions }: { factions: IFaction[] }) => {
    return (
        <div className="factions-grid">
            {factions.map(x => (
                <FactionsTile key={x.name} faction={x} />
            ))}
        </div>
    );
};
