import React, { useMemo } from 'react';
import { ShardsItemInput } from 'src/v2/features/goals/shards-item-input';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';
import { IItemRaidLocation, IShardsRaid, IUpgradeRaid } from 'src/v2/features/goals/goals.models';
import { sum } from 'lodash';
import { isMobile } from 'react-device-detect';

interface Props {
    completedLocations: IItemRaidLocation[];
    shardsRaids: IShardsRaid[];
    upgradesRaids: IUpgradeRaid[];
    addShards: (characterId: string, value: number, location: IItemRaidLocation) => void;
    addUpgrades: (upgradeId: string, value: number, location: IItemRaidLocation) => void;
}

export const TodayRaids: React.FC<Props> = ({
    completedLocations,
    shardsRaids,
    upgradesRaids,
    addUpgrades,
    addShards,
}) => {
    const energySpent = sum(completedLocations.map(x => x.energySpent));
    const raidsCount = sum(completedLocations.map(x => x.raidsCount));

    const unStartedShardsRaids = useMemo(() => {
        return shardsRaids.filter(x => x.locations.length && x.locations.every(location => !location.isCompleted));
    }, [shardsRaids]);

    const startedShardsRaids = useMemo(() => {
        return shardsRaids.filter(x => x.locations.length && x.locations.some(location => location.isCompleted));
    }, [shardsRaids]);

    return (
        <>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
                Today raids ({energySpent} energy spent | {raidsCount} raids done)
            </h2>
            <div className="flex-box gap2 wrap start" style={{ marginTop: 10 }}>
                {unStartedShardsRaids.map(shardsRaid => (
                    <div className="item-raids" key={shardsRaid.characterId}>
                        <ShardsItemInput shardsRaid={shardsRaid} handleAdd={addShards} />
                    </div>
                ))}
                {upgradesRaids.map(raid => (
                    <div className="item-raids" key={raid.id}>
                        <MaterialItemInput
                            acquiredCount={raid.acquiredCount ?? 0}
                            upgradeRaid={raid}
                            addCount={(value, location) => {
                                raid.acquiredCount += value;
                                addUpgrades(raid.id, value, location);
                            }}
                        />
                    </div>
                ))}
                {startedShardsRaids.map(shardsRaid => (
                    <div className="item-raids" key={shardsRaid.characterId}>
                        <ShardsItemInput shardsRaid={shardsRaid} handleAdd={addShards} />
                    </div>
                ))}
            </div>
        </>
    );
};
