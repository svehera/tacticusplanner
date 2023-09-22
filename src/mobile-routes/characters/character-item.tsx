import React, { useState } from 'react';
import { PersonalDataService, usePersonalData } from '../../services';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CharacterDetails } from './character-details';
import { ICharacter } from '../../models/interfaces';
import { getCharName } from '../../shared-logic/functions';

export const CharacterItem = (props: { character: ICharacter }) => {
    const { addOrUpdateCharacterData } = usePersonalData();
    const [charName, setCharName] = useState<string>(getCharName(props.character));

    const handleCharacterChange = (character: ICharacter) => {
        addOrUpdateCharacterData(character);
        PersonalDataService.save();
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
