import React from 'react';
import { InventoryItem } from 'src/routes/inventory-item';
import { IUpgradesGroup } from './inventory-models';

interface Props {
    group: IUpgradesGroup;
    showAlphabet: boolean;
    showPlusMinus: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

const UpgradesGroupFn: React.FC<Props> = ({ group, showPlusMinus, showAlphabet, dataUpdate }) => {
    return (
        <section className="flex flex-col gap-1.5">
            <article>
                {showAlphabet && (
                    <div className="flex-box gap20" style={{ justifyContent: 'center' }}>
                        <div>
                            <div className="flex gap-5 flex-wrap justify-center">
                                {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
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
                            <div className="flex gap-5 flex-wrap justify-center">
                                <h3>Crafted</h3>
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
                        )}
                    </div>
                )}

                {!showAlphabet && (
                    <div className="flex-box gap20">
                        <div></div>
                        <div className="flex gap-5 flex-wrap justify-center">
                            {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                            {group.itemsAll.map(item => (
                                <InventoryItem
                                    key={item.material}
                                    data={item}
                                    showIncDec={showPlusMinus}
                                    dataUpdate={dataUpdate}
                                />
                            ))}
                        </div>
                        {group.itemsAllCrafted.length > 0 && (
                            <div className="flex gap-5 flex-wrap justify-center">
                                <h3>Crafted</h3>
                                {group.itemsAllCrafted.map(item => (
                                    <InventoryItem
                                        key={item.material}
                                        data={item}
                                        showIncDec={showPlusMinus}
                                        dataUpdate={dataUpdate}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </article>
        </section>
    );
};

export const UpgradesGroup = React.memo(UpgradesGroupFn);
