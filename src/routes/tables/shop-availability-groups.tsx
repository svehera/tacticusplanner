import { FC, ReactNode } from 'react';

import { ResolvedShopItem } from '@/fsd/4-entities/shops';

interface Props {
    shopName: string;
    guaranteed: ResolvedShopItem[];
    possible: ResolvedShopItem[];
    renderItem: (item: ResolvedShopItem) => ReactNode;
}

export const ShopAvailabilityGroups: FC<Props> = ({ shopName, guaranteed, possible, renderItem }) => {
    if (guaranteed.length === 0 && possible.length === 0) return;

    return (
        <div className="mt-4 border-t border-(--card-border) pt-3">
            {guaranteed.length > 0 && (
                <section>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Available in {shopName} today
                    </p>
                    <div className="flex flex-wrap items-start justify-center gap-2">
                        {guaranteed.map(item => renderItem(item))}
                    </div>
                </section>
            )}
            {possible.length > 0 && (
                <section className={guaranteed.length > 0 ? 'mt-3' : undefined}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Possibly in {shopName} today
                    </p>
                    <div className="flex flex-wrap items-start justify-center gap-2">
                        {possible.map(item => renderItem(item))}
                    </div>
                </section>
            )}
        </div>
    );
};
