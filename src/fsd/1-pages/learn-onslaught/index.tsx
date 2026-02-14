import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { HomeScreenEventPlanner } from './home-screen-event-planner';
import { SectorCard } from './SectorCard';

export const Onslaught = () => {
    const [queryParams, setQueryParams] = useSearchParams({ track: 'Imperial' });

    const activeTrack = queryParams.get('track');
    const trackData = onslaughtData.find(track => track !== undefined && track.alliance === activeTrack);
    useLayoutEffect(() => {
        if (trackData) return; // if the track is valid, no need to update the URL
        if (activeTrack === 'HSE') return; // if the user has selected the HSE planner, no need to update the URL
        setQueryParams(new URLSearchParams({ track: 'HSE' }));
    }, [queryParams, setQueryParams, trackData]);

    const { sectors, badgeAlliance } = trackData ?? { sectors: undefined, badgeAlliance: undefined };

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Tabs
                value={activeTrack}
                onChange={(_, value) => setQueryParams({ track: value })}
                variant="scrollable"
                scrollButtons="auto"
                className="sticky top-0 border-b border-stone-200 bg-(--bg) pb-0.5 dark:border-stone-700"
                aria-label="Alliance track selection">
                {onslaughtData.map(({ alliance }) => (
                    <Tab key={alliance} label={alliance} value={alliance} />
                ))}
                <Tab label={'HSE'} value={'HSE'} />
            </Tabs>

            <main className="flex flex-col gap-4">
                {sectors !== undefined &&
                    sectors.map(sector => (
                        <SectorCard key={sector.name} sector={sector} badgeAlliance={badgeAlliance} />
                    ))}
                {sectors === undefined && <HomeScreenEventPlanner />}
            </main>
        </div>
    );
};
