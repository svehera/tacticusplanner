/* eslint-disable boundaries/element-types */
import { AllCommunityModule, themeBalham, ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo } from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib';
import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { BadgeImage, ComponentImage, ForgeBadgeImage, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import { IMowLevelMaterials } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

interface Properties {
    rows: IMowLevelMaterials[];
}

export const MowMaterialsTable: React.FC<Properties> = ({ rows }) => {
    const columnDefs = useMemo<Array<ColDef<IMowLevelMaterials>>>(() => {
        return [
            {
                field: 'level',
                maxWidth: 60,
            },
            {
                field: 'badges',
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = parameters;
                    if (data) {
                        return (
                            <div className="flex-box gap-[3px]">
                                <span>{data.badges}</span>
                                <BadgeImage alliance={data.mowAlliance} rarity={data.rarity} />
                            </div>
                        );
                    }
                },
                width: 75,
            },
            {
                field: 'components',
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = parameters;
                    if (data) {
                        return (
                            <div className="flex-box gap-[3px]">
                                <span>{data.components}</span>
                                <ComponentImage alliance={data.mowAlliance} />
                            </div>
                        );
                    }
                },
                width: 100,
            },
            {
                field: 'forgeBadges',
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = parameters;
                    if (data) {
                        return data.forgeBadges > 0 ? (
                            <div className="flex-box gap-[3px]">
                                <span>{data.forgeBadges}</span>
                                <ForgeBadgeImage rarity={data.rarity} />
                            </div>
                        ) : (
                            `${data.salvage} salvage`
                        );
                    }
                },
                width: 105,
            },
            {
                field: 'primaryUpgrades',
                valueFormatter: parameters => {
                    const { data } = parameters;
                    return data?.primaryUpgrades.map(x => x.id).join(', ') ?? '';
                },
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = parameters;
                    if (data) {
                        return (
                            <div className="flex-box gap-[3px]">
                                {data.primaryUpgrades.map((x, index) => {
                                    const upgrade = UpgradesService.getUpgrade(x.id);
                                    if (!upgrade) return <></>;
                                    if (upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
                                        const char = CharactersService.getUnit(
                                            x.id.slice(Math.max(0, x.id.indexOf('_') + 1))
                                        );
                                        if (char) {
                                            return (
                                                <UnitShardIcon
                                                    key={x.id + index}
                                                    name={x.id}
                                                    icon={char.roundIcon}
                                                    mythic={upgrade.rarity === 'Mythic Shard'}
                                                />
                                            );
                                        }
                                        return <></>;
                                    }
                                    return (
                                        <UpgradeImage
                                            key={x.id + index}
                                            material={x.label}
                                            iconPath={x.iconPath}
                                            rarity={RarityMapper.rarityToRarityString(x.rarity as unknown as Rarity)}
                                            size={40}
                                        />
                                    );
                                })}
                            </div>
                        );
                    }
                },
                width: 150,
            },
            {
                field: 'gold',
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { value } = parameters;
                    return numberToThousandsString(value);
                },
                width: 60,
            },
            {
                field: 'secondaryUpgrades',
                valueFormatter: parameters => {
                    const { data } = parameters;
                    return data?.secondaryUpgrades.map(x => x.id).join(', ') ?? '';
                },
                cellRenderer: (parameters: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = parameters;
                    if (data) {
                        return (
                            <div className="flex-box gap-[3px]">
                                {data.secondaryUpgrades.map((x, index) => {
                                    const upgrade = UpgradesService.getUpgrade(x.id);
                                    if (!upgrade) return <></>;
                                    if (upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
                                        const char = CharactersService.getUnit(
                                            x.id.slice(Math.max(0, x.id.indexOf('_') + 1))
                                        );
                                        if (char) {
                                            return (
                                                <UnitShardIcon
                                                    key={x.id + index}
                                                    name={x.id}
                                                    icon={char.roundIcon}
                                                    mythic={upgrade.rarity === 'Mythic Shard'}
                                                />
                                            );
                                        }
                                        return <></>;
                                    }
                                    return (
                                        <UpgradeImage
                                            key={x.id + index}
                                            material={x.label}
                                            iconPath={x.iconPath}
                                            rarity={RarityMapper.rarityToRarityString(x.rarity as unknown as Rarity)}
                                            size={40}
                                        />
                                    );
                                })}
                            </div>
                        );
                    }
                },
                width: 150,
            },
        ];
    }, []);

    return (
        <div className="ag-theme-material max-h-[50vh] min-h-[150px] w-full" style={{ height: 50 + rows.length * 45 }}>
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                defaultColDef={{
                    suppressMovable: true,
                    sortable: true,
                }}
                rowHeight={45}
                columnDefs={columnDefs}
                rowData={rows}
            />
        </div>
    );
};
