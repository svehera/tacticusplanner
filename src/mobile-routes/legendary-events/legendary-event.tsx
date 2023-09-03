import React from 'react';
import Box from '@mui/material/Box';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const LegendaryEvent = (props: { legendaryEvent: ILegendaryEvent}) => {
    return (
        <Box sx={{ maxWidth: 600, bgcolor: 'background.paper' }}>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.alphaTrack.name}</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack track={props.legendaryEvent.alphaTrack}/>
                </AccordionDetails>
            </Accordion>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.betaTrack.name}</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack track={props.legendaryEvent.betaTrack}/>
                </AccordionDetails>
            </Accordion>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.gammaTrack.name}</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack track={props.legendaryEvent.gammaTrack}/>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

