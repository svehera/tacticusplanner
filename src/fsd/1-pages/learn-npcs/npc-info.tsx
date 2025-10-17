import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useRef, useState } from 'react';

import { getEnumValues, useFitGridOnWindowResize } from '@/fsd/5-shared/lib';
import { Rank, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl, StarsSelect } from '@/fsd/5-shared/ui';

import { RankSelect } from '@/fsd/4-entities/character';
import { FactionImage } from '@/fsd/4-entities/faction';
import { INpcData, NpcService } from '@/fsd/4-entities/npc';
import { StatsCalculatorService, StatCell } from '@/fsd/4-entities/unit';

export const NpcInfo: React.FC = () => {
    const gridRef = useRef<AgGridReact<INpcData>>(null);
    const [stars, setStars] = useState<RarityStars>(RarityStars.None);
    const [rank, setRank] = useState<Rank>(Rank.Stone1);

    const onStarsChange = (value: RarityStars) => {
        setStars(value);
    };

    const onRankChange = (value: Rank) => {
        setRank(value);
    };

    const columnDefs = useMemo(
        (): Array<ColDef> => [
            {
                headerName: 'Icon',
                maxWidth: 80,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined) return <></>;
                    const imageUrl = getImageUrl(NpcService.getNpcIconPath(npc.name));
                    return <img src={imageUrl} width={60} height={80} />;
                },
            },
            { headerName: 'Name', field: 'name', maxWidth: 200 },
            { headerName: 'Alliance', field: 'alliance', maxWidth: 80 },
            {
                headerName: 'Faction',
                maxWidth: 150,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined) return <></>;
                    return (
                        <div className={'inline-block align-middle'}>
                            <FactionImage faction={npc.faction} />
                            <span className={'inline-block align-middle'}>{npc.faction}</span>
                        </div>
                    );
                },
            },
            {
                headerName: 'Stats',
                colId: 'Stats',
                maxWidth: 100,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined) return <></>;
                    return (
                        <div>
                            <StatCell
                                npc={npc.name}
                                rank={rank}
                                rarityStars={stars}
                                numHealthUpgrades={0}
                                numDamageUpgrades={0}
                                numArmorUpgrades={0}
                            />
                        </div>
                    );
                },
            },
            {
                headerName: 'Melee',
                maxWidth: 150,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined) return <></>;
                    return (
                        <ul>
                            <li>Type: {npc.meleeType}</li>
                            <li>Hits: {npc.meleeHits}</li>
                        </ul>
                    );
                },
            },
            {
                headerName: 'Range',
                maxWidth: 150,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.range == undefined) return <></>;
                    return (
                        <ul>
                            <li>Type: {npc.rangeType!}</li>
                            <li>Hits: {npc.rangeHits!}</li>
                            <li>Range: {npc.range!}</li>
                        </ul>
                    );
                },
            },
            {
                headerName: 'Crit',
                maxWidth: 100,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.critChance == undefined) return <></>;
                    return (
                        <ul>
                            <li>Chance: {npc.critChance! * 100}%</li>
                            <li>
                                Damage:
                                {StatsCalculatorService.calculateStat(npc.critDamage!, npc.name, stars, rank, 0)}
                            </li>
                        </ul>
                    );
                },
            },
            {
                headerName: 'Block',
                maxWidth: 100,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.blockChance == undefined) return <></>;
                    return (
                        <ul>
                            <li>Chance: {npc.blockChance! * 100}%</li>
                            <li>
                                Damage:
                                {StatsCalculatorService.calculateStat(npc.blockDamage!, npc.name, stars, rank, 0)}
                            </li>
                        </ul>
                    );
                },
            },
            {
                headerName: 'Traits',
                maxWidth: 100,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.traits.length == 0) return <></>;
                    return (
                        <ul key={npc.name + ' traits'}>
                            {npc.traits && npc!.traits.map(trait => <li key={npc.name + ' ' + trait}>{trait}</li>)}
                        </ul>
                    );
                },
            },
            {
                headerName: 'Active Abilities',
                maxWidth: 200,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.activeAbilities.length == 0) return <></>;
                    return (
                        <ul key={npc.name + ' active abilities'}>
                            {npc.activeAbilities &&
                                npc!.activeAbilities.map(ability => <li key={npc.name + ' ' + ability}>{ability}</li>)}
                        </ul>
                    );
                },
            },
            {
                headerName: 'Passive Abilities',
                maxWidth: 200,
                cellRenderer: (params: ICellRendererParams<INpcData>) => {
                    const npc = params.data;
                    if (npc == undefined || npc.passiveAbilities.length == 0) return <></>;
                    return (
                        <ul key={npc.name + ' passive abilities'}>
                            {npc.passiveAbilities &&
                                npc!.passiveAbilities.map(ability => <li key={npc.name + ' ' + ability}>{ability}</li>)}
                        </ul>
                    );
                },
            },
        ],
        [rank, stars]
    );

    return (
        <div>
            <div className="flex gap-[3px] justify-left">
                <div style={{ width: 100 }}>
                    <StarsSelect
                        label={'Target Stars'}
                        starsValues={getEnumValues(RarityStars)}
                        value={stars}
                        valueChanges={value => onStarsChange(value)}
                    />
                </div>
                <div style={{ width: 200 }}>
                    <RankSelect
                        label={'Target Rank'}
                        rankValues={getEnumValues(Rank).filter(x => x !== Rank.Locked)}
                        value={rank}
                        valueChanges={value => onRankChange(value)}
                    />
                </div>
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                    columnDefs={columnDefs}
                    rowData={NpcService.npcDataFull}
                    onGridReady={useFitGridOnWindowResize(gridRef)}></AgGridReact>
            </div>
        </div>
    );
};
