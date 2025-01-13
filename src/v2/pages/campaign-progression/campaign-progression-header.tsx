import React from 'react';

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
            Found this site helpful ? Consider using the maintainer&apos;s Refer - A - Friend code &apos; DUG - 38 - VAT
            &apos;.
            <br />
            Maybe also <a href="https://buymeacoffee.com/tacticusplanner"> buy</a> the site owner a coffee?
            <p />
            Instructions:
            <ol>
                <li>
                    Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.
                </li>
                <li>
                    Enter your campaign progress in the <a href="../../input/campaignsProgress">Campaigns Progress</a>{' '}
                    page.
                </li>
                <li>
                    Enter your goals in the <a href="../../plan/goals">Goals</a> page.
                </li>
                <li>
                    Review these results and adust your goals.
                    <ol>
                        <li>
                            Consider the balance between spending energy to upgrade the necessary units and beating the
                            requisite battles.
                        </li>
                        <li>
                            Work towards the goals that have the biggest bang for your buck. Least energy spent yielding
                            the most energy saved.
                        </li>
                        <li>
                            Mark your goals complete as you progress, and revisit this page periodically for more
                            advice.
                        </li>
                    </ol>
                </li>
            </ol>
            <p />
            Known Issues and Future Work
            <ol>
                <li>
                    The UI is bad. But I&apos;m a backend engineer, so I&apos;d need suggestions on how to spruce it up.
                    <ol>
                        <li>
                            It would be nice to have radio boxes for ascension goals and rankup goals so they can be
                            toggled off.
                        </li>
                        <li>It would be nice to have a radio box to hide completed campaigns.</li>
                    </ol>
                </li>
                <li>
                    Ignores current inventory but uses applied upgrades. The savings would be hard to parse, or worse,
                    misleading, if we were to use the current inventory.
                </li>
                <li>
                    <s>Doesn&apos;t list savings forascension/unlock goals.</s>
                </li>
                <li>
                    Doesn&apos;t list nodes that unlock already-unlocked materials, which might allow one to farm items
                    faster (but not any more cheaply).
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
                        Battles that unlock a material should display the character icons of all characters requiring
                        the material.
                    </s>
                </li>
                <li>
                    <s>
                        The amount saved should link to a small dialog or tooltip explaining the savings (computation
                        with farmable nodes, new computation with this node).
                    </s>
                </li>
            </ol>
        </span>
    );
};

export default CampaignProgressionHeader;
