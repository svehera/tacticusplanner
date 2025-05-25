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
                    <div className="flex gap-10 flex-wrap justify-center">
                        <div>
                            {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                            <div className="flex gap-5 flex-wrap justify-center">
                                {group.items.map(group => (
                                    <div
                                        key={group.letter}
                                        className="flex items-start justify-center flex-wrap gap-2.5">
                                        <div className="text-2xl font-bold">{group.letter}</div>
                                        {group.subItems.map(item => (
                                            <InventoryItem
                                                key={item.material}
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
                                <div className="flex gap-5 flex-wrap justify-center">
                                    {group.itemsCrafted.map(group => (
                                        <div
                                            key={group.letter}
                                            className="flex items-start justify-center flex-wrap gap-2.5">
                                            <div className="text-2xl font-bold">{group.letter}</div>
                                            {group.subItems.map(item => (
                                                <InventoryItem
                                                    key={item.material}
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
                    <div className="flex gap-10 flex-wrap justify-center">
                        <div>
                            {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                            <div className="flex gap-5 flex-wrap justify-center">
                                {group.itemsAll.map(item => (
                                    <InventoryItem
                                        key={item.material}
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
                                <div className="flex gap-5 flex-wrap justify-center">
                                    {group.itemsAllCrafted.map(item => (
                                        <InventoryItem
                                            key={item.material}
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
