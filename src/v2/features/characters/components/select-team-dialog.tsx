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
import { Rarity } from 'src/models/enums';
import { Conditional } from 'src/v2/components/conditional';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { getEnumValues } from 'src/shared-logic/functions';
import { RarityImage } from 'src/v2/components/images/rarity-image';

type Props = {
    teamName: string;
    isOpen: boolean;
    characters: ICharacter2[];
    team: ICharacter2[];
    rarityCap: Rarity;
    onClose: (team?: ICharacter2[], rarityCap?: Rarity) => void;
    size?: 5 | 7;
    allowRarityCapEdit?: boolean;
};

export const SelectTeamDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    team,
    characters,
    size = 5,
    teamName,
    rarityCap: defaultRarityCap,
    allowRarityCapEdit = false,
}) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;
    const charactersViewContext = useContext(CharactersViewContext);
    const [lineup, setLineup] = useState(team);
    const [rarityCap, setRarityCap] = useState(defaultRarityCap);

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
                    Select lineup for <RarityImage rarity={rarityCap} /> {teamName} <FlexBox>{currentTeam}</FlexBox>
                </CharactersViewContext.Provider>
                <Conditional condition={allowRarityCapEdit}>
                    <RaritySelect
                        label={'Rarity Cap'}
                        rarityValues={getEnumValues(Rarity)}
                        value={rarityCap}
                        valueChanges={setRarityCap}
                    />
                </Conditional>
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
                <Button onClick={() => onClose(lineup, rarityCap)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
