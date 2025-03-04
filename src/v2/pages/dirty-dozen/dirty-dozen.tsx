import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Info from '@mui/icons-material/Info';

import dirtyDozen from 'src/v2/data/dirtyDozen.json';

import { StoreContext } from 'src/reducers/store.provider';

import { DirtyDozenTable } from 'src/v2/features/dirty-dozen/dirty-dozen-table';
import { IDirtyDozen } from 'src/v2/features/dirty-dozen/dirty-dozen.models';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

export const DirtyDozen = () => {
    const { characters } = useContext(StoreContext);
    const dirtyDozenVersions: IDirtyDozen[] = dirtyDozen;
    const [dirtyDozenVersion, setDirtyDozenVersion] = useState<IDirtyDozen>(dirtyDozenVersions[0]);

    return (
        <>
            <div className="flex items-center gap-3">
                <FormControl>
                    <InputLabel id="demo-simple-select-label">Dirty Dozen Version</InputLabel>
                    <Select<number>
                        id="dirty-dozen-select"
                        label="Dirty Dozen Version"
                        defaultValue={0}
                        onChange={event => setDirtyDozenVersion(dirtyDozenVersions[event.target.value as number])}>
                        {dirtyDozenVersions.map((value, index) => (
                            <MenuItem key={value.version} value={index}>
                                {value.version}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Link to={dirtyDozenVersion.youtubeLink} target={'_blank'} rel="noopener noreferrer">
                    YouTube video
                </Link>
                <div className="flex-row">
                    <Info color="primary" />
                    <span>
                        Hold <strong> Shift </strong> to order by multiple columns
                    </span>
                </div>
            </div>

            <DirtyDozenTable
                characters={characters}
                rows={dirtyDozenVersion.characters}
                columns={dirtyDozenVersion.columns as Array<[string, string]>}
            />
        </>
    );
};
