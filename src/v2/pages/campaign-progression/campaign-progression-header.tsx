import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const CampaignProgressionHeader = () => {
    return (
        <span>
            This page is in beta. If you see bugs, or have features you would like
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
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="instructions-accordion">
                    Instructions
                </AccordionSummary>
                <AccordionDetails>
                    <ol>
                        <li>
                            Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.
                        </li>
                        <li>
                            Enter your campaign progress in the{' '}
                            <a href="../../input/campaignsProgress">Campaigns Progress</a> page.
                        </li>
                        <li>
                            Enter your goals in the <a href="../../plan/goals">Goals</a> page.
                        </li>
                        <li>
                            Review these results and adust your goals.
                            <ol>
                                <li>
                                    Consider the balance between spending energy to upgrade the necessary units and
                                    beating the requisite battles.
                                </li>
                                <li>
                                    Work towards the goals that have the biggest bang for your buck. Least energy spent
                                    yielding the most energy saved.
                                </li>
                                <li>
                                    Mark your goals complete as you progress, and revisit this page periodically for
                                    more advice.
                                </li>
                            </ol>
                        </li>
                    </ol>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="known-issues-accordion">
                    Known Issues and Future Work
                </AccordionSummary>
                <AccordionDetails>
                    <ol>
                        <li>
                            The UI is bad. But I&apos;m a backend engineer, so I&apos;d need suggestions on how to
                            spruce it up.
                            <ol>
                                <li>
                                    <s>
                                        It would be nice to have radio boxes for ascension goals and rankup goals so
                                        they can be toggled off.
                                    </s>
                                </li>
                                <li>
                                    <s>It would be nice to have a radio box to hide completed campaigns.</s>
                                </li>
                                <li>
                                    Make the UI mobile friendly.
                                    <ol>
                                        <li>Probably don&apos;t display goals on mobile.</li>
                                        <li>
                                            Change each battle to its element that can span both vertically and
                                            horizontally.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    It would be nice to be able to sort the campaigns.
                                    <ol>
                                        <li>
                                            Biggest early payoff - If you can complete the next N (maybe 5) nodes, which
                                            campaign gives the biggest win.
                                        </li>
                                        <li>Best payoff for completing the campaign.</li>
                                        <li>
                                            Which campaign early has the biggest impact on your highest priority
                                            character.
                                        </li>
                                        <li>
                                            Which campaign at the end has the biggest impact on your highest priority
                                            character.
                                        </li>
                                    </ol>
                                </li>
                            </ol>
                        </li>
                        <li>
                            Ignores current inventory but uses applied upgrades. The savings would be hard to parse, or
                            worse, misleading, if we were to use the current inventory.
                        </li>
                        <li>
                            Mention at the top, where we list unfarmable materials, if our current inventory can already
                            satisfy our requirements (e.g. we need two &apos;Ard Plates, and we cannot farm them, but we
                            already own enough of them).
                        </li>
                        <li>Doesn&apos;t list savings for ascension/unlock goals.</li>
                        <li>
                            Doesn&apos;t list nodes that unlock already-unlocked materials, which might allow one to
                            farm items faster (but not any more cheaply).
                        </li>
                        <li>Ignores upgrade-ability goals.</li>
                        <li>
                            <s>Rank-up goal costs should link to the rank-lookup page.</s>
                        </li>
                        <li>
                            <s>Target rank icons should link to the goal page.</s>
                        </li>
                        <li>
                            <s>The large campaign icons should link to the campaign&apos;s &apos;Learn&apos; page.</s>
                        </li>
                        <li>
                            <s>
                                Battles that unlock a material should display the character icons of all characters
                                requiring the material.
                            </s>
                        </li>
                        <li>
                            <s>
                                The amount saved should link to a small dialog or tooltip explaining the savings
                                (computation with farmable nodes, new computation with this node).
                            </s>
                        </li>
                    </ol>
                </AccordionDetails>
            </Accordion>
        </span>
    );
};

export default CampaignProgressionHeader;
