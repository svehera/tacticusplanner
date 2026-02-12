import React from 'react';

import { InventoryItem } from './inventory-item';
import { IUpgradesGroup } from './inventory-models';

interface Props {
    group: IUpgradesGroup;
    showAlphabet: boolean;
    showPlusMinus: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

const UpgradesGroupFn: React.FC<Props> = ({ group, showPlusMinus, showAlphabet, dataUpdate }) => {
    return (
        <section>
            <article>
                {showAlphabet && (
                    <div className="flex flex-wrap justify-center gap-10">
                        <div>
                            {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                            <div className="flex flex-wrap justify-center gap-5">
                                {group.items.map(group => (
                                    <div
                                        key={group.letter}
                                        className="flex flex-wrap items-start justify-center gap-2.5">
                                        <div className="text-2xl font-bold">{group.letter}</div>
                                        {group.subItems.map(item => (
                                            <InventoryItem
                                                key={item.snowprintId}
                                                data={item}
                                                showIncDec={showPlusMinus}
                                                dataUpdate={dataUpdate}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {group.itemsAllCrafted.length > 0 && (
                            <div>
                                <h3>Crafted</h3>
                                <div className="flex flex-wrap justify-center gap-5">
                                    {group.itemsCrafted.map(group => (
                                        <div
                                            key={group.letter}
                                            className="flex flex-wrap items-start justify-center gap-2.5">
                                            <div className="text-2xl font-bold">{group.letter}</div>
                                            {group.subItems.map(item => (
                                                <InventoryItem
                                                    key={item.snowprintId}
                                                    data={item}
                                                    showIncDec={showPlusMinus}
                                                    dataUpdate={dataUpdate}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!showAlphabet && (
                    <div className="flex flex-wrap justify-center gap-10">
                        <div>
                            {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                            <div className="flex flex-wrap justify-center gap-5">
                                {group.itemsAll.map(item => (
                                    <InventoryItem
                                        key={item.snowprintId}
                                        data={item}
                                        showIncDec={showPlusMinus}
                                        dataUpdate={dataUpdate}
                                    />
                                ))}
                            </div>
                        </div>
                        {group.itemsAllCrafted.length > 0 && (
                            <div>
                                <h3>Crafted</h3>
                                <div className="flex flex-wrap justify-center gap-5">
                                    {group.itemsAllCrafted.map(item => (
                                        <InventoryItem
                                            key={item.snowprintId}
                                            data={item}
                                            showIncDec={showPlusMinus}
                                            dataUpdate={dataUpdate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </article>
        </section>
    );
};

export const UpgradesGroup = React.memo(UpgradesGroupFn);
