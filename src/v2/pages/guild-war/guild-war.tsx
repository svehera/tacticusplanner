import React, { useContext, useMemo, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { FlexBox } from 'src/v2/components/flex-box';
import { BattlefieldInfo } from 'src/v2/features/guild-war/battlefield-info';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { BfSectionSelect } from 'src/v2/features/guild-war/bf-section-select';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { Team } from 'src/v2/features/characters/components/team';
import { ICharacter2 } from 'src/models/interfaces';
import { Conditional } from 'src/v2/components/conditional';
import { CharacterItemDialog } from 'src/shared-components/character-item-dialog';
import { RarityImage } from 'src/v2/components/images/rarity-image';

export const GuildWar = () => {
    const { teams, characters, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openCharacterItemDialog, setOpenCharacterItemDialog] = React.useState(false);
    const [editedCharacter, setEditedCharacter] = React.useState<ICharacter2 | null>(null);

    const [teamPotential, setTeamPotential] = useState<number>(0);

    const updateBfLevel = (battlefieldLevel: number) => {
        dispatch.teams({ type: 'UpdateBfLevel', battlefieldLevel });
    };

    const updateBfSection = (sectionId: string) => {
        dispatch.teams({ type: 'UpdateBfSection', sectionId });
    };

    const startEditCharacter = (character: ICharacter2): void => {
        setEditedCharacter(character);
        setOpenCharacterItemDialog(true);
    };

    const endEditCharacter = (): void => {
        setEditedCharacter(null);
        setOpenCharacterItemDialog(false);
    };

    const rarityCaps = useMemo(() => {
        return GuildWarService.getRarityCaps(teams.guildWar.battlefieldLevel, teams.guildWar.sectionId);
    }, [teams.guildWar.sectionId, teams.guildWar.battlefieldLevel]);

    const renderTeams = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => (
            <Team
                key={i}
                teamName={`Team ${i + 1}`}
                characters={characters.slice(0, 2)}
                teamIcon={<RarityImage rarity={rarityCaps[i]} />}
            />
        ));
    }, [rarityCaps]);

    return (
        <FlexBox style={{ flexDirection: 'column', gap: 30 }}>
            <FlexBox gap={10}>
                <BattlefieldInfo />
                <BfLevelSelect value={teams.guildWar.battlefieldLevel} valueChange={updateBfLevel} />
                <BfSectionSelect
                    value={teams.guildWar.sectionId}
                    valueChange={updateBfSection}
                    potential={teamPotential}
                />
            </FlexBox>

            <CharactersViewContext.Provider
                value={{
                    showAbilities: viewPreferences.showAbilitiesLevel,
                    showBadges: viewPreferences.showBadges,
                    showPower: viewPreferences.showPower,
                    showBsValue: viewPreferences.showBsValue,
                    showCharacterLevel: viewPreferences.showCharacterLevel,
                    showCharacterRarity: viewPreferences.showCharacterRarity,
                    onCharacterClick: startEditCharacter,
                }}>
                <FlexBox wrap={true} gap={30}>
                    {renderTeams}
                </FlexBox>
            </CharactersViewContext.Provider>

            <Conditional condition={!!editedCharacter}>
                <CharacterItemDialog
                    character={editedCharacter!}
                    isOpen={openCharacterItemDialog}
                    onClose={endEditCharacter}
                />
            </Conditional>
        </FlexBox>
    );
};
