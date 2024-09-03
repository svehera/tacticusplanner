import React from 'react';
import { useLre } from 'src/v2/pages/lre/lre-hook';
import { LegendaryEventPage } from 'src/routes/legendary-events/legendary-events-page';

export const Lre: React.FC = () => {
    const { legendaryEvent } = useLre();

    return <LegendaryEventPage legendaryEvent={legendaryEvent} />;
};
