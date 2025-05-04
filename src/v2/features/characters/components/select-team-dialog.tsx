import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { ICharacter2 } from 'src/models/interfaces';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';

import { Rarity } from '@/fsd/5-shared/model';
import { FlexBox, Conditional } from '@/fsd/5-shared/ui';

import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';
import { unsetCharacter } from 'src/v2/features/characters/characters.contants';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';

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

    const handleCharacterSelect = (character: IUnit) => {
        setLineup(curr => {
            if (curr.some(x => x.name === character.name)) {
                return curr.filter(x => x.name !== character.name);
            } else {
                if (lineup.length === size) {
                    return curr;
                }

                const newChar = characters.find(x => x.name === character.id);

                if (newChar) {
                    return [...curr, newChar];
                }

                return curr;
            }
        });
    };

    const currentTeam = useMemo(() => {
        return Array.from({ length: size }, (_, i) => {
            const char = lineup[i];

            if (char) {
                return (
                    <CharacterTile
                        key={char.name}
                        character={CharactersService.capCharacterAtRarity(char, rarityCap)}
                        onCharacterClick={handleCharacterSelect}
                    />
                );
            }

            return <CharacterTile key={fallbackCharacter.name + i} character={fallbackCharacter} />;
        });
    }, [lineup, rarityCap]);

    return (
        <Dialog open={isOpen} onClose={() => onClose()} fullScreen={isMobile} fullWidth>
            <DialogTitle>
                Edit team
                <Conditional condition={allowPropsEdit}>
                    <FlexBox gap={10} style={{ marginTop: 20 }}>
                        <TextField
                            style={{ minWidth: '50%' }}
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
                <FlexBox>{currentTeam}</FlexBox>
            </DialogTitle>
            <DialogContent>
                <CharactersViewContext.Provider
                    value={{
                        ...charactersViewContext,
                        getOpacity: character =>
                            lineup.some(x => x.name === character.name) ||
                            blockedCharacters.some(x => x === character.name)
                                ? 0.5
                                : 1,
                    }}>
                    <CharactersGrid
                        characters={characters.map(x => CharactersService.capCharacterAtRarity(x, rarityCap))}
                        blockedCharacters={blockedCharacters}
                        onAvailableCharacterClick={handleCharacterSelect}
                        onLockedCharacterClick={handleCharacterSelect}
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
