import HelpIcon from '@mui/icons-material/Help';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { RankImage } from 'src/v2/components/images/rank-image';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { StarsImage } from 'src/v2/components/images/stars-image';

import { RarityStars, Rarity } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';

import { Rank } from '@/fsd/4-entities/character';

import { rarityCaps } from 'src/v2/features/characters/characters.contants';
import { IRarityCap } from 'src/v2/features/characters/characters.models';

export const PotentialInfo: React.FC = () => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const rarities = [Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common];

    const rows = Object.values(rarityCaps);

    const [columnDefs] = useState<Array<ColDef<IRarityCap>>>([
        {
            field: 'rarity',
            width: 70,
            cellRenderer: (params: ICellRendererParams<IRarityCap, Rarity>) => {
                const { value } = params;

                return <RarityImage rarity={value!} />;
            },
        },
        {
            field: 'rank',
            width: 70,
            cellRenderer: (params: ICellRendererParams<IRarityCap, Rank>) => {
                const { value } = params;

                return <RankImage rank={value!} />;
            },
        },
        {
            field: 'stars',
            width: 100,
            cellRenderer: (params: ICellRendererParams<IRarityCap, RarityStars>) => {
                const { value } = params;

                return <StarsImage stars={value!} />;
            },
        },
        {
            field: 'abilitiesLevel',
            width: 140,
        },
    ]);

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <HelpIcon style={{ cursor: 'pointer' }} color="primary" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Character potential</DialogTitle>
                <DialogContent>
                    <p>The potential(0-100) is calculated based on specific rarity cap:</p>
                    <ul style={{ paddingInlineStart: 20, listStyleType: 'none' }}>
                        {rarities.map(rarity => (
                            <li key={rarity}>
                                <FlexBox gap={5}>
                                    <RarityImage rarity={rarity} /> {Rarity[rarity]}
                                </FlexBox>
                            </li>
                        ))}
                    </ul>
                    <p>and following characters stats:</p>

                    <ul>
                        <li>Rarity</li>
                        <li>Rank</li>
                        <li>Stars</li>
                        <li>Abilities levels</li>
                    </ul>
                    <p>
                        If mentioned character&apos;s stats are above or equal to stats defined by rarity caps (see
                        table below) then character has maximum potential (100)
                    </p>
                    <div className="ag-theme-material" style={{ height: 220 }}>
                        <AgGridReact
                            modules={[AllCommunityModule]}
                            theme={themeBalham}
                            suppressCellFocus={true}
                            columnDefs={columnDefs}
                            rowHeight={35}
                            rowData={rows}></AgGridReact>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
