import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { SectorCard } from './SectorCard';

type OnslaughtData = typeof onslaughtData;
const isValidTrack = (track: string): track is keyof OnslaughtData => track in onslaughtData;

export const Onslaught = () => {
    const [queryParams, setQueryParams] = useSearchParams({ track: 'Imperial' });

    useLayoutEffect(() => {
        const queryTrack = queryParams.get('track');
        if (!queryTrack) setQueryParams(new URLSearchParams({ track: 'Imperial' }));
        else if (!isValidTrack(queryTrack)) setQueryParams(new URLSearchParams({ track: 'Imperial' }));
    }, [queryParams, setQueryParams]);

    const activeTrack = queryParams.get('track') ?? 'Imperial';
    if (!isValidTrack(activeTrack)) return <div>Invalid track. Switching...</div>;
    const { sectors, badgeAlliance } = onslaughtData[activeTrack];

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Tabs
                value={activeTrack}
                onChange={(_, value: keyof OnslaughtData) => setQueryParams({ track: value })}
                variant="scrollable"
                scrollButtons="auto"
                className="sticky top-0 border-b border-stone-200 bg-(--bg) pb-0.5 dark:border-stone-700"
                aria-label="Alliance track selection">
                {Object.keys(onslaughtData).map(track => (
                    <Tab key={track} label={track} value={track} />
                ))}
            </Tabs>

            <main className="flex flex-col gap-4">
                {Object.entries(sectors).map(([sectorName, sector]) => {
                    return (
                        <SectorCard key={sectorName} name={sectorName} sector={sector} badgeAlliance={badgeAlliance} />
                    );
                })}
            </main>
        </div>
    );
};
