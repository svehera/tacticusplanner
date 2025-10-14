import { Alliance, DynamicProps, Rarity, RarityMapper, RarityStars, UnitType } from '@/fsd/5-shared/model';

import { IBaseUpgrade, ICraftedUpgrade, UpgradesService } from '@/fsd/4-entities/upgrade/@x/mow';

import { mows2Data, mowsData } from './data';
import { IMow, IMow2, IMowDb, IMowLevelMaterials, IMowStatic, IMowStatic2 } from './model';

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
            index++;
            if (levels.length && !levels.includes(actualLevel)) {
                continue;
            }

            const mow = this.resolveToStatic(mowId);
            if (!mow) {
                console.error('Mow not found for ID:', mowId);
                continue;
            }

            const primaryUpgrades = mow.primaryAbility.recipes[index]
                .flatMap(upgrade => UpgradesService.getUpgrade(upgrade))
                .filter(x => !!x);
            const secondaryUpgrades = mow.secondaryAbility.recipes[index]
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
                primaryUpgrades,
                secondaryUpgrades,
                rarity: RarityMapper.getRarityFromLevel(actualLevel),
            });
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
        const db: IMowDb = mow as IMowDb;
        const props: DynamicProps = mow as DynamicProps;
        const mow2 = this.resolveToStatic(mow1.tacticusId);
        return { ...mow2!, ...db, ...props } as IMow2;
    }

    /**
     * @returns The static MoW data from json with the specified snowprint ID.
     */
    public static resolveToStatic(id: string): IMowStatic2 | undefined {
        return mows2Data.mows.find(x => x.snowprintId === this.resolveId(id));
    }

    /**
     * @returns All mow data as IMow2 objects. Statically-known MoWs not in `mows` are added as
     * locked units.
     */
    public static resolveAllFromStorage(mows: Array<IMow | IMow2>): IMow2[] {
        const ret = mows.map(mow => {
            if ('snowprintId' in mow) return mow as IMow2;
            return { ...MowsService.resolveToStatic(mow.tacticusId), ...mow } as IMow2;
        });
        // If the user's server data is missing any MoWs, merge them in as locked units.
        mows2Data.mows.forEach(staticMow => {
            if (!ret.find(x => x.snowprintId === staticMow.snowprintId)) {
                ret.push({
                    ...staticMow,
                    faction: staticMow.factionId,
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
        });
        return ret;
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
        return upgrades.recipes.slice(levelStart - 1, levelEnd - 1).flatMap(upgrades => upgrades);
    }

    private static getUpgrades(upgrades: string[]): Array<IBaseUpgrade | ICraftedUpgrade> {
        return upgrades.map(upgrade => UpgradesService.getUpgrade(upgrade)).filter(x => !!x);
    }
}
