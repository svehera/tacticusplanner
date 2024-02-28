import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { isMobile } from 'react-device-detect';
import { sum } from 'lodash';

import { Conditional } from 'src/v2/components/conditional';

import { FactionsGrid } from 'src/v2/features/characters/components/factions-grid';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { ViewControls } from 'src/v2/features/characters/components/view-controls';
import { RosterHeader } from 'src/v2/features/characters/components/roster-header';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';
import { IViewControls } from 'src/v2/features/characters/characters.models';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { isFactionsView } from 'src/v2/features/characters/functions/is-factions-view';
import { isCharactersView } from 'src/v2/features/characters/functions/is-characters-view';

import { ShareRoster } from 'src/v2/features/share/share-roster';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { ICharacter2 } from 'src/models/interfaces';
import { useAuth } from 'src/contexts/auth';

export const WhoYouOwn = () => {
    const { characters: charactersDefault, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const navigate = useNavigate();

    const { token: isLoggedIn, shareToken: isRosterShared } = useAuth();

    const [viewControls, setViewControls] = useState<IViewControls>({
        filterBy: viewPreferences.wyoFilter,
        orderBy: viewPreferences.wyoOrder,
    });
    const [nameFilter, setNameFilter] = useState<string | null>(null);
    const [openCharacterItemDialog, setOpenCharacterItemDialog] = React.useState(false);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const hasShareParams = !!sharedUser && !!shareToken;

    if (hasShareParams) {
        useEffect(() => {
            navigate((isMobile ? '/mobile' : '') + `/sharedRoster?username=${sharedUser}&shareToken=${shareToken}`);
        }, []);
        return <></>;
    }

    const charactersFiltered = CharactersService.filterCharacters(charactersDefault, viewControls.filterBy, nameFilter);
    const totalPower = sum(charactersFiltered.map(character => CharactersPowerService.getCharacterPower(character)));
    const totalValue = sum(charactersFiltered.map(character => CharactersValueService.getCharacterValue(character)));

    const factions = CharactersService.orderByFaction(charactersFiltered, viewControls.orderBy);
    const characters = CharactersService.orderCharacters(charactersFiltered, viewControls.orderBy);

    const updatePreferences = (value: IViewControls) => {
        setViewControls(value);
        dispatch.viewPreferences({ type: 'Update', setting: 'wyoOrder', value: value.orderBy });
        dispatch.viewPreferences({ type: 'Update', setting: 'wyoFilter', value: value.filterBy });
    };

    const startEditCharacter = (character: ICharacter2): void => {
        setEditedCharacter(character);
        setOpenCharacterItemDialog(true);
    };

    const endEditCharacter = (): void => {
        setEditedCharacter(null);
        setOpenCharacterItemDialog(false);
    };

    return (
        <Box style={{ margin: 'auto' }}>
            <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                {!!isLoggedIn && <ShareRoster isRosterShared={!!isRosterShared} />}
            </RosterHeader>
            <ViewControls viewControls={viewControls} viewControlsChanges={updatePreferences} />

            <Conditional condition={isFactionsView(viewControls.orderBy)}>
                <FactionsGrid factions={factions} onCharacterClick={startEditCharacter} />
            </Conditional>

            <Conditional condition={isCharactersView(viewControls.orderBy)}>
                <CharactersGrid characters={characters} onCharacterClick={startEditCharacter} />
            </Conditional>

            <Conditional condition={!!editedCharacter}>
                <CharacterItemDialog
                    character={editedCharacter!}
                    isOpen={openCharacterItemDialog}
                    onClose={endEditCharacter}
                />
            </Conditional>
        </Box>
    );
};
