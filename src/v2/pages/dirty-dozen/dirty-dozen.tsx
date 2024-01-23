import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Info from '@mui/icons-material/Info';

import dirtyDozen from 'src/v2/data/dirtyDozen.json';

import { StoreContext } from 'src/reducers/store.provider';

import { DirtyDozenTable } from 'src/v2/features/dirty-dozen/dirty-dozen-table';
import { IDirtyDozenChar } from 'src/v2/features/dirty-dozen/dirty-dozen.models';

export const DirtyDozen = () => {
    const { characters } = useContext(StoreContext);
    const rows: IDirtyDozenChar[] = dirtyDozen;

    return (
        <>
            <div>
                <span>
                    Based on{' '}
                    <Link
                        to={'https://www.youtube.com/watch?v=uRsbtrb0nks'}
                        target={'_blank'}
                        rel="noopener noreferrer">
                        Nandi&apos;s infographics
                    </Link>{' '}
                    (January 2024)
                </span>
            </div>
            <div className="flex-row">
                <Info color="primary" />
                <span>
                    Hold <strong> Shift </strong> to order by multiple columns
                </span>
            </div>

            <DirtyDozenTable characters={characters} rows={rows} />
        </>
    );
};
