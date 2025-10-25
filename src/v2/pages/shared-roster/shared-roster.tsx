import Box from '@mui/material/Box';
import { sum } from 'lodash';
import { useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, Conditional } from '@/fsd/5-shared/ui';

import { MowsService } from '@/fsd/4-entities/mow/mows.service';
import { CharactersPowerService, CharactersValueService } from '@/fsd/4-entities/unit';

import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { IMow2, IUnit } from 'src/v2/features/characters/characters.models';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { useGetSharedRoster } from 'src/v2/features/share/share-roster.endpoints';

export const SharedRoster = () => {
    const { viewPreferences } = useContext(StoreContext);
    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
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

    // eslint-disable-next-line react-compiler/react-compiler
    const { data, loading, error } = useGetSharedRoster(sharedUser, shareToken);

    if (loading) {
        return <LoaderWithText loading={true} />;
    }

    if (error) {
        return <div>Oops! It seems like {sharedUser} doesn&apos;t exist or has roster sharing disabled.</div>;
    }

    if (!data) {
        return <div>Failed to fetch shared roster. Try again later.</div>;
    }

    const resolvedMows = MowsService.resolveAllFromStorage(
        GlobalState.initMows(data.mows).map(mow => {
            if ('snowprintId' in mow) return mow;
            return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
        }) as IMow2[]
    );

    const sharedRoster: IUnit[] = [...GlobalState.initCharacters(data.characters), ...resolvedMows];

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
                <CharactersViewControls viewControls={viewControls} viewControlsChanges={setViewControls} />

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
