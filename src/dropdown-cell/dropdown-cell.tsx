import React, { ChangeEvent, Component } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormControl, InputLabel, NativeSelect, SelectChangeEvent } from '@mui/material';
import { Rank } from '../personal-data/personal-data.interfaces';

export class DropdownCell extends Component<any, any> {
    readonly rankEntries: Array<[string, string | Rank]> = Object.entries(Rank);

    constructor(public props: ICellRendererParams & { options: any }) {
        super(props);
        console.log(this.props);
    }

    handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        this.props.data.rank = event.target.value;
    };

    render() {
        return (
            <FormControl fullWidth variant={'filled'}>
                <NativeSelect
                    disableUnderline={true}
                    defaultValue={this.props.data.rank ?? Rank.Undefined}
                    inputProps={{
                        name: 'rank',
                        id: 'uncontrolled-native',
                    }}
                    onChange={this.handleChange}
                >
                    {this.rankEntries.map(([name, value]) => (
                        typeof value === 'number' && (
                            <option key={value} value={value} className={name.toLowerCase()}>{name}</option>
                        )
                    ))}
                </NativeSelect>
            </FormControl>
        );
    }
}