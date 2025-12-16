import Box from '@mui/material/Box';
import { sum } from 'lodash';
import { useContext, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GlobalState } from 'src/models/global-state';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, Conditional } from '@/fsd/5-shared/ui';

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
import { TeamGraph } from '@/fsd/3-features/characters/components/team-graph';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharactersView } from '@/fsd/3-features/characters/functions/is-characters-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isFactionsView } from '@/fsd/3-features/characters/functions/is-factions-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { useGetInsights } from '@/fsd/3-features/insights/insights.endpoint';
import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';

export const Insights = () => {
    const { viewPreferences } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
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
            <Box className="m-auto">
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
                <p className="text-center">Averaged roster data is missing. Something went wrong</p>
            </Box>
        );
    }

    const averageCharacters = GlobalState.initCharacters(data.userData, data.activeLast30Days);
    const unresolvedAverageMows = GlobalState.initMows(data.mows, data.activeLast30Days);
    const averageMows = unresolvedAverageMows.map(mow => {
        if ('snowprintId' in mow) return mow;
        return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow };
    }) as IMow2[];

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
        <Box className="m-auto">
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
            <p className="text-center">
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
