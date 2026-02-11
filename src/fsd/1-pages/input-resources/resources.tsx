/* eslint-disable import-x/no-internal-modules */
import { JSX, useContext } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Alliance, Rarity, RarityMapper, useAuth } from '@/fsd/5-shared/model';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';
import { OrbIcon } from '@/fsd/5-shared/ui/icons/iconList';
import { MiscIcon } from '@/fsd/5-shared/ui/icons/misc.icon';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button/sync-button';

import { XpUseState } from './models';

export const Resources = () => {
    const { inventory, xpUse } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { userInfo } = useAuth();

    const dispatchUpdate = (newState: XpUseState) => {
        dispatch.xpUse({
            type: 'Set',
            value: newState,
        });
    };

    const enabled: boolean[] = [
        xpUse.useCommon,
        xpUse.useUncommon,
        xpUse.useRare,
        xpUse.useEpic,
        xpUse.useLegendary,
        xpUse.useMythic,
    ];

    const getRarityIndex = (rarity: Rarity): number => rarities.indexOf(rarity);

    const newState = (rarity: Rarity): XpUseState => {
        const index = getRarityIndex(rarity);
        const updatedEnabled = [...enabled];
        updatedEnabled[index] = !updatedEnabled[index];

        return {
            useCommon: updatedEnabled[0],
            useUncommon: updatedEnabled[1],
            useRare: updatedEnabled[2],
            useEpic: updatedEnabled[3],
            useLegendary: updatedEnabled[4],
            useMythic: updatedEnabled[5],
        };
    };

    const toggleState = (rarity: Rarity) => dispatchUpdate(newState(rarity));

    const rarities: Rarity[] = [
        Rarity.Common,
        Rarity.Uncommon,
        Rarity.Rare,
        Rarity.Epic,
        Rarity.Legendary,
        Rarity.Mythic,
    ];

    const hasSync = !!userInfo.tacticusApiKey;

    const renderResourceItem = (
        key: string,
        icon: JSX.Element,
        quantity: number,
        onClick?: () => void, // Optional click handler
        isEnabled: boolean = true // Optional enabled state (default true)
    ) => {
        const clickableClass = onClick ? 'cursor-pointer transition-all duration-150' : '';
        const hoverClass = onClick ? 'hover:scale-105 hover:bg-gray-700/50' : '';
        const disabledClass = !isEnabled ? 'grayscale opacity-40' : '';

        return (
            <div
                key={key}
                className={`flex min-w-[55px] flex-col items-center justify-start p-1 ${clickableClass} ${disabledClass} ${hoverClass}`}
                onClick={onClick}
                title={onClick ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}>
                <div className="flex h-[45px] w-[45px] items-center justify-center">{icon}</div>
                <span className="mt-1 text-sm font-semibold text-white">{quantity}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-y-4 p-2">
            {hasSync && (
                <div className="flex justify-end border-b border-gray-600 p-2">
                    <SyncButton showText={!isMobile} />
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg">
                    <h4 className="text-md mb-2 border-b border-gray-600 pb-2 font-bold tracking-wide text-gray-300 uppercase">
                        XP Books
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {rarities.map(rarity => {
                            const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'Book';
                            const index = getRarityIndex(rarity);
                            const isEnabled = enabled[index];

                            return renderResourceItem(
                                'book-' + rarity,
                                <MiscIcon icon={icon} width={45} height={45} />,
                                inventory.xpBooks[rarity],
                                // Pass the click handler and enabled state only for XP Books
                                () => toggleState(rarity),
                                isEnabled
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg">
                    <h4 className="text-md mb-2 border-b border-gray-600 pb-2 font-bold tracking-wide text-gray-300 uppercase">
                        Forge Badges
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {rarities.map(rarity => {
                            const quantity = inventory.forgeBadges[rarity] || 0;
                            const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'ForgeBadge';
                            return renderResourceItem(
                                'forge-' + rarity,
                                <MiscIcon icon={icon} width={45} height={45} />,
                                quantity
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg">
                    <h4 className="text-md mb-2 border-b border-gray-600 pb-2 font-bold tracking-wide text-gray-300 uppercase">
                        Machine of War Components
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {Object.entries(inventory.components).map(([alliance, quantity]) => {
                            return renderResourceItem(
                                'component-' + alliance,
                                <MiscIcon icon={alliance.toLowerCase() + 'Component'} width={45} height={45} />,
                                quantity as number
                            );
                        })}
                    </div>
                </div>
            </div>{' '}
            <div className="mt-4 flex flex-col rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg">
                <h3 className="mb-3 border-b border-gray-600 pb-2 text-lg font-bold tracking-wider text-gray-300 uppercase">
                    Alliance Resources
                </h3>

                <div className="flex flex-col divide-y divide-gray-700">
                    {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                        <div key={alliance} className="py-3">
                            <h4 className="mb-2 text-sm font-semibold text-gray-400 uppercase">{alliance}</h4>

                            <div className="grid grid-cols-2 gap-x-4">
                                <div className="flex flex-wrap justify-start">
                                    {rarities.map(rarity => {
                                        const quantity = inventory.abilityBadges[alliance][rarity as number as Rarity];
                                        return renderResourceItem(
                                            alliance + '-badge-' + rarity,
                                            <BadgeImage alliance={alliance} rarity={rarity} />,
                                            quantity
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap justify-start">
                                    {rarities.map(rarity => {
                                        if (rarity === Rarity.Common) return null; // Skip Common Orbs
                                        const quantity = inventory.orbs[alliance][rarity as number as Rarity];
                                        return renderResourceItem(
                                            alliance + '-orb-' + rarity,
                                            <OrbIcon alliance={alliance} rarity={rarity} size={45} />,
                                            quantity
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
