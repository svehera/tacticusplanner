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
                width: 80,
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
                width: 110,
            },
            {
                field: 'primaryUpgrades',
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
                                {data.primaryUpgrades.map(x => (
                                    <UpgradeImage
                                        key={x.id}
                                        material={x.label}
                                        iconPath={x.iconPath}
                                        rarity={x.rarity}
                                        size={30}
                                    />
                                ))}
                            </div>
                        );
                    }
                },
                width: 120,
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
                cellRenderer: (params: ICellRendererParams<IMowLevelMaterials>) => {
                    const { data } = params;
                    if (data) {
                        return (
                            <div className="flex-box gap3">
                                {data.secondaryUpgrades.map(x => (
                                    <UpgradeImage
                                        key={x.id}
                                        material={x.label}
                                        iconPath={x.iconPath}
                                        rarity={x.rarity}
                                        size={30}
                                    />
                                ))}
                            </div>
                        );
                    }
                },
                width: 120,
            },
        ];
    }, []);

    return (
        <div
            className="ag-theme-material"
            style={{
                height: 50 + rows.length * 35,
                minHeight: 150,
                maxHeight: '40vh',
                width: '100%',
            }}>
            <AgGridReact
                defaultColDef={{
                    suppressMovable: true,
                    sortable: true,
                    // wrapText: true,
                    // autoHeight: true,
                }}
                rowHeight={35}
                columnDefs={columnDefs}
                rowData={rows}
            />
        </div>
    );
};
