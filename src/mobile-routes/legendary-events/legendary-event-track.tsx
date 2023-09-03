import React from 'react';
import { ILegendaryEventTrack } from '../../models/interfaces';

export const LegendaryEventTrack = (props: { track: ILegendaryEventTrack }) => {
    const items = props.track.unitsRestrictions.map(x => (<p key={x.name}>{x.name}</p>));

    return (
        <div>
            {items}
        </div>
    );
};
