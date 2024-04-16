import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

import './players-table.css';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { FlexBox } from 'src/v2/components/flex-box';
import { Difficulty, Rank, Rarity } from 'src/models/enums';
import { Badge } from '@mui/material';
import { IGuildRostersResponse } from 'src/v2/features/guild/guild.models';
import { CharactersService } from 'src/v2/features/characters/characters.service';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { mapValues, sum } from 'lodash';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

interface IPlayerRow {
    username: string;
    unlocked: number;
    slots: Record<Rarity, number>;
    trooperPotential: number;
    veteranPotential: number;
    elitePotential: number;
    heroPotential: number;
}

export const PlayersTable = ({ data }: { data: IGuildRostersResponse }) => {
    const tets = GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Easy);
    console.log(tets);
    const rows: IPlayerRow[] = data.guildUsers.map(user => ({
        username: user,
        unlocked: data.userData[user].filter(x => x.rank > Rank.Locked).length,
        slots: CharactersService.groupByRarityPools(data.userData[user]),
        trooperPotential: CharactersService.getRosterPotential(
            data.userData[user],
            GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Easy)
        ),
        veteranPotential: CharactersService.getRosterPotential(
            data.userData[user],
            GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Normal)
        ),
        elitePotential: CharactersService.getRosterPotential(
            data.userData[user],
            GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Hard)
        ),
        heroPotential: CharactersService.getRosterPotential(
            data.userData[user],
            GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.VeryHard)
        ),
    }));

    const [columnDefs] = useState<Array<ColDef<IPlayerRow>>>([
        {
            field: 'username',
            width: 140,
        },
        {
            field: 'unlocked',
            width: 140,
        },
        {
            field: 'slots',
            headerName: 'Rarity pool',
            width: 150,
            valueGetter: (params: ValueGetterParams<IPlayerRow>) => {
                const data = params.data!.slots;

                return sum(Object.values(mapValues(data, (x, y) => x * +y)));
            },
            cellRenderer: (params: ICellRendererParams<IPlayerRow>) => {
                const slots = params.data!.slots;

                return (
                    <FlexBox gap={10} style={{ height: '100%' }}>
                        {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                            const slotsCount = slots[rarity];
                            if (slotsCount) {
                                return (
                                    <Badge key={rarity} badgeContent={slotsCount}>
                                        <RarityImage rarity={rarity} />
                                    </Badge>
                                );
                            }
                        })}
                    </FlexBox>
                );
            },
        },
        {
            field: 'trooperPotential',
            width: 140,
        },
        {
            field: 'veteranPotential',
            width: 140,
        },
        {
            field: 'elitePotential',
            width: 140,
        },
        {
            field: 'heroPotential',
            width: 140,
        },
    ]);

    return (
        <div className="ag-theme-material bf-table">
            <AgGridReact suppressCellFocus={true} columnDefs={columnDefs} rowHeight={40} rowData={rows}></AgGridReact>
        </div>
    );
};
