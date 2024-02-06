﻿import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { sum } from 'lodash';

import { Conditional } from 'src/v2/components/conditional';

import { useGetInsights } from 'src/v2/features/insights/insights.endpoint';

import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';

import { Loader } from 'src/v2/components/loader';
import { GlobalState } from 'src/models/global-state';

export const Insights = () => {
    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: CharactersFilterBy.None,
        orderBy: CharactersOrderBy.Faction,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);
    const { data, loading } = useGetInsights();

    if (loading) {
        return <Loader loading={true} />;
    }

    if (!data) {
        return <div>Data failed to load</div>;
    }

    if (!data.averageRosterDataCreationTime) {
        return (
            <Box style={{ margin: 'auto' }}>
                <p>
                    Registered users: <b>{data.registeredUsers}</b>{' '}
                </p>
                <p>
                    Active users last 30 days: <b>{data.activeLast30Days}</b>{' '}
                </p>
                <p>
                    Active users last 7 days: <b>{data.activeLast7Days}</b>{' '}
                </p>
            </Box>
        );
    }

    const averageRoster = GlobalState.initCharacters(data.userData, data.activeLast30Days);

    const charactersFiltered = CharactersService.filterCharacters(averageRoster, viewControls.filterBy, nameFilter);
    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));

    const factions = CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    const characters = CharactersService.orderCharacters(charactersFiltered, viewControls.orderBy);

    return (
        <Box style={{ margin: 'auto' }}>
            <p>
                Registered users: <b>{data.registeredUsers}</b>
            </p>
            <p>
                Active users last 30 days: <b>{data.activeLast30Days}</b>
            </p>
            <p>
                Active users last 7 days: <b>{data.activeLast7Days}</b>
            </p>
            <p style={{ textAlign: 'center' }}>
                Averaged roster data. Last updated on{' '}
                <b>{new Date(data.averageRosterDataCreationTime).toDateString()}</b>
            </p>

            <RosterHeader totalPower={totalPower} filterChanges={setNameFilter} />
            <ViewControls viewControls={viewControls} viewControlsChanges={setViewControls} />

            <Conditional condition={isFactionsView(viewControls.orderBy)}>
                <FactionsGrid factions={factions} />
            </Conditional>

            <Conditional condition={isCharactersView(viewControls.orderBy)}>
                <CharactersGrid characters={characters} />
            </Conditional>
        </Box>
    );
};
