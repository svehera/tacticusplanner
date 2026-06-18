/* eslint-disable import-x/no-internal-modules */
import { JSX } from 'react';

import { IArmageddonCart, IArmageddonCartEntry } from '@/models/interfaces';

import type { Day } from './armageddon.constants';

export interface ArmageddonProduct {
    weight: number;
    conditions: {
        minPowerLevel?: number;
        maxPowerLevel?: number;
        lockId?: string;
    };
    cronSchedule: string;
    reward: string;
    cost: { type: string; amount: number };
    maxPurchases?: string;
    freeOffer?: string;
}

export interface ArmageddonWeek {
    displayLocation: string;
    products: ArmageddonProduct[][];
}

export interface ResolvedSlot {
    product: ArmageddonProduct;
    slotIndex: number;
    label: string;
    qty: number | undefined;
    icon: JSX.Element;
    isFree: boolean;
    cost: number;
}

export type CartEntry = IArmageddonCartEntry;
export type CartRecord = IArmageddonCart;

export interface CoverageRow {
    rewardType: string;
    label: string;
    icon: JSX.Element;
    needed: number;
    cartTotal: number;
    remaining: number;
    availability: Array<{ week: 1 | 2 | 3; days: Day[] }>;
    note?: string;
    estimatedCost?: number;
}
