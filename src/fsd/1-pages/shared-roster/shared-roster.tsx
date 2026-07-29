/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import Box from '@mui/material/Box';
import { sum } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { LoaderWithText, Conditional } from '@/fsd/5-shared/ui';

import { CharactersFilterBy } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow/mows.service';
import { CharactersPowerService, CharactersValueService } from '@/fsd/4-entities/unit';

import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';
import { IMow2, IUnit } from '@/fsd/3-features/characters/characters.models';
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
import { CharactersGrid } from '@/fsd/3-features/characters/components/characters-grid';
import { FactionsGrid } from '@/fsd/3-features/characters/components/factions-grid';
import { RosterHeader } from '@/fsd/3-features/characters/components/roster-header';
import { TeamGraph } from '@/fsd/3-features/characters/components/team-graph';
import { isCharactersView } from '@/fsd/3-features/characters/functions/is-characters-view';
import { isFactionsView } from '@/fsd/3-features/characters/functions/is-factions-view';
import { useGetSharedRoster } from '@/fsd/3-features/share/share-roster.endpoints';
import { CharactersViewControls, ICharactersViewControls } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';

export const SharedRoster = () => {
    const { viewPreferences, teams2 } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const [viewControls, setViewControls] = useState<ICharactersViewControls>({
        filterBy: viewPreferences.sharedRosterFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string>();

    const [searchParams] = useSearchParams();

    const updateViewControls = useCallback(
        (value: ICharactersViewControls) => {
            setViewControls(value);
            dispatch.viewPreferences({ type: 'Update', setting: 'sharedRosterFilter', value: value.filterBy });
        },
        [dispatch]
    );

    useEffect(() => {
        if (typeof viewControls.filterBy === 'string' && !teams2.some(team => team.name === viewControls.filterBy)) {
            setViewControls(current => ({ ...current, filterBy: CharactersFilterBy.None }));
            dispatch.viewPreferences({ type: 'Update', setting: 'sharedRosterFilter', value: CharactersFilterBy.None });
        }
    }, [teams2, viewControls.filterBy, dispatch]);

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasValidParameters = !!sharedUser && !!shareToken;

    if (!hasValidParameters) {
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

    const charactersFiltered = CharactersService.filterUnits(sharedRoster, viewControls.filterBy, nameFilter, teams2);
    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(charactersFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    const characters = CharactersService.orderUnits(charactersFiltered, viewControls.orderBy);

    return (
        <Box className="m-auto">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <h3 className="text-center">{sharedUser}'s Roster</h3>
            <RosterSnapshotsAssetsProvider>
                <CharactersViewContext.Provider
                    value={{
                        showAbilitiesLevel: viewPreferences.showAbilitiesLevel,
                        showBadges: viewPreferences.showBadges,
                        showPower: viewPreferences.showPower,
                        showBsValue: viewPreferences.showBsValue,
                        showEquipment: viewPreferences.showEquipment,
                        showCharacterLevel: viewPreferences.showCharacterLevel,
                        showCharacterRarity: viewPreferences.showCharacterRarity,
                    }}>
                    <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                        <TeamGraph units={charactersFiltered} />
                    </RosterHeader>
                    <CharactersViewControls
                        viewControls={viewControls}
                        viewControlsChanges={updateViewControls}
                        teams={teams2}
                    />

                    <Conditional condition={isFactionsView(viewControls.orderBy)}>
                        <FactionsGrid factions={factions} />
                    </Conditional>

                    <Conditional condition={isCharactersView(viewControls.orderBy)}>
                        <CharactersGrid characters={characters} />
                    </Conditional>
                </CharactersViewContext.Provider>
            </RosterSnapshotsAssetsProvider>
        </Box>
    );
};
