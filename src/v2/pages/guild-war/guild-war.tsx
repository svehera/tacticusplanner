import React, { useContext, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { FlexBox } from 'src/v2/components/flex-box';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { BfSectionSelect } from 'src/v2/features/guild-war/bf-section-select';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { Team } from 'src/v2/features/characters/components/team';

export const GuildWar = () => {
    const { teams, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [section, setSection] = useState<string>(
        teams.guildWar.teams[0]?.sectionId ?? GuildWarService.defaultSection
    );

    const [teamPotential, setTeamPotential] = useState<number>(0);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.teams({ type: 'UpdateBfLevel', battlefieldLevel });
    };

    return (
        <div>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={teams.guildWar.battlefieldLevel} valueChange={updateBfLevel} />
                <BfSectionSelect value={section} valueChange={setSection} potential={teamPotential} />
            </FlexBox>

            <CharactersViewContext.Provider
                value={{
                    showAbilities: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                }}>
                <Team size={5} characters={characters.slice(0, 2)} />
                <Team size={5} characters={characters.slice(0, 2)} />
                <Team size={5} characters={characters.slice(0, 2)} />
                <Team size={5} characters={characters.slice(0, 2)} />
                <Team size={5} characters={characters.slice(0, 2)} />
            </CharactersViewContext.Provider>
        </div>
    );
};
