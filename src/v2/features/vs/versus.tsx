import React, { useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FullCharacter } from './full-character';
import { Faction, Rank, Rarity, RarityStars } from 'src/models/enums';
import { DamageChart } from './damage-chart';

export const Versus: React.FC = () => {
    const [char1Id, setChar1Id] = React.useState<string>('Varro Tigurius');
    const [char1Faction, setChar1Faction] = React.useState<Faction>(Faction.Ultramarines);
    const [char1Rank, setChar1Rank] = React.useState<Rank>(Rank.Stone1);
    const [char1Rarity, setChar1Rarity] = React.useState<Rarity>(Rarity.Common);
    const [char1Stars, setChar1Stars] = React.useState<RarityStars>(RarityStars.None);

    const [char2Id, setChar2Id] = React.useState<string>('Varro Tigurius');
    const [char2Faction, setChar2Faction] = React.useState<Faction>(Faction.Ultramarines);
    const [char2Rank, setChar2Rank] = React.useState<Rank>(Rank.Stone1);
    const [char2Rarity, setChar2Rarity] = React.useState<Rarity>(Rarity.Common);
    const [char2Stars, setChar2Stars] = React.useState<RarityStars>(RarityStars.None);

    const damageChart = useMemo(() => {
        return (
            <DamageChart
                char1Id={char1Id}
                char1Faction={char1Faction}
                char1Rank={char1Rank}
                char1Rarity={char1Rarity}
                char1Stars={char1Stars}
                char2Id={char2Id}
                char2Faction={char2Faction}
                char2Rank={char2Rank}
                char2Rarity={char2Rarity}
                char2Stars={char2Stars}
            />
        );
    }, [
        char1Id,
        char1Faction,
        char1Rank,
        char1Rarity,
        char1Stars,
        char2Id,
        char2Faction,
        char2Rank,
        char2Rarity,
        char2Stars,
    ]);
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
            <div>
                <div className="flex-box gap10">
                    <FullCharacter
                        onCharacterChange={(characterId, npcName, faction, rank, rarity, stars) => {
                            setChar1Id(characterId ?? npcName!);
                            setChar1Faction(faction);
                            setChar1Rank(rank);
                            setChar1Rarity(rarity);
                            setChar1Stars(stars);
                        }}
                    />
                    <span>vs</span>
                    <FullCharacter
                        onCharacterChange={(characterId, npcName, faction, rank, rarity, stars) => {
                            setChar2Id(characterId ?? npcName!);
                            setChar2Faction(faction);
                            setChar2Rank(rank);
                            setChar2Rarity(rarity);
                            setChar2Stars(stars);
                        }}
                    />
                </div>
                <div>{damageChart}</div>
            </div>
        </div>
    );
};
