import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { OnslaughtData } from './data';
import { onslaughtData } from './data';
import { indexToRomanNumeral } from './utils';

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
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
            <h1 className="text-xl font-bold sm:text-2xl">Onslaught</h1>

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

            <main className="flex flex-col gap-3">
                {sectors.toReversed().map((sector, reversedIndex) => {
                    const sectorIndex = sectors.length - 1 - reversedIndex;
                    return (
                        <details key={sector.boardId}>
                            <summary className="cursor-pointer">
                                <strong>Sector {indexToRomanNumeral(sectorIndex)}</strong>
                                {' — '}Character Power required: {sector.minHeroPower}
                            </summary>
                            <Killzone />
                        </details>
                    );
                })}
            </main>
        </div>
    );
};

function Killzone() {
    return <p className="text-muted-foreground pl-4 text-sm">Killzone content placeholder</p>;
}
