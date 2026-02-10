import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { SectorCard } from './SectorCard';

type OnslaughtData = typeof onslaughtData;
const validTracks = Object.keys(onslaughtData) as (keyof typeof onslaughtData)[];

export const Onslaught = () => {
    const [queryParams, setQueryParams] = useSearchParams({ track: validTracks[0] });

    useLayoutEffect(() => {
        const currentTrack = queryParams.get('track');
        if (!currentTrack || !validTracks.includes(currentTrack as (typeof validTracks)[number])) {
            setQueryParams(new URLSearchParams({ track: validTracks[0] }));
        }
    }, [queryParams, setQueryParams]);

    const activeTrack = (queryParams.get('track') as keyof OnslaughtData) ?? validTracks[0];
    const { sectors, badgeAlliance } = onslaughtData[activeTrack];

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Tabs
                value={activeTrack}
                onChange={(_, value: keyof OnslaughtData) => setQueryParams({ track: value })}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Alliance track selection">
                {validTracks.map(track => (
                    <Tab key={track} label={track} value={track} />
                ))}
            </Tabs>

            <main className="flex flex-col gap-3 sm:gap-4">
                {Object.entries(sectors).map(([sectorName, sector]) => {
                    return (
                        <SectorCard key={sectorName} name={sectorName} sector={sector} badgeAlliance={badgeAlliance} />
                    );
                })}
            </main>
        </div>
    );
};
