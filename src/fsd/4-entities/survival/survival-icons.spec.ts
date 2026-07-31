import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { getShopCurrencyIconKey } from '@/fsd/4-entities/shops/@x/survival';

import {
    resolveSurvivalEnemyNpc,
    survivalOfferRewardInfo,
    survivalPowupInfo,
    survivalRewardInfo,
} from './survival-event.utils';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

interface RawSurvivalEvent {
    resourceId?: string;
    milestoneRewards?: Array<{ reward?: string; chest?: Array<{ rewards: string[] }> }>;
    chests?: Array<{ cost: { type: string }; rewards: string[] }>;
    battle?: { waves?: Array<{ army?: string[]; armyAfterCompletion?: string[] }> };
    offers?: Record<string, { realMoneyProduct: { rewards: string[] } }>;
}

function loadSurvivalJsons(): RawSurvivalEvent[] {
    return readdirSync(DATA_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8')) as RawSurvivalEvent);
}

describe('survival icon completeness', () => {
    const events = loadSurvivalJsons();

    it('found at least one survival event to check', () => {
        expect(events.length).toBeGreaterThan(0);
    });

    it('every milestone/chest reward has a resolvable icon', () => {
        const missing: string[] = [];
        for (const event of events) {
            for (const milestone of event.milestoneRewards ?? []) {
                if (milestone.reward && !survivalRewardInfo(milestone.reward).resolved) missing.push(milestone.reward);
                for (const bundle of milestone.chest ?? []) {
                    for (const rewardId of bundle.rewards) {
                        if (!survivalRewardInfo(rewardId).resolved) missing.push(rewardId);
                    }
                }
            }
            for (const chest of event.chests ?? []) {
                for (const rewardId of chest.rewards) {
                    if (!survivalRewardInfo(rewardId).resolved) missing.push(rewardId);
                }
            }
        }
        expect(missing, `Rewards missing a resolvable icon:\n${[...new Set(missing)].join('\n')}`).toHaveLength(0);
    });

    it('every chest currency cost has a registered icon', () => {
        const missing: string[] = [];
        for (const event of events) {
            for (const chest of event.chests ?? []) {
                if (!getShopCurrencyIconKey(chest.cost.type)) missing.push(chest.cost.type);
            }
            if (event.resourceId && !getShopCurrencyIconKey(event.resourceId)) missing.push(event.resourceId);
        }
        expect(missing, `Currencies missing a registered icon:\n${[...new Set(missing)].join('\n')}`).toHaveLength(0);
    });

    it('every wave enemy resolves to a known NPC', () => {
        const missing: string[] = [];
        for (const event of events) {
            for (const wave of event.battle?.waves ?? []) {
                for (const rawEnemyId of wave.army ?? []) {
                    if (!resolveSurvivalEnemyNpc(rawEnemyId)) missing.push(rawEnemyId);
                }
            }
        }
        expect(missing, `Enemies missing NPC data:\n${[...new Set(missing)].join('\n')}`).toHaveLength(0);
    });

    it('every wave power-up (generic or summon-spawn) has a resolvable icon', () => {
        const missing: string[] = [];
        for (const event of events) {
            for (const wave of event.battle?.waves ?? []) {
                for (const powupId of wave.armyAfterCompletion ?? []) {
                    if (!survivalPowupInfo(powupId).resolved) missing.push(powupId);
                }
            }
        }
        expect(
            missing,
            `Power-ups missing a resolvable icon (generic power-ups need an entry in GENERIC_POWUP_ICON_KEY; ` +
                `summon-spawn power-ups need a matching NPC entry in 4-entities/npc/data):\n${[...new Set(missing)].join('\n')}`
        ).toHaveLength(0);
    });

    it('every offer reward has a resolvable icon', () => {
        const missing: string[] = [];
        for (const event of events) {
            for (const offer of Object.values(event.offers ?? {})) {
                for (const rewardId of offer.realMoneyProduct.rewards) {
                    if (!survivalOfferRewardInfo(rewardId).resolved) missing.push(rewardId);
                }
            }
        }
        expect(missing, `Offer rewards missing a resolvable icon:\n${[...new Set(missing)].join('\n')}`).toHaveLength(
            0
        );
    });
});
