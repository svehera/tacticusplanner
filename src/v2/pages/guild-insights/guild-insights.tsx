import Box from '@mui/material/Box';
import { sum } from 'lodash';
import React, { useContext, useState } from 'react';

import { GlobalState } from 'src/models/global-state';
import { StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';

import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';
import { CharactersPowerService, CharactersValueService } from '@/fsd/4-entities/unit';

import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { useGetGuildInsights } from 'src/v2/features/guild/guild.endpoint';

export const GuildInsights = () => {
    const { viewPreferences, guild } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
        filterBy: CharactersFilterBy.None,
        orderBy: CharactersOrderBy.Faction,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);

    const { data, loading } = useGetGuildInsights({ members: guild.members });

    if (!guild.members.length) {
        return <div>Populate guild members</div>;
    }

    if (loading) {
        return <LoaderWithText loading={true} />;
    }

    if (!data) {
        return <div>Data failed to load</div>;
    }

    const averageCharacters = GlobalState.initCharacters(data.userData, data.guildUsers.length);
    const unresolvedAverageMows = GlobalState.initMows(data.mows, data.guildUsers.length);

    const resolvedAverageMows = unresolvedAverageMows.map(mow => {
        if ('snowprintId' in mow) return mow;
        return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
    });

    const charactersFiltered = CharactersService.filterUnits(
        [...averageCharacters, ...resolvedAverageMows],
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
                <CharactersViewControls viewControls={viewControls} viewControlsChanges={setViewControls} />

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
