import { Tab, Tabs } from '@mui/material';
import { useLayoutEffect, SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { OnslaughtLevelTab } from './onslaught-level.tab';
import { OnslaughtSectorTab } from './onslaught-sector.tab';

const validTabs = ['sectors', 'levels'] as const;

export const Onslaught = () => {
    const [queryParams, setQueryParams] = useSearchParams({ tab: 'sectors' });

    useLayoutEffect(() => {
        const currentTab = queryParams.get('tab');
        if (!currentTab || !validTabs.includes(currentTab as (typeof validTabs)[number])) {
            setQueryParams(new URLSearchParams({ tab: 'sectors' }));
        }
    }, [queryParams, setQueryParams]);

    const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
        if (!validTabs.includes(newValue as (typeof validTabs)[number])) return;
        setQueryParams(new URLSearchParams({ tab: newValue }));
    };

    return (
        <>
            <Tabs value={queryParams.get('tab')} onChange={handleTabChange}>
                {validTabs.map(tab => (
                    <Tab key={tab} label={tab.charAt(0).toUpperCase() + tab.slice(1)} value={tab} />
                ))}
            </Tabs>
            <div role="tabpanel" hidden={queryParams.get('tab') !== 'sectors'}>
                <OnslaughtSectorTab />
            </div>
            <div role="tabpanel" hidden={queryParams.get('tab') !== 'levels'}>
                <OnslaughtLevelTab />
            </div>
        </>
    );
};
