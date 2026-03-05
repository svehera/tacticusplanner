import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { SectorCard } from './SectorCard';

export const Onslaught = () => {
    const [queryParameters, setQueryParameters] = useSearchParams({ track: 'Imperial' });

    const activeTrack = queryParameters.get('track') ?? 'Imperial';
    const trackData = onslaughtData.find(track => track.alliance === activeTrack);
    useLayoutEffect(() => {
        if (trackData) return; // if the track is valid, no need to update the URL
        setQueryParameters(new URLSearchParams({ track: 'Imperial' }));
    }, [queryParameters, setQueryParameters, trackData]);

    if (!trackData) return <div>Invalid track. Switching...</div>;
    const { sectors, badgeAlliance } = trackData;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <Tabs
                value={activeTrack}
                onChange={(_, value) => setQueryParameters({ track: value })}
                variant="scrollable"
                scrollButtons="auto"
                className="sticky top-0 border-b border-stone-200 bg-(--bg) pb-0.5 dark:border-stone-700"
                aria-label="Alliance track selection">
                {onslaughtData.map(({ alliance }) => (
                    <Tab key={alliance} label={alliance} value={alliance} />
                ))}
            </Tabs>

            <main className="flex flex-col gap-4">
                {sectors.map(sector => (
                    <SectorCard key={sector.name} sector={sector} badgeAlliance={badgeAlliance} />
                ))}
            </main>
        </div>
    );
};
