import { IHeaderParams } from 'ag-grid-community';
import React from 'react';

const CustomTableHeader = (props: IHeaderParams & { onHeaderClick: (props: IHeaderParams) => void }) => {
    return (
        <div onClick={() => props.onHeaderClick(props)}>
            <div className="customHeaderLabel">{props.displayName}</div>
        </div>
    );
};

export default CustomTableHeader;