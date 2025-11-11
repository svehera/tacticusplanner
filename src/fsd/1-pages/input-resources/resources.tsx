/* eslint-disable import-x/no-internal-modules */
import SyncIcon from '@mui/icons-material/Sync';
import Button from '@mui/material/Button';
import { useContext } from 'react';
import { isMobile } from 'react-device-detect';

import { StoreContext } from '@/reducers/store.provider';

import { Alliance, Rarity, RarityMapper, useAuth } from '@/fsd/5-shared/model';
import { OrbIcon } from '@/fsd/5-shared/ui/icons/assets';
import { BadgeImage } from '@/fsd/5-shared/ui/icons/badge-image';
import { MiscIcon } from '@/fsd/5-shared/ui/icons/misc.icon';

import { useSyncWithTacticus } from '@/v2/features/tacticus-integration/useSyncWithTacticus';

export const Resources = () => {
    const { inventory, viewPreferences } = useContext(StoreContext);
    const { syncWithTacticus } = useSyncWithTacticus();
    const { userInfo } = useAuth();

    const rarities: Rarity[] = [
        Rarity.Common,
        Rarity.Uncommon,
        Rarity.Rare,
        Rarity.Epic,
        Rarity.Legendary,
        Rarity.Mythic,
    ];

    const hasSync = viewPreferences.apiIntegrationSyncOptions.includes('raidedLocations') && !!userInfo.tacticusApiKey;

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus(viewPreferences.apiIntegrationSyncOptions);
    };

    // --- Helper function for rendering a single resource item ---
    const renderResourceItem = (key: string, icon: JSX.Element, quantity: number) => (
        <div key={key} className="flex flex-col items-center justify-start min-w-[70px] p-1">
            <div className="h-[60px] w-[60px] flex items-center justify-center">{icon}</div>
            <span className="text-sm font-semibold text-white/90 mt-1">{quantity}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-y-6 p-4 bg-gray-900 rounded-lg shadow-xl">
            {hasSync && (
                <div className="mb-4">
                    <Button size="small" variant="contained" color="primary" onClick={sync}>
                        <SyncIcon className="mr-1" />
                        {!isMobile && 'Sync Inventory'}
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-y-3">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-800 pb-2">XP Books</h3>
                <div className="flex flex-wrap gap-x-2">
                    {rarities.map(rarity => {
                        const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'Book';
                        return renderResourceItem(
                            'book-' + rarity,
                            <MiscIcon icon={icon} width={60} height={60} />,
                            inventory.xpBooks[rarity]
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-y-4">
                <h3 className="text-xl font-bold text-blue-400 border-b border-blue-800 pb-2">
                    Alliance Resources (Badges & Orbs)
                </h3>

                <div className="flex flex-col gap-y-5">
                    {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                        <div key={alliance} className="flex flex-col">
                            <h4 className="text-lg font-semibold text-white mb-2 uppercase border-b border-gray-700 w-full">
                                {alliance}
                            </h4>

                            <div className="flex flex-wrap gap-x-2">
                                {rarities.map(rarity => {
                                    const quantity = inventory.abilityBadges[alliance][rarity as number as Rarity];
                                    return renderResourceItem(
                                        alliance + '-badge-' + rarity,
                                        <BadgeImage alliance={alliance} rarity={rarity} />,
                                        quantity
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap gap-x-2 mt-3">
                                {rarities.map(rarity => {
                                    if (rarity === Rarity.Common) return null; // Skip Common Orbs
                                    const quantity = inventory.orbs[alliance][rarity as number as Rarity];
                                    return renderResourceItem(
                                        alliance + '-orb-' + rarity,
                                        <OrbIcon alliance={alliance} rarity={rarity} size={60} />,
                                        quantity
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-y-4">
                <h3 className="text-xl font-bold text-green-400 border-b border-green-800 pb-2">
                    Generic Components & Parts
                </h3>

                <h4 className="text-md font-semibold text-gray-400 mt-2">Forge Badges</h4>
                <div className="flex flex-wrap gap-x-2">
                    {rarities.map(rarity => {
                        const quantity = inventory.forgeBadges[rarity] || 0;
                        const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'ForgeBadge';
                        return renderResourceItem(
                            'forge-' + rarity,
                            <MiscIcon icon={icon} width={60} height={60} />,
                            quantity
                        );
                    })}
                </div>

                <h4 className="text-md font-semibold text-gray-400 mt-2">Machine Components</h4>
                <div className="flex flex-wrap gap-x-2">
                    {Object.entries(inventory.components).map(([alliance, quantity]) => {
                        return renderResourceItem(
                            'component-' + alliance,
                            <MiscIcon icon={alliance.toLowerCase() + 'Component'} width={60} height={60} />,
                            quantity as number
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
