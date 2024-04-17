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
import { TeamGraph } from 'src/v2/features/characters/components/team-graph';

import { ShareRoster } from 'src/v2/features/share/share-roster';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { ICharacter2 } from 'src/models/interfaces';
import { useAuth } from 'src/contexts/auth';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';

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

    /*     const teamData = charactersFiltered.map(character => ({
        x: character.name,
        y: CharactersPowerService.getCharacterPower(character),
    }));
    teamData.sort((a, b) => b.y - a.y);
    const teamAttributeData = charactersFiltered.map(character => ({
        x: character.name,
        y: CharactersPowerService.getCharacterAttributePower(character),
    }));
    const teamAbilityData = charactersFiltered.map(character => ({
        x: character.name,
        y: CharactersPowerService.getCharacterAbilityPower(character),
    })); */

    // Create arrays to store data
    const teamPowerData: { x: string; y: number }[] = [];
    const teamAttributeData: { x: string; y: number }[] = [];
    const teamAbilityData: { x: string; y: number }[] = [];

    // Populate arrays
    charactersFiltered.forEach(character => {
        const power = CharactersPowerService.getCharacterPower(character);
        const attributePower = CharactersPowerService.getCharacterAttributePower(character);
        const abilityPower = CharactersPowerService.getCharacterAbilityPower(character);

        teamPowerData.push({ x: character.name, y: power });
        teamAttributeData.push({ x: character.name, y: attributePower });
        teamAbilityData.push({ x: character.name, y: abilityPower });
    });

    // Define sorting function
    const sortByPower = (a: { x: string; y: number }, b: { x: string; y: number }) => b.y - a.y;

    // Sort teamData based on power
    teamPowerData.sort(sortByPower);

    // Apply the same sorting order to teamAttributeData and teamAbilityData
    teamAttributeData.sort((a, b) => {
        const aIndex = teamPowerData.findIndex(item => item.x === a.x);
        const bIndex = teamPowerData.findIndex(item => item.x === b.x);
        return sortByPower(teamPowerData[aIndex], teamPowerData[bIndex]);
    });

    teamAbilityData.sort((a, b) => {
        const aIndex = teamPowerData.findIndex(item => item.x === a.x);
        const bIndex = teamPowerData.findIndex(item => item.x === b.x);
        return sortByPower(teamPowerData[aIndex], teamPowerData[bIndex]);
    });

    return (
        <Box style={{ margin: 'auto' }}>
            <CharactersViewContext.Provider
                value={{
                    showAbilities: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                }}>
                <RosterHeader totalValue={totalValue} totalPower={totalPower} filterChanges={setNameFilter}>
                    {!!isLoggedIn && <ShareRoster isRosterShared={!!isRosterShared} />}
                </RosterHeader>
                <ViewControls viewControls={viewControls} viewControlsChanges={updatePreferences} />

                <Conditional condition={isFactionsView(viewControls.orderBy)}>
                    <FactionsGrid factions={factions} onCharacterClick={startEditCharacter} />
                </Conditional>

                <Conditional condition={isCharactersView(viewControls.orderBy)}>
                    <CharactersGrid
                        characters={characters}
                        onAvailableCharacterClick={startEditCharacter}
                        onLockedCharacterClick={startEditCharacter}
                    />
                </Conditional>

                <Conditional condition={!!editedCharacter}>
                    <CharacterItemDialog
                        character={editedCharacter!}
                        isOpen={openCharacterItemDialog}
                        onClose={endEditCharacter}
                    />
                </Conditional>
                <h1>Team Insights</h1>
                <span style={{ fontSize: 10 }}>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    <p>
                        This is a visualization of each character&apos;s power level, with your strongest character on
                        the left side and weakest (locked) characters on the right side. The height of each bar is the
                        power of a single character, so the size of the colored area represents your team&apos;s overall
                        strength.
                    </p>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    <p>
                        The darker colored section is power contributed by a character&apos;s attributes (armor, damage,
                        and health), the lighter colored section by abilities (active and passive).
                    </p>
                </span>
                <TeamGraph
                    data={[
                        { id: 'Attribute', data: teamAttributeData },
                        { id: 'Ability', data: teamAbilityData },
                    ]}
                />
            </CharactersViewContext.Provider>
        </Box>
    );
};
