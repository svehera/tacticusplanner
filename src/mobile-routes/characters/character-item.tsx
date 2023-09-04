import React, { useMemo, useState } from 'react';
import { PersonalDataService } from '../../services';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharacterDetails } from './character-details';
import { ICharacter } from '../../models/interfaces';
import { getCharName } from '../../shared-logic/functions';

export const CharacterItem = (props: { character: ICharacter }) => {
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
