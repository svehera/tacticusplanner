import Box from '@mui/material/Box';
import { sum } from 'lodash';
import { useContext, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GlobalState } from 'src/models/global-state';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';

import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
// eslint-disable-next-line boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';
import { CharactersPowerService, CharactersValueService } from '@/fsd/4-entities/unit';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersGrid } from '@/fsd/3-features/characters/components/characters-grid';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { FactionsGrid } from '@/fsd/3-features/characters/components/factions-grid';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RosterHeader } from '@/fsd/3-features/characters/components/roster-header';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharactersView } from '@/fsd/3-features/characters/functions/is-characters-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isFactionsView } from '@/fsd/3-features/characters/functions/is-factions-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { useGetGuildInsights } from '@/fsd/3-features/guild/guild.endpoint';
import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';

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
    }) as IMow2[];

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
        <Box className="m-auto">
            <p className="text-center">
                Guild averaged roster data for{' '}
                <AccessibleTooltip
                    title={
                        <ul className="ps-5">
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
