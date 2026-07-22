/* eslint-disable import-x/no-internal-modules */
import { JSX } from 'react';

import { IShopEventCart, IShopEventCartEntry } from '@/models/interfaces';

import type { ShopProduct } from '@/fsd/4-entities/shops';

import type { Day } from './shop-events.constants';

export interface ResolvedSlot {
    product: ShopProduct;
    slotIndex: number;
    label: string;
    qty: number | undefined;
    icon: JSX.Element;
    isFree: boolean;
    cost: number;
    /** The reward string actually shown/granted — `product.freeOffer` when present, else `product.reward`. */
    rewardString: string;
}

export type CartEntry = IShopEventCartEntry;
export type CartRecord = IShopEventCart;

export interface CoverageRow {
    rewardType: string;
    label: string;
    icon: JSX.Element;
    needed: number;
    cartTotal: number;
    remaining: number;
    availability: Array<{ week: number; days: Day[] }>;
    note?: string;
    estimatedCost?: number;
}
