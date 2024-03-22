import React, { useContext, useMemo, useState } from 'react';

import { isMobile } from 'react-device-detect';

import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { ICharacter2 } from 'src/models/interfaces';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { unsetCharacter } from 'src/v2/features/characters/characters.contants';
import { FlexBox } from 'src/v2/components/flex-box';
import { CharactersGrid } from 'src/v2/features/characters/components/characters-grid';
import { CharactersViewContext } from 'src/v2/features/characters/characters-view.context';

type Props = {
    isOpen: boolean;
    characters: ICharacter2[];
    team: ICharacter2[];
    onClose: (team?: ICharacter2[]) => void;
    size?: 5 | 7;
};

export const SelectTeamDialog: React.FC<Props> = ({ isOpen, onClose, team, characters, size = 5 }) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;
    const charactersViewContext = useContext(CharactersViewContext);
    const [lineup, setLineup] = useState(team);

    const currentTeam = useMemo(() => {
        return Array.from({ length: size }, (_, i) => {
            const char = lineup[i];

            if (char) {
                return <CharacterTile key={char.name} character={char} />;
            }

            return <CharacterTile key={fallbackCharacter.name + i} character={fallbackCharacter} disableClick />;
        });
    }, [lineup]);

    const handleCharacterSelect = (character: ICharacter2) => {
        setLineup(curr => {
            if (curr.some(x => x.name === character.name)) {
                return curr.filter(x => x.name !== character.name);
            } else {
                if (lineup.length === size) {
                    return curr;
                }

                return [...curr, character];
            }
        });
    };

    return (
        <Dialog open={isOpen} onClose={() => onClose()} fullScreen={isMobile} fullWidth>
            <DialogTitle>
                <CharactersViewContext.Provider
                    value={{
                        ...charactersViewContext,
                        onCharacterClick: handleCharacterSelect,
                    }}>
                    Select lineup <FlexBox>{currentTeam}</FlexBox>
                </CharactersViewContext.Provider>
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20 }}>
                <CharactersViewContext.Provider
                    value={{
                        ...charactersViewContext,
                        onCharacterClick: handleCharacterSelect,
                        getOpacity: character => (lineup.some(x => x.name === character.name) ? 0.5 : 1),
                    }}>
                    <CharactersGrid characters={characters} />
                </CharactersViewContext.Provider>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Button onClick={() => onClose(lineup)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
