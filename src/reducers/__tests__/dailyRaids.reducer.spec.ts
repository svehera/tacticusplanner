import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { dailyRaidsReducer } from '@/reducers/dailyRaids.reducer';

import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

describe('dailyRaids.reducer - Campaign Event mapping', () => {
    it('maps Death Guard Standard and Challenge battles into raidedLocations', () => {
        const initialState = { ...defaultData.dailyRaids };

        const deathGuardProgress: TacticusCampaignProgress = {
            id: 'eventCampaign4',
            name: 'Death Guard',
            type: 'Standard',
            battles: [
                // Index 0 corresponds to DGS01 (Death Guard Standard node 1)
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 2 },
                // Index 3 corresponds to DGSC03B (Death Guard Standard Challenge node 3)
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, {
            type: 'SyncWithTacticus',
            progress: [deathGuardProgress],
        } as any);

        // Should include base node (DGS01)
        const hasStandard = next.raidedLocations.some(
            x => x.campaign === 'Death Guard Standard' && x.nodeNumber === 1 && x.energySpent === 12
        );
        // Should include challenge node (DGSC03B)
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Death Guard Standard Challenge' && x.nodeNumber === 3
        );

        expect(hasStandard).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('maps AdMech Standard and Challenge battles', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign1',
            name: 'Adeptus Mechanicus',
            type: 'Standard',
            battles: [
                // AMS01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // AMSC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(
            x => x.campaign === 'Adeptus Mechanicus Standard' && x.nodeNumber === 1
        );
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Adeptus Mechanicus Standard Challenge' && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('maps AdMech Extremis and Challenge battles', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign1',
            name: 'Adeptus Mechanicus',
            type: 'Extremis',
            battles: [
                // AME01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // AMEC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(
            x => x.campaign === 'Adeptus Mechanicus Extremis' && x.nodeNumber === 1
        );
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Adeptus Mechanicus Extremis Challenge' && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('maps Tyranids Standard and Challenge battles', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign2',
            name: 'Tyranids',
            type: 'Standard',
            battles: [
                // TS01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // TSC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Tyranids Standard' && x.nodeNumber === 1);
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Tyranids Standard Challenge' && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('maps Tyranids Extremis and Challenge battles', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign2',
            name: 'Tyranids',
            type: 'Extremis',
            battles: [
                // TE01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // TEC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Tyranids Extremis' && x.nodeNumber === 1);
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Tyranids Extremis Challenge' && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it("maps T'au Standard and Challenge battles", () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign3',
            name: "T'au Empire",
            type: 'Standard',
            battles: [
                // TAS01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // TASC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === "T'au Empire Standard" && x.nodeNumber === 1);
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === "T'au Empire Standard Challenge" && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it("maps T'au Extremis and Challenge battles", () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign3',
            name: "T'au Empire",
            type: 'Extremis',
            battles: [
                // TAE01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // TAEC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === "T'au Empire Extremis" && x.nodeNumber === 1);
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === "T'au Empire Extremis Challenge" && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('maps Death Guard Extremis and Challenge battles', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eventCampaign4',
            name: 'Death Guard',
            type: 'Extremis',
            battles: [
                // DGE01
                { battleIndex: 0, attemptsLeft: 0, attemptsUsed: 1 },
                // DGEC03B
                { battleIndex: 3, attemptsLeft: 0, attemptsUsed: 1 },
            ],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Death Guard Extremis' && x.nodeNumber === 1);
        const hasChallenge = next.raidedLocations.some(
            x => x.campaign === 'Death Guard Extremis Challenge' && x.nodeNumber === 3
        );
        expect(hasBase).toBe(true);
        expect(hasChallenge).toBe(true);
    });

    it('works for a regular legacy campaign (Indomitus)', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'campaign1', // maps to Campaign.I (Indomitus)
            name: 'Indomitus',
            type: 'Standard',
            // Use a raidable node: I06 (battleIndex 5)
            battles: [{ battleIndex: 5, attemptsLeft: 0, attemptsUsed: 1 }],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Indomitus' && x.nodeNumber === 6);
        expect(hasBase).toBe(true);
    });

    it('works for a mirror legacy campaign (Indomitus Mirror)', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'mirror1', // maps to Campaign.IM (Indomitus Mirror)
            name: 'Indomitus Mirror',
            type: 'Mirror',
            // Use a raidable node: IM06 (battleIndex 5)
            battles: [{ battleIndex: 5, attemptsLeft: 0, attemptsUsed: 1 }],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Indomitus Mirror' && x.nodeNumber === 6);
        expect(hasBase).toBe(true);
    });

    it('works for an elite legacy campaign (Indomitus Elite)', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'elite1', // maps to Campaign.IE (Indomitus Elite)
            name: 'Indomitus Elite',
            type: 'Elite',
            // Use a raidable node: IE06 (battleIndex 5)
            battles: [{ battleIndex: 5, attemptsLeft: 0, attemptsUsed: 1 }],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Indomitus Elite' && x.nodeNumber === 6);
        expect(hasBase).toBe(true);
    });

    it('works for a mirror elite legacy campaign (Indomitus Mirror Elite)', () => {
        const initialState = { ...defaultData.dailyRaids };

        const progress: TacticusCampaignProgress = {
            id: 'eliteMirror1', // maps to Campaign.IME (Indomitus Mirror Elite)
            name: 'Indomitus Mirror Elite',
            type: 'Mirror Elite',
            // Use a raidable node: IME06 (battleIndex 5)
            battles: [{ battleIndex: 5, attemptsLeft: 0, attemptsUsed: 1 }],
        };

        const next = dailyRaidsReducer(initialState, { type: 'SyncWithTacticus', progress: [progress] } as any);

        const hasBase = next.raidedLocations.some(x => x.campaign === 'Indomitus Mirror Elite' && x.nodeNumber === 6);
        expect(hasBase).toBe(true);
    });
});
