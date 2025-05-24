import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import React, { useMemo, useState } from 'react';

import { EquipmentType } from 'src/models/interfaces';

import { RarityStars, Rarity, Faction, Rank } from '@/fsd/5-shared/model';

import { DamageChart } from './damage-chart';
import { FullCharacter } from './full-character';
import { IEquipmentSpec } from './versus-interfaces';

/**
 * Main site for the Versus page, showing stats and a damage graph for two
 * characters.
 */
export const Versus: React.FC = () => {
    const [char1Id, setChar1Id] = useState<string>('Varro Tigurius');
    const [char1Faction, setChar1Faction] = useState<Faction>(Faction.Ultramarines);
    const [char1Rank, setChar1Rank] = useState<Rank>(Rank.Stone1);
    const [char1Rarity, setChar1Rarity] = useState<Rarity>(Rarity.Common);
    const [char1Stars, setChar1Stars] = useState<RarityStars>(RarityStars.None);
    const [char1Equipment, setChar1Equipment] = useState<IEquipmentSpec[]>([
        { type: EquipmentType.Crit },
        { type: EquipmentType.Defensive },
        { type: EquipmentType.CritBooster },
    ]);

    const [char2Id, setChar2Id] = useState<string>('Varro Tigurius');
    const [char2Faction, setChar2Faction] = useState<Faction>(Faction.Ultramarines);
    const [char2Rank, setChar2Rank] = useState<Rank>(Rank.Stone1);
    const [char2Rarity, setChar2Rarity] = useState<Rarity>(Rarity.Common);
    const [char2Stars, setChar2Stars] = useState<RarityStars>(RarityStars.None);
    const [char2Equipment, setChar2Equipment] = useState<IEquipmentSpec[]>([
        { type: EquipmentType.Crit },
        { type: EquipmentType.Defensive },
        { type: EquipmentType.CritBooster },
    ]);

    const damageChart = useMemo(() => {
        return (
            <DamageChart
                char1Id={char1Id}
                char1Faction={char1Faction}
                char1Rank={char1Rank}
                char1Rarity={char1Rarity}
                char1Stars={char1Stars}
                char1Equipment={char1Equipment}
                char2Id={char2Id}
                char2Faction={char2Faction}
                char2Rank={char2Rank}
                char2Rarity={char2Rarity}
                char2Stars={char2Stars}
                char2Equipment={char2Equipment}
            />
        );
    }, [
        char1Id,
        char1Faction,
        char1Rank,
        char1Rarity,
        char1Stars,
        char1Equipment,
        char2Id,
        char2Faction,
        char2Rank,
        char2Rarity,
        char2Stars,
        char2Equipment,
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
                        <li>
                            <s>If you own a character, change the selectors to your character&squot;s current stats.</s>
                        </li>
                        <li>
                            <s>Graph percentile damage chart</s>
                        </li>
                        <li>
                            <s>Factor in equipment</s>
                        </li>
                        <li>Factor in stateless modifiers (e.g. MK X Gravis) from the characters&squot; traits.</li>
                        <li>Factor in stateless modifiers from the characters&squot; passive abilities.</li>
                        <li>Factor in stateless modifiers from other characters&squot; active abilities.</li>
                        <li>Factor in map-based damage modifiers (e.g. high ground, trench).</li>
                        <li>
                            Factor in statefull modifiers (e.g. Terminator Armor) from the characters&squot; traits.
                        </li>
                        <li>Factor in modifiers from other characters&squot; passive abilities.</li>
                        <li>Factor in modifiers from other characters&squot; active abilities (e.g. Waaaagh!).</li>
                    </ul>
                </AccordionDetails>
            </Accordion>
            <div>
                <div className="flex-box gap10">
                    <FullCharacter
                        onCharacterChange={(characterId, npcName, faction, rank, rarity, stars, equipment) => {
                            setChar1Id(characterId ?? npcName!);
                            setChar1Faction(faction);
                            setChar1Rank(rank);
                            setChar1Rarity(rarity);
                            setChar1Stars(stars);
                            setChar1Equipment(equipment);
                        }}
                    />
                    <span>vs</span>
                    <FullCharacter
                        onCharacterChange={(characterId, npcName, faction, rank, rarity, stars, equipment) => {
                            setChar2Id(characterId ?? npcName!);
                            setChar2Faction(faction);
                            setChar2Rank(rank);
                            setChar2Rarity(rarity);
                            setChar2Stars(stars);
                            setChar2Equipment(equipment);
                        }}
                    />
                </div>
                <div>{damageChart}</div>
            </div>
        </div>
    );
};
