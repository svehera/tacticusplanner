import React, { useMemo } from 'react';
import { ShardsItemInput } from 'src/v2/features/goals/shards-item-input';
import { MaterialItemInput } from 'src/v2/features/goals/material-item-input';
import { IItemRaidLocation, IShardsRaid, IUpgradeRaid } from 'src/v2/features/goals/goals.models';
import { sum } from 'lodash';
import { isMobile } from 'react-device-detect';
import { MiscIcon } from 'src/v2/components/images/misc-image';

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
            <p style={{ fontSize: isMobile ? 16 : 20 }}>
                Today (<b>{energySpent}</b> <MiscIcon icon={'energy'} height={15} width={15} /> spent |{' '}
                <b>{raidsCount}</b> raids done)
            </p>
            <div className="flex-box gap2 wrap start" style={{ marginTop: 10, justifyContent: 'center' }}>
                {unStartedShardsRaids.map(shardsRaid => (
                    <div className="item-raids" key={shardsRaid.characterId}>
                        <ShardsItemInput shardsRaid={shardsRaid} handleAdd={addShards} />
                    </div>
                ))}
                {upgradesRaids.map((raid, index) => (
                    <div className="item-raids" key={raid.id + index}>
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
