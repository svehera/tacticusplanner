import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ResolvedShopItem } from '@/fsd/4-entities/shops';

import { ShopAvailabilityGroups } from './shop-availability-groups';

const makeItem = (rewardType: string): ResolvedShopItem => ({
    rewardType,
    rewardQty: 1,
    costAmount: 100,
    maxPerDay: 1,
    isGuaranteed: true,
});

const renderItem = (item: ResolvedShopItem) => <span key={item.rewardType}>{item.rewardType}</span>;

describe('ShopAvailabilityGroups', () => {
    it('renders nothing when both groups are empty', () => {
        const { container } = render(
            <ShopAvailabilityGroups shopName="War Shop" guaranteed={[]} possible={[]} renderItem={renderItem} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders only the "Available" header/group when there are no random items', () => {
        render(
            <ShopAvailabilityGroups
                shopName="War Shop"
                guaranteed={[makeItem('a')]}
                possible={[]}
                renderItem={renderItem}
            />
        );
        expect(screen.getByText('Available in War Shop today')).toBeInTheDocument();
        expect(screen.queryByText(/Possibly in War Shop today/i)).not.toBeInTheDocument();
        expect(screen.getByText('a')).toBeInTheDocument();
    });

    it('renders only the "Possibly" header/group when everything is random', () => {
        render(
            <ShopAvailabilityGroups
                shopName="Guild Shop"
                guaranteed={[]}
                possible={[makeItem('b')]}
                renderItem={renderItem}
            />
        );
        expect(screen.getByText('Possibly in Guild Shop today')).toBeInTheDocument();
        expect(screen.queryByText(/Available in Guild Shop today/i)).not.toBeInTheDocument();
        expect(screen.getByText('b')).toBeInTheDocument();
    });

    it('renders both headers/groups for a mix of guaranteed and random items', () => {
        render(
            <ShopAvailabilityGroups
                shopName="Crusade Shop"
                guaranteed={[makeItem('a')]}
                possible={[makeItem('b')]}
                renderItem={renderItem}
            />
        );
        expect(screen.getByText('Available in Crusade Shop today')).toBeInTheDocument();
        expect(screen.getByText('Possibly in Crusade Shop today')).toBeInTheDocument();
        expect(screen.getByText('a')).toBeInTheDocument();
        expect(screen.getByText('b')).toBeInTheDocument();
    });
});
