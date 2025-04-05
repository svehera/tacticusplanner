import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FullCharacter } from './full-character';

export const Versus: React.FC = () => {
    return (
        <div>
            <Accordion defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} id={'versus-details'}></AccordionSummary>
                PAGE IN EARLY DEVELOPMENT
                <AccordionDetails>
                    This page is in alpha. If you see bugs, or have features you would like
                    <br />
                    added, please contact cpunerd via{' '}
                    <a href="https://discord.gg/8mcWKVAYZf">
                        Discord&apos;s Tacticus
                        <br />
                        Planner channel
                    </a>
                    .
                    <p />
                    Found this site helpful ? Consider using cpunerd&apos;s Refer-A-Friend code &apos;DUG-38-VAT&apos;.
                    <br />
                    Maybe also <a href="https://buymeacoffee.com/tacticusplanner"> buy</a> the site owner a coffee?
                    <p />
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} id={'versus-details'}>
                    About This Page / Future Work
                </AccordionSummary>
                <AccordionDetails>
                    This page (will eventually) allows you to pit one character at a particular rank, rarity, and stars
                    against another character at a potentially different rank, rarity, and stars.
                    <p />
                    <b>How it works</b>
                    <ul>
                        <li>Select a faction and a character.</li>
                        <li>Select a rank, rarity, and stars</li>
                        <li>Select the other faction and character, and then rank, rarity, and stars.</li>
                        <li>Compare characters.</li>
                        <li>...</li>
                        <li>Profit</li>
                    </ul>
                    <b>Work Planned</b>
                    <ul>
                        <li>If you own a character, change the selectors to your character&squot;s current stats.</li>
                        <li>Graph percentile damage chart</li>
                        <li>Factor in equipment</li>
                        <li>Factor in map-based damage modifiers (e.g. high ground, trench).</li>
                        <li>Factor in modifiers from the characters&squot; traits.</li>
                        <li>Factor in modifiers from the characters&squot; passive abilities.</li>
                        <li>Factor in modifiers from other characters&squot; passive abilities.</li>
                        <li>Factor in modifiers from other characters&squot; active abilities (e.g. Waaaagh!).</li>
                    </ul>
                </AccordionDetails>
            </Accordion>
            <div className="flex-box gap10">
                <FullCharacter
                    onCharacterChange={(characterId, npcName, faction, rank, rarity, stars) => {
                        console.log(characterId, npcName, faction, rank, rarity, stars);
                    }}
                />
                <span>vs</span>
                <FullCharacter
                    onCharacterChange={(characterId, npcName, faction, rank, rarity, stars) => {
                        console.log(characterId, npcName, faction, rank, rarity, stars);
                    }}
                />
            </div>
        </div>
    );
};
