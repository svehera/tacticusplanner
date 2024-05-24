import React, { useMemo } from 'react';
import { IMowLevelMaterials } from 'src/v2/features/lookup/lookup.models';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { ComponentImage } from 'src/v2/components/images/component-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';
import { BadgeImage } from 'src/v2/components/images/badge-image';
import { ForgeBadgeImage } from 'src/v2/components/images/forge-badge-image';
import { UpgradeImage } from 'src/shared-components/upgrade-image';

interface Props {
    rows: IMowLevelMaterials[];
}

export const MowMaterialsTable: React.FC<Props> = ({ rows }) => {
    const columnDefs = useMemo<Array<ColDef<IMowLevelMaterials>>>(() => {
        return [
            {
                field: 'level',
                maxWidth: 60,
            },
            {
                field: 'badges',
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
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
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
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
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return data.forgeBadges > 0 ? (
                            <div className="flex-box gap3">
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
                valueFormatter: params => {
                    const { data } = params;
                    return data?.primaryUpgrades.map(x => x.id).join(', ') ?? '';
                },
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
                                {data.primaryUpgrades.map((x, index) => (
                                    <UpgradeImage
                                        key={x.id + index}
                                        material={x.label}
                                        iconPath={x.iconPath}
                                        rarity={x.rarity}
                                        size={40}
                                    />
                                ))}
                            </div>
                        );
                    }
                },
                width: 150,
            },
            {
                field: 'gold',
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { value } = params;
                    return numberToThousandsString(value);
                },
                width: 60,
            },
            {
                field: 'secondaryUpgrades',
                valueFormatter: params => {
                    const { data } = params;
                    return data?.secondaryUpgrades.map(x => x.id).join(', ') ?? '';
                },
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
                                {data.secondaryUpgrades.map((x, index) => (
                                    <UpgradeImage
                                        key={x.id + index}
                                        material={x.label}
                                        iconPath={x.iconPath}
                                        rarity={x.rarity}
                                        size={40}
                                    />
                                ))}
                            </div>
                        );
                    }
                },
                width: 150,
            },
        ];
    }, []);

    return (
        <div
            className="ag-theme-material"
            style={{
                height: 50 + rows.length * 45,
                minHeight: 150,
                maxHeight: '50vh',
                width: '100%',
            }}>
            <AgGridReact
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
