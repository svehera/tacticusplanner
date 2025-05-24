import Box from '@mui/material/Box';
import { sum } from 'lodash';
import React, { useContext, useState } from 'react';

import { GlobalState } from 'src/models/global-state';
import { StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, Conditional } from '@/fsd/5-shared/ui';

import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';
import { CharactersValueService } from '@/fsd/4-entities/unit/characters-value.service';

import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { useGetInsights } from 'src/v2/features/insights/insights.endpoint';

export const Insights = () => {
    const { viewPreferences } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: CharactersFilterBy.None,
        orderBy: CharactersOrderBy.Faction,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);
    const { data, loading } = useGetInsights();

    if (loading) {
        return <LoaderWithText loading={true} />;
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
                    Tacticus API integrations: <b>{data.tacticusIntegrations}</b>{' '}
                </p>
                <p>
                    Active users last 30 days: <b>{data.activeLast30Days}</b>{' '}
                </p>
                <p>
                    Active users last 7 days: <b>{data.activeLast7Days}</b>{' '}
                </p>
                <p style={{ textAlign: 'center' }}>Averaged roster data is missing. Something went wrong</p>
            </Box>
        );
    }

    const averageCharacters = GlobalState.initCharacters(data.userData, data.activeLast30Days);
    const averageMows = GlobalState.initMows(data.mows, data.activeLast30Days);

    const unitsFiltered = CharactersService.filterUnits(
        [...averageCharacters, ...averageMows],
        viewControls.filterBy,
        nameFilter
    );
    const totalPower = sum(unitsFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(unitsFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = CharactersService.orderByFaction(unitsFiltered, viewControls.orderBy);
    const units = CharactersService.orderUnits(unitsFiltered, viewControls.orderBy);

    return (
        <Box style={{ margin: 'auto' }}>
            <p>
                Registered users: <b>{data.registeredUsers}</b>
            </p>
            <p>
                Tacticus API integrations: <b>{data.tacticusIntegrations}</b>
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

            <CharactersViewContext.Provider
                value={{
                    showAbilitiesLevel: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                }}>
                <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                    <TeamGraph units={unitsFiltered} />
                </RosterHeader>
                <ViewControls viewControls={viewControls} viewControlsChanges={setViewControls} />

                <Conditional condition={isFactionsView(viewControls.orderBy)}>
                    <FactionsGrid factions={factions} />
                </Conditional>

                <Conditional condition={isCharactersView(viewControls.orderBy)}>
                    <CharactersGrid characters={units} />
                </Conditional>
            </CharactersViewContext.Provider>
        </Box>
    );
};
