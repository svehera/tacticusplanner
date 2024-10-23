import React, { useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { sum } from 'lodash';

import { Conditional } from 'src/v2/components/conditional';
import { Loader } from 'src/v2/components/loader';

import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';
import { IUnit, IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';

import { useGetSharedRoster } from 'src/v2/features/share/share-roster.endpoints';

import { StoreContext } from 'src/reducers/store.provider';
import { GlobalState } from 'src/models/global-state';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';

export const SharedRoster = () => {
    const { viewPreferences } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: viewPreferences.wyoFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasValidParams = !!sharedUser && !!shareToken;
    if (!hasValidParams) {
        return <>Invalid page params</>;
    }

    const { data, loading, error } = useGetSharedRoster(sharedUser, shareToken);

    if (loading) {
        return <Loader loading={true} />;
    }

    if (error) {
        return <div>Oops! It seems like {sharedUser} doesn&apos;t exist or has roster sharing disabled.</div>;
    }

    if (!data) {
        return <div>Failed to fetch shared roster. Try again later.</div>;
    }

    const sharedRoster: IUnit[] = [...GlobalState.initCharacters(data.characters), ...GlobalState.initMows(data.mows)];

    const charactersFiltered = CharactersService.filterUnits(sharedRoster, viewControls.filterBy, nameFilter);
    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(charactersFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    const characters = CharactersService.orderUnits(charactersFiltered, viewControls.orderBy);

    return (
        <Box style={{ margin: 'auto' }}>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <h3 style={{ textAlign: 'center' }}>{sharedUser}'s Roster</h3>
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
                    <TeamGraph units={charactersFiltered} />
                </RosterHeader>
                <ViewControls viewControls={viewControls} viewControlsChanges={setViewControls} />

                <Conditional condition={isFactionsView(viewControls.orderBy)}>
                    <FactionsGrid factions={factions} />
                </Conditional>

                <Conditional condition={isCharactersView(viewControls.orderBy)}>
                    <CharactersGrid characters={characters} />
                </Conditional>
            </CharactersViewContext.Provider>
        </Box>
    );
};
