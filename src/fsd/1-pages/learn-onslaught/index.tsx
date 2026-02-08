import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { OnslaughtData } from './data';
import { onslaughtData } from './data';
import { SectorCard } from './SectorCard';

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
    const sectors = onslaughtData[activeTrack];

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-6">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Onslaught</h1>

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
                {sectors.toReversed().map((sector, reversedIndex) => {
                    const sectorIndex = sectors.length - 1 - reversedIndex;
                    return <SectorCard key={sectorIndex} sector={sector} sectorIndex={sectorIndex} />;
                })}
            </main>
        </div>
    );
};
