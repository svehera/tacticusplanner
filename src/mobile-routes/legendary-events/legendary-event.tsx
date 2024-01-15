import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { ILegendaryEvent } from '../../models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const LegendaryEvent = (props: { legendaryEvent: ILegendaryEvent }) => {
    return (
        <Box sx={{ bgcolor: 'background.paper' }}>
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {props.legendaryEvent.alpha.name} - {props.legendaryEvent.alpha.killPoints} kill points
                </AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.alpha} />
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {props.legendaryEvent.beta.name} - {props.legendaryEvent.beta.killPoints} kill points
                </AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.beta} />
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {props.legendaryEvent.gamma.name} - {props.legendaryEvent.gamma.killPoints} kill points
                </AccordionSummary>
                <AccordionDetails>
                    <LegendaryEventTrack eventId={props.legendaryEvent.id} track={props.legendaryEvent.gamma} />
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
