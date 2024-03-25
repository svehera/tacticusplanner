import React, { useContext, useMemo, useState } from 'react';

import { isMobile } from 'react-device-detect';

import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { ICharacter2 } from 'src/models/interfaces';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { unsetCharacter } from 'src/v2/features/characters/characters.contants';
import { FlexBox } from 'src/v2/components/flex-box';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { Rarity } from 'src/models/enums';
import { Conditional } from 'src/v2/components/conditional';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { CharactersService } from 'src/v2/features/characters/characters.service';

type Props = {
    teamName: string;
    isOpen: boolean;
    characters: ICharacter2[];
    blockedCharacters: string[];
    team: ICharacter2[];
    rarityCap: Rarity;
    onClose: (team?: ICharacter2[], rarityCap?: Rarity, teamName?: string) => void;
    size?: 5 | 7;
    allowPropsEdit?: boolean;
};

export const SelectTeamDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    team,
    characters,
    size = 5,
    teamName: defaultTeamName,
    rarityCap: defaultRarityCap,
    blockedCharacters,
    allowPropsEdit = false,
}) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;
    const charactersViewContext = useContext(CharactersViewContext);
    const [lineup, setLineup] = useState(team);

    const [rarityCap, setRarityCap] = useState(defaultRarityCap);
    const [teamName, setTeamName] = useState(defaultTeamName);

    const currentTeam = useMemo(() => {
        return Array.from({ length: size }, (_, i) => {
            const char = lineup[i];

            if (char) {
                return (
                    <CharacterTile
                        key={char.name}
                        character={CharactersService.capCharacterAtRarity(char, rarityCap)}
                    />
                );
            }

            return <CharacterTile key={fallbackCharacter.name + i} character={fallbackCharacter} disableClick />;
        });
    }, [lineup, rarityCap]);

    const handleCharacterSelect = (character: ICharacter2) => {
        if (blockedCharacters.includes(character.name)) {
            return;
        }

        setLineup(curr => {
            if (curr.some(x => x.name === character.name)) {
                return curr.filter(x => x.name !== character.name);
            } else {
                if (lineup.length === size) {
                    return curr;
                }

                const newChar = characters.find(x => x.name === character.name);

                if (newChar) {
                    return [...curr, newChar];
                }

                return curr;
            }
        });
    };

    return (
        <Dialog open={isOpen} onClose={() => onClose()} fullScreen={isMobile} fullWidth>
            <DialogTitle>
                Edit team
                <Conditional condition={allowPropsEdit}>
                    <FlexBox gap={10} style={{ marginTop: 20 }}>
                        <TextField
                            style={{ width: '50%' }}
                            label="Team name"
                            variant="outlined"
                            value={teamName}
                            onChange={event => setTeamName(event.target.value)}
                        />
                        <RaritySelect
                            label={'Rarity Cap'}
                            rarityValues={getEnumValues(Rarity)}
                            value={rarityCap}
                            valueChanges={setRarityCap}
                        />
                    </FlexBox>
                </Conditional>
                <CharactersViewContext.Provider
                    value={{
                        ...charactersViewContext,
                        onCharacterClick: handleCharacterSelect,
                    }}>
                    <FlexBox>{currentTeam}</FlexBox>
                </CharactersViewContext.Provider>
            </DialogTitle>
            <DialogContent>
                <CharactersViewContext.Provider
                    value={{
                        ...charactersViewContext,
                        onCharacterClick: handleCharacterSelect,
                        getOpacity: character =>
                            lineup.some(x => x.name === character.name) ||
                            blockedCharacters.some(x => x === character.name)
                                ? 0.5
                                : 1,
                    }}>
                    <CharactersGrid
                        characters={characters.map(x => CharactersService.capCharacterAtRarity(x, rarityCap))}
                        blockedCharacters={blockedCharacters}
                    />
                </CharactersViewContext.Provider>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button onClick={() => onClose(lineup, rarityCap, teamName)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
