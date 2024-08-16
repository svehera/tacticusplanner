import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import { sum } from 'lodash';

import { Conditional } from 'src/v2/components/conditional';

import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';
import { IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';

import { Loader } from 'src/v2/components/loader';
import { GlobalState } from 'src/models/global-state';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { StoreContext } from 'src/reducers/store.provider';
import { useGetGuildInsights } from 'src/v2/features/guild/guild.endpoint';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

export const GuildInsights = () => {
    const { viewPreferences, guild } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: CharactersFilterBy.None,
        orderBy: CharactersOrderBy.Faction,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);

    if (!guild.members.length) {
        return <div>Populate guild members</div>;
    }

    const { data, loading } = useGetGuildInsights({ members: guild.members });

    if (loading) {
        return <Loader loading={true} />;
    }

    if (!data) {
        return <div>Data failed to load</div>;
    }

    const averageCharacters = GlobalState.initCharacters(data.userData, data.guildUsers.length);
    const averageMows = GlobalState.initMows(data.mows, data.guildUsers.length);

    const charactersFiltered = CharactersService.filterUnits(
        [...averageCharacters, ...averageMows],
        viewControls.filterBy,
        nameFilter
    );
    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(charactersFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    const units = CharactersService.orderUnits(charactersFiltered, viewControls.orderBy);

    return (
        <Box style={{ margin: 'auto' }}>
            <p style={{ textAlign: 'center' }}>
                Guild averaged roster data for{' '}
                <AccessibleTooltip
                    title={
                        <ul style={{ paddingInlineStart: 20 }}>
                            {data.guildUsers.map(username => (
                                <li key={username}>{username}</li>
                            ))}
                        </ul>
                    }>
                    <b>{data.guildUsers.length}/30</b>
                </AccessibleTooltip>{' '}
                players
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
                <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter} />
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
