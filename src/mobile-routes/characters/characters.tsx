import React, { useState } from 'react';
import { GlobalService } from '../../services';
import { groupBy } from 'lodash';
import { CharacterItem } from './character-item';

export const Characters = () => {
    const [rowsData] = useState(GlobalService.characters);

    const test = groupBy(rowsData, 'faction');
    const itemList = [];

    for (const testKey in test) {
        const chars = test[testKey];
        itemList.push(<div key={testKey}>
            <h4>{testKey}</h4>

            {chars.map((item) => {
                return <CharacterItem key={item.name} character={item}/>;
            })}
        </div>);
    }

    return (
        <div>
            {itemList}
        </div>
    );
};
