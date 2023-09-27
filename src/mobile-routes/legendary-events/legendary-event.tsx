import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const LegendaryEvent = (props: { legendaryEvent: ILegendaryEvent}) => {
    return (
        <Box sx={{ bgcolor: 'background.paper' }}>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.alphaTrack.name} - {props.legendaryEvent.alphaTrack.killPoints} kill points</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.alphaTrack}/>
                </AccordionDetails>
            </Accordion>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.betaTrack.name} - {props.legendaryEvent.betaTrack.killPoints} kill points</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.betaTrack}/>
                </AccordionDetails>
            </Accordion>
            
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>{props.legendaryEvent.gammaTrack.name} - {props.legendaryEvent.gammaTrack.killPoints} kill points</AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.gammaTrack}/>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

