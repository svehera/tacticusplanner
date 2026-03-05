import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FormControl, FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { uniq } from 'lodash';
import { useContext, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { factionLookup, useQueryState } from '@/fsd/5-shared/lib';
import { RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { Campaign, ICampaignBattleComposed, CampaignLocation, CampaignsService } from '@/fsd/4-entities/campaign';
// eslint-disable-next-line import-x/no-internal-modules
import { IRewards } from '@/fsd/4-entities/campaign/model';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CampaignBattle } from './campaign-battle';
import { CampaignBattleCard } from './campaign-battle-card';
import { CampaignBattleEnemies } from './campaign-battle-enemies';

export const Campaigns = () => {
    const gridReference = useRef<AgGridReact<ICampaignBattleComposed>>(null);
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    /**
     * @returns The ID of the upgrade material (or shards) rewarded when completing this battle.
     */
    const getReward = (rewards: IRewards): string => {
        // Elite battles give a guaranteed material, so return that.
        for (const reward of rewards.guaranteed) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        // Otherwise, return the first potential reward that is not gold.
        for (const reward of rewards.potential) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        return '';
    };

    const [mobileColumnDefs] = useState<Array<ColDef>>([
        {
            headerName: 'Battle',
            pinned: true,
            maxWidth: 100,
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = parameters.data;
                if (location) {
                    return <CampaignLocation key={location.id} location={location} short={true} unlocked={true} />;
                }
            },
        },
        {
            headerName: 'Details',
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = parameters.data;
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
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                const location = parameters.data;
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
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                const { rarityEnum, dropRate } = parameters.data ?? {};
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
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                const { rewards } = parameters.data ?? {};
                if (!rewards) return;
                const reward = getReward(rewards);
                const upgrade = UpgradesService.getUpgrade(reward);
                if (!upgrade) {
                    if (reward.startsWith('shards_')) {
                        const char = CharactersService.getUnit(reward.slice(7));
                        if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                        return reward.slice(7);
                    }
                    if (reward.startsWith('mythicShards_')) {
                        const char = CharactersService.getUnit(reward.slice(13));
                        if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                        return reward.slice(13);
                    }
                    return reward;
                }

                return (
                    <UpgradeImage
                        material={upgrade.label}
                        iconPath={upgrade.iconPath}
                        rarity={RarityMapper.rarityToRarityString(upgrade.rarity)}
                    />
                );
            },
        },
        {
            field: 'slots',
            headerName: 'Slots',
            maxWidth: 80,
            valueGetter: (parameters: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = parameters.data;
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
            valueGetter: (parameters: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = parameters.data;
                if (battle) {
                    return battle.enemiesFactions.map(x => factionLookup[x].name);
                }
            },
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                return (
                    <ul className="m-0 pl-5">
                        {(parameters.value as string[]).map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
        {
            headerName: 'Enemies Types',
            valueGetter: (parameters: ValueGetterParams<ICampaignBattleComposed>) => {
                const battle = parameters.data;
                if (battle) {
                    return battle.enemiesTypes;
                }
            },
            cellRenderer: (parameters: ICellRendererParams<ICampaignBattleComposed>) => {
                if (!parameters.data) {
                    return <></>;
                }
                const battle = parameters.data;
                return battle.detailedEnemyTypes && battle.detailedEnemyTypes.length > 0 ? (
                    <center>
                        <div className="relative">
                            <CampaignBattleEnemies
                                keyPrefix="table"
                                battleId={battle.id}
                                enemies={battle.rawEnemyTypes ?? []}
                                scale={0.2}
                                onEnemyClick={() => {}}
                            />
                        </div>
                    </center>
                ) : (
                    <ul className="m-0 pl-5">
                        {(parameters.value as string[]).map(x => (
                            <li key={x}>{x}</li>
                        ))}
                    </ul>
                );
            },
        },
    ]);

    const [campaign, setCampaign] = useQueryState(
        'campaign',
        initQueryParameter => initQueryParameter ?? Campaign.I,
        value => value.toString()
    );

    const campaignsOptions = useMemo(() => Object.keys(CampaignsService.campaignsGrouped).sort(), []);

    const rows = useMemo(() => CampaignsService.campaignsGrouped[campaign], [campaign]);

    const threeSlotsNodes = uniq(rows.filter(x => x.slots === 3));

    const updateView = (tableView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'campaignsTableView', value: tableView });
    };

    return (
        <div>
            <div>
                <table>
                    <thead></thead>
                </table>
            </div>
            <div className="flex-box gap10 wrap">
                <FormControl className="m-5 w-[250px]">
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

                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.campaignsTableView ?? true}
                            onChange={event => updateView(event.target.checked)}
                        />
                    }
                    label={
                        <div className="flex-box gap5">
                            {viewPreferences.campaignsTableView ? (
                                <TableRowsIcon color="primary" />
                            ) : (
                                <GridViewIcon color="primary" />
                            )}{' '}
                            view
                        </div>
                    }
                />

                {threeSlotsNodes.length > 0 && (
                    <div className="flex-box gap10 wrap">
                        <span className="font-bold"> 3 Slots nodes:</span>
                        {threeSlotsNodes.map(x => (
                            <CampaignLocation key={x.id} location={x} unlocked={true} short={true} />
                        ))}
                    </div>
                )}
            </div>
            {viewPreferences.campaignsTableView ? (
                <div className="ag-theme-material h-[calc(100vh-220px)] w-full">
                    <AgGridReact
                        modules={[AllCommunityModule]}
                        theme={themeBalham}
                        ref={gridReference}
                        suppressCellFocus={true}
                        defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                        columnDefs={isMobile ? mobileColumnDefs : columnDefs}
                        rowData={rows}></AgGridReact>
                </div>
            ) : (
                <div className="flex flex-wrap gap-3">
                    {rows.map(x => (
                        <CampaignBattleCard key={x.id} battle={x} />
                    ))}
                </div>
            )}
        </div>
    );
};
