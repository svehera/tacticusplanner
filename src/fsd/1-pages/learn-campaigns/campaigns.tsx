﻿import { FormControl, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { uniq } from 'lodash';
import React, { useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { useFitGridOnWindowResize, useQueryState } from '@/fsd/5-shared/lib';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { Campaign, ICampaignBattleComposed, CampaignLocation, CampaignsService } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CampaignBattle } from './campaign-battle';
import { CampaignBattleEnemies } from './campaign-battle-enemies';

export const Campaigns = () => {
    const gridRef = useRef<AgGridReact<ICampaignBattleComposed>>(null);

    const [mobileColumnDefs] = useState<Array<ColDef>>([
        {
            headerName: 'Battle',
            pinned: true,
            maxWidth: 100,
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = params.data;
                if (location) {
                    return <CampaignLocation key={location.id} location={location} short={true} unlocked={true} />;
                }
            },
        },
        {
            headerName: 'Details',
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = params.data;
                if (location) {
                    return <CampaignBattle key={location.id} battle={location} scale={0.5} />;
                }
            },
        },
    ]);

    const [columnDefs] = useState<Array<ColDef>>([
        {
            headerName: 'Battle',
            pinned: true,
            maxWidth: 100,
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = params.data;
                if (location) {
                    return <CampaignLocation key={location.id} location={location} short={true} unlocked={true} />;
                }
            },
        },
        {
            field: 'energyCost',
            headerName: 'Energy Cost',
            maxWidth: 120,
        },
        {
            field: 'dailyBattleCount',
            headerName: 'Battles Count',
            maxWidth: 120,
        },
        {
            field: 'dropRate',
            headerName: 'Drop Rate',
            maxWidth: 120,
        },
        {
            field: 'rarityEnum',
            headerName: 'Rarity',
            maxWidth: 80,
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                const { rarityEnum, dropRate } = params.data ?? {};
                if (typeof rarityEnum === 'number' && rarityEnum >= 0) {
                    return <RarityIcon rarity={rarityEnum} />;
                } else if (dropRate) {
                    return 'Shard';
                }
            },
        },
        {
            field: 'reward',
            headerName: 'Reward',
            minWidth: 170,
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                const { reward } = params.data ?? {};
                if (!reward) return undefined;
                const upgrade = UpgradesService.getUpgrade(reward);
                if (!upgrade) return reward;

                if (upgrade.stat !== 'Shard') {
                    return <UpgradeImage material={upgrade.label} iconPath={upgrade.iconPath} />;
                }

                const char = upgrade.stat === 'Shard' && CharactersService.getUnit(reward);
                if (char) return <UnitShardIcon name={reward} icon={char.icon} />;

                return reward;
            },
        },
        {
            field: 'slots',
            headerName: 'Slots',
            maxWidth: 80,
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                return battle?.slots ?? 5;
            },
        },
        {
            field: 'enemiesTotal',
            headerName: 'Enemies total',
            maxWidth: 120,
        },
        {
            headerName: 'Enemies Factions',
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                if (battle) {
                    return battle.enemiesFactions;
                }
            },
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                return (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {(params.value as string[]).map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
        {
            headerName: 'Enemies Types',
            valueGetter: (params: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = params.data;
                if (battle) {
                    return battle.enemiesTypes;
                }
            },
            cellRenderer: (params: ICellRendererParams<ICampaignBattleComposed>) => {
                if (!params.data) {
                    return <></>;
                }
                const battle = params.data;
                if (battle.detailedEnemyTypes && battle.detailedEnemyTypes.length > 0) {
                    return (
                        <center>
                            <div style={{ position: 'relative' }}>
                                <CampaignBattleEnemies enemies={battle.detailedEnemyTypes} scale={0.2} />
                            </div>
                        </center>
                    );
                } else {
                    return (
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {(params.value as string[]).map(x => (
                                <li key={x}>{x}</li>
                            ))}
                        </ul>
                    );
                }
            },
        },
    ]);

    const [campaign, setCampaign] = useQueryState(
        'campaign',
        initQueryParam => initQueryParam ?? Campaign.I,
        value => value.toString()
    );

    const campaignsOptions = useMemo(() => Object.keys(CampaignsService.campaignsGrouped).sort(), []);

    const rows = useMemo(() => CampaignsService.campaignsGrouped[campaign], [campaign]);

    const uniqEnemiesFactions = uniq(rows.flatMap(x => x.enemiesFactions));
    const uniqEnemiesTypes = uniq(rows.flatMap(x => x.enemiesTypes));
    const threeSlotsNodes = uniq(rows.filter(x => x.slots === 3));

    return (
        <div>
            <div className="flex-box gap10 wrap">
                <FormControl style={{ width: 250, margin: 20 }}>
                    <InputLabel>Campaign</InputLabel>
                    <Select
                        label={'Campaign'}
                        value={campaign}
                        onChange={event => setCampaign(event.target.value as Campaign)}>
                        {campaignsOptions.map(value => (
                            <MenuItem key={value} value={value}>
                                {value} ({CampaignsService.campaignsGrouped[value].length})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <div>
                    <span className="bold"> Enemies factions:</span>{' '}
                    {uniqEnemiesFactions.map(x => (
                        <FactionImage key={x} faction={x} />
                    ))}
                </div>

                <div>
                    <span className="bold"> Enemies types:</span>{' '}
                    <span style={{ fontSize: 11 }}>{uniqEnemiesTypes.join(', ')}</span>
                </div>

                {!!threeSlotsNodes.length && (
                    <div className="flex-box gap10 wrap">
                        <span className="bold"> 3 Slots nodes:</span>
                        {threeSlotsNodes.map(x => (
                            <CampaignLocation key={x.id} location={x} unlocked={true} short={true} />
                        ))}
                    </div>
                )}
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                    columnDefs={isMobile ? mobileColumnDefs : columnDefs}
                    rowData={rows}
                    onGridReady={useFitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
