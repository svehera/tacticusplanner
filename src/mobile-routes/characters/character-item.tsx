import React, { useMemo, useState } from 'react';
import { PersonalDataService } from '../../services';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharacterDetails } from './character-details';
import { ICharacter } from '../../models/interfaces';
import { Rank, Rarity } from '../../models/enums';
import { pooEmoji, starEmoji } from '../../models/constants';

export const CharacterItem = (props: { character: ICharacter }) => {
    const getCharName = (character: ICharacter) => {
        if (!character.unlocked) {
            return character.name;
        } else {
            const rarity = Rarity[character.rarity];
            const rank = Rank[character.rank];
            const emoji = character.alwaysRecommend ? starEmoji : character.neverRecommend ? pooEmoji : '';
            return `${character.name} (${rarity} ${rank}) ${emoji}`;
        }
    };
    
    const [charName, setCharName] = useState<string>(getCharName(props.character));
    
    
    const handleCharacterChange = (character: ICharacter) => {
        PersonalDataService.saveCharacterChanges(character);
        setCharName(getCharName(character));
    };

    return (
        <Accordion TransitionProps={{ unmountOnExit: true }}>
            <AccordionSummary expandIcon={
                <ExpandMoreIcon/>}>{charName}</AccordionSummary>
            <AccordionDetails>
                <CharacterDetails character={props.character} characterChanges={handleCharacterChange}/>
            </AccordionDetails>
        </Accordion>
    );
};
