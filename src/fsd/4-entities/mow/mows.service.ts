import { Alliance, DynamicProps, Rarity, RarityMapper, RarityStars, UnitType } from '@/fsd/5-shared/model';

import { UpgradesService } from '@/fsd/4-entities/upgrade/@x/mow';

import { mows2Data, mowsData } from './data';
import { IMow, IMow2, IMowDatabase, IMowLevelMaterials, IMowStatic, IMowStatic2 } from './model';

export class MowsService {
    public static getMowMaterialsList(mow: IMow2): IMowLevelMaterials[] {
        return this.getMaterialsList(mow.snowprintId, mow.name, mow.alliance as Alliance);
    }
    public static getMaterialsList(
        mowId: string,
        mowLabel: string,
        mowAlliance: Alliance,
        levels: number[] = []
    ): IMowLevelMaterials[] {
        const result: IMowLevelMaterials[] = [];

        let index = 0;
        for (const lvlUpgrade of mows2Data.upgradeCosts) {
            const actualLevel = index + 2;
            if (levels.length > 0 && !levels.includes(actualLevel)) {
                index++;
                continue;
            }

            const mow = this.resolveToStatic(mowId);
            if (!mow) {
                console.error('Mow not found for ID:', mowId);
                continue;
            }

            if (index >= mow.primaryAbility.recipes.length || index >= mow.secondaryAbility.recipes.length) {
                console.error(
                    'mow:',
                    mowId,
                    'index:',
                    index,
                    'actualLevel:',
                    actualLevel,
                    'primarylen:',
                    mow.primaryAbility.recipes.length,
                    'secondarylen:',
                    mow.secondaryAbility.recipes.length
                );
            }
            const primaryUpgrades = mow.primaryAbility.recipes[
                Math.max(0, Math.min(index, mow.primaryAbility.recipes.length - 1))
            ]
                .flatMap(upgrade => UpgradesService.getUpgrade(upgrade))
                .filter(x => !!x);
            const secondaryUpgrades = mow.secondaryAbility.recipes[
                Math.max(0, Math.min(index, mow.secondaryAbility.recipes.length - 1))
            ]
                .flatMap(upgrade => UpgradesService.getUpgrade(upgrade))
                .filter(x => !!x);

            result.push({
                ...lvlUpgrade,
                level: actualLevel,
                mowId,
                mowLabel,
                mowAlliance,
                salvage: lvlUpgrade.salvage,
                badges: lvlUpgrade.badges.amount,
                forgeBadges: lvlUpgrade.forgeBadges ? lvlUpgrade.forgeBadges.amount : 0,
                orbs: 0,
                primaryUpgrades,
                secondaryUpgrades,
                rarity: RarityMapper.getRarityFromLevel(actualLevel),
            });
            index++;
        }

        return result;
    }

    public static resolveId(id: string): string {
        const mow = mows2Data.mows.find(x => x.snowprintId === id);
        if (mow) return mow.snowprintId;
        return id;
    }

    public static toMow2(mow: IMow | IMow2): IMow2 {
        if ('snowprintId' in mow) return { ...(mow as IMow2), shortName: mow.name } as IMow2;

        const mow1 = mow as IMowStatic;
        const database: IMowDatabase = mow as IMowDatabase;
        const props: DynamicProps = mow as DynamicProps;
        const mow2 = this.resolveToStatic(mow1.tacticusId);
        return { ...mow2!, ...database, ...props } as IMow2;
    }

    /**
     * @returns The static MoW data from json with the specified snowprint ID.
     */
    public static resolveToStatic(id: string): IMowStatic2 | undefined {
        const staticData = mows2Data.mows.find(x => x.snowprintId === this.resolveId(id));
        if (staticData) {
            return staticData;
        }
        return this.resolveOldIdToStatic(id);
    }

    /**
     * @returns All mow data as IMow2 objects. Statically-known MoWs not in `mows` are added as
     * locked units.
     */
    public static resolveAllFromStorage(mows: Array<IMow | IMow2>): IMow2[] {
        const returnValue = mows.map(mow => {
            if ('snowprintId' in mow) return mow as IMow2;
            return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
        });
        // If the user's server data is missing any MoWs, merge them in as locked units.
        for (const staticMow of mows2Data.mows) {
            if (!returnValue.some(x => x.snowprintId === staticMow.snowprintId)) {
                returnValue.push({
                    ...staticMow,
                    id: staticMow.snowprintId,
                    unlocked: false,
                    primaryAbilityLevel: 1,
                    secondaryAbilityLevel: 1,
                    level: 1,
                    rarity: Rarity.Common,
                    stars: RarityStars.None,
                    shards: 0,
                    mythicShards: 0,
                    unitType: UnitType.mow,
                } as IMow2);
            }
        }
        return returnValue;
    }

    public static resolveOldIdToStatic(id: string): IMowStatic2 | undefined {
        const oldMow = mowsData.find(x => x.id == id);
        if (!oldMow) return undefined;
        return mows2Data.mows.find(x => x.snowprintId === oldMow.tacticusId);
    }

    /**
     * @returns The raw (potentially crafted) upgrade materials for the mow.
     * Upgrades can be repeated if they are needed multiple times.
     */
    public static getUpgradesRaw(
        mowId: string,
        levelStart: number,
        levelEnd: number,
        key: 'primary' | 'secondary'
    ): Array<string> {
        const mow = this.resolveToStatic(mowId);
        if (mow === undefined) {
            return [];
        }
        const upgrades = key === 'primary' ? mow.primaryAbility : mow.secondaryAbility;
        return upgrades.recipes.slice(levelStart - 1, levelEnd - 1).flat();
    }
}
