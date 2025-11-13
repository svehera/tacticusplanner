/* eslint-disable import-x/no-internal-modules */
import SyncIcon from '@mui/icons-material/Sync';
import Button from '@mui/material/Button';
import { JSX, useContext } from 'react';
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

    const renderResourceItem = (key: string, icon: JSX.Element, quantity: number) => (
        <div key={key} className="flex flex-col items-center justify-start min-w-[55px] p-1">
            <div className="h-[45px] w-[45px] flex items-center justify-center">{icon}</div>
            <span className="text-sm font-semibold text-white mt-1">{quantity}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-y-4 p-2">
            {hasSync && (
                <div className="flex justify-end p-2 border-b border-gray-600">
                    <Button size="small" variant="contained" color="primary" onClick={sync}>
                        <SyncIcon className="mr-1" />
                        {!isMobile && 'Sync'}
                    </Button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                    <h4 className="text-md font-bold text-gray-300 border-b border-gray-600 pb-2 mb-2 uppercase tracking-wide">
                        XP Books
                    </h4>
                    <div className="flex flex-wrap justify-start gap-x-1">
                        {rarities.map(rarity => {
                            const icon = RarityMapper.rarityToRarityString(rarity).toLowerCase() + 'Book';
                            return renderResourceItem(
                                'book-' + rarity,
                                <MiscIcon icon={icon} width={45} height={45} />,
                                inventory.xpBooks[rarity]
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                    <h4 className="text-md font-bold text-gray-300 border-b border-gray-600 pb-2 mb-2 uppercase tracking-wide">
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

                <div className="flex flex-col p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                    <h4 className="text-md font-bold text-gray-300 border-b border-gray-600 pb-2 mb-2 uppercase tracking-wide">
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
            <div className="flex flex-col p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-4">
                <h3 className="text-lg font-bold text-gray-300 border-b border-gray-600 pb-2 mb-3 uppercase tracking-wider">
                    Alliance Resources
                </h3>

                <div className="flex flex-col divide-y divide-gray-700">
                    {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                        <div key={alliance} className="py-3">
                            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">{alliance}</h4>

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
