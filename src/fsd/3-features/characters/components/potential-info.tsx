import HelpIcon from '@mui/icons-material/Help';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { rarityCaps } from '@/fsd/3-features/characters/characters.constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IRarityCap } from '@/fsd/3-features/characters/characters.models';

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

                return <RarityIcon rarity={value!} />;
            },
        },
        {
            field: 'rank',
            width: 70,
            cellRenderer: (params: ICellRendererParams<IRarityCap, Rank>) => {
                const { value } = params;

                return <RankIcon rank={value!} />;
            },
        },
        {
            field: 'stars',
            width: 100,
            cellRenderer: (params: ICellRendererParams<IRarityCap, RarityStars>) => {
                const { value } = params;

                return <StarsIcon stars={value!} />;
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
                <HelpIcon className="cursor-pointer" color="primary" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Character potential</DialogTitle>
                <DialogContent>
                    <p>The potential(0-100) is calculated based on specific rarity cap:</p>
                    <ul className="list-none ps-5">
                        {rarities.map(rarity => (
                            <li key={rarity}>
                                <FlexBox gap={5}>
                                    <RarityIcon rarity={rarity} /> {Rarity[rarity]}
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
                    <div className="ag-theme-material h-55">
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
