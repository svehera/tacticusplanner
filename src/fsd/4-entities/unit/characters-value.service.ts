import { cloneDeep, sum } from 'lodash';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { RarityStars, Rarity, Rank, rankToString } from '@/fsd/5-shared/model';

import { ICharacterRankRange, rankUpData } from '@/fsd/4-entities/character/@x/unit';
import { IMaterialFull, IMaterialRecipeIngredientFull, UpgradesService } from '@/fsd/4-entities/upgrade/@x/unit';

import { IUnit } from './model';
import { isCharacter, isUnlocked } from './units.functions';

export class CharactersValueService {
    public static getCharacterValue(unit: IUnit): number {
        if (!isUnlocked(unit) || !isCharacter(unit)) {
            return 0;
        }

        const valueLevel =
            CharactersValueService.getUnlockValue(unit.initialRarity, unit.name) +
            CharactersValueService.getExperienceValue(unit.level) +
            CharactersValueService.getAbilityValue(unit.activeAbilityLevel) +
            CharactersValueService.getAbilityValue(unit.passiveAbilityLevel) +
            CharactersValueService.getStarsValue(unit.stars) -
            CharactersValueService.getInitialStarsValue(unit.initialRarity) +
            CharactersValueService.getRarityValue(unit.rarity) -
            CharactersValueService.getRarityValue(unit.initialRarity) +
            CharactersValueService.getRankValue(unit.name, unit.rank, unit.upgrades);
        return Math.round(valueLevel);
    }

    public static getUpgrades(...characters: Array<ICharacterRankRange>): IMaterialFull[] {
        const rankEntries: number[] = getEnumValues(Rank).filter(x => x > 0);
        const result: IMaterialFull[] = [];
        let priority = 0;
        for (const character of characters) {
            priority++;
            const characterUpgrades = rankUpData[character.id];
            if (!characterUpgrades) {
                continue;
            }
            const ranksRange = rankEntries.filter(r => r >= character.rankStart && r <= character.rankEnd);

            const rankUpgrades = ranksRange
                .flatMap((rank, index) => {
                    const result = characterUpgrades[rankToString(rank)] ?? [];
                    return index === ranksRange.length - 1
                        ? result.filter(x => character.appliedUpgrades.includes(x))
                        : result;
                })
                .filter(x => !!x);

            if (!rankUpgrades.length) {
                continue;
            }

            const upgrades: IMaterialFull[] = rankUpgrades.map(upgrade => {
                const recipe = UpgradesService.recipeDataFull[upgrade];
                if (!recipe) {
                    return {
                        snowprintId: '',
                        rarity: 0,
                        craftable: false,
                        iconPath: upgrade,
                        stat: 'Unknown',
                        id: upgrade,
                        label: upgrade,
                        character: character.id,
                        priority,
                        recipe: [],
                        allMaterials: [],
                    };
                }
                return {
                    ...cloneDeep(recipe),
                    priority,
                    character: character.id,
                };
            });

            result.push(...upgrades);
        }

        return result;
    }

    public static getRankValue(name: string, currentRank: Rank, appliedUpgrades: string[]): number {
        const MaterialBS: { [key: string]: number } = {
            0: 5, // Common
            1: 10, // Uncommon
            2: 25, // Rare
            3: 60, // Epic
            4: 150, // Legendary
            // Mythic value estimated with AI, unsure of original source
            5: 375, // Mythic
        };

        const upgrades = CharactersValueService.getUpgrades({
            id: name,
            rankStart: Rank.Stone1,
            rankEnd: currentRank,
            appliedUpgrades: appliedUpgrades,
            rankPoint5: false,
        });

        const result: IMaterialRecipeIngredientFull[] = UpgradesService.groupBaseMaterials(upgrades, true);
        return Math.ceil(
            sum(
                result
                    // filter out Gold and an undefined labels
                    .filter(x => x.label !== undefined && x.label !== 'Gold')
                    .map(x => x.count * MaterialBS[x.rarity])
            )
        );
    }

    public static getUnlockValue(initialRarity: number, name: string): number {
        const defaultCharacters: string[] = ['Varro Tigurius', 'Certus', 'Bellator', 'Incisus', 'Vindicta'];
        if (defaultCharacters.includes(name)) {
            return 0;
        }
        const ShardBS = 35;

        switch (initialRarity) {
            case Rarity.Common:
                return ShardBS * 40;
            case Rarity.Uncommon:
                return ShardBS * 80;
            case Rarity.Rare:
                return ShardBS * 130;
            case Rarity.Epic:
                return ShardBS * 250;
            case Rarity.Legendary:
                return ShardBS * 500;
        }

        console.warn('Initial Rarity unknown');
        return 0;
    }

    public static getExperienceValue(level: number): number {
        const ExpBS = 175 / 12500;

        switch (level) {
            case 1:
                return 0;
            case 2:
                return ExpBS * 25;
            case 3:
                return ExpBS * 60;
            case 4:
                return ExpBS * 120;
            case 5:
                return ExpBS * 200;
            case 6:
                return ExpBS * 300;
            case 7:
                return ExpBS * 420;
            case 8:
                return ExpBS * 560;
            case 9:
                return ExpBS * 720;
            case 10:
                return ExpBS * 900;
            case 11:
                return ExpBS * 1100;
            case 12:
                return ExpBS * 1350;
            case 13:
                return ExpBS * 1650;
            case 14:
                return ExpBS * 2000;
            case 15:
                return ExpBS * 2400;
            case 16:
                return ExpBS * 2850;
            case 17:
                return ExpBS * 3350;
            case 18:
                return ExpBS * 3950;
            case 19:
                return ExpBS * 4700;
            case 20:
                return ExpBS * 5600;
            case 21:
                return ExpBS * 6700;
            case 22:
                return ExpBS * 8100;
            case 23:
                return ExpBS * 9900;
            case 24:
                return ExpBS * 12200;
            case 25:
                return ExpBS * 15200;
            case 26:
                return ExpBS * 19200;
            case 27:
                return ExpBS * 24700;
            case 28:
                return ExpBS * 32200;
            case 29:
                return ExpBS * 42200;
            case 30:
                return ExpBS * 55200;
            case 31:
                return ExpBS * 72200;
            case 32:
                return ExpBS * 94200;
            case 33:
                return ExpBS * 122200;
            case 34:
                return ExpBS * 157200;
            case 35:
                return ExpBS * 200200;
            case 36:
                return ExpBS * 252200;
            case 37:
                return ExpBS * 314200;
            case 38:
                return ExpBS * 387200;
            case 39:
                return ExpBS * 472200;
            case 40:
                return ExpBS * 570200;
            case 41:
                return ExpBS * 682200;
            case 42:
                return ExpBS * 809200;
            case 43:
                return ExpBS * 952200;
            case 44:
                return ExpBS * 1112200;
            case 45:
                return ExpBS * 1290200;
            case 46:
                return ExpBS * 1487200;
            case 47:
                return ExpBS * 1704200;
            case 48:
                return ExpBS * 1942200;
            case 49:
                return ExpBS * 2202200;
            case 50:
                return ExpBS * 2485200;
            default: {
                console.warn('Level unknown');
                return 0;
            }
        }
    }

    public static getAbilityValue(level: number): number {
        const CoinBS = 780 / 60000;
        const CommonBadgeBS = 70 / 5;
        const UncommonBadgeBS = 30;
        const RareBadgeBS = 60;
        const EpicBadgeBS = 120;
        const LegendaryBadgeBS = 240;

        let tally = 0;

        if (level >= 2) {
            tally += CommonBadgeBS * 1 + CoinBS * 25;
        }
        if (level >= 3) {
            tally += CommonBadgeBS * 1 + CoinBS * 50;
        }
        if (level >= 4) {
            tally += CommonBadgeBS * 1 + CoinBS * 100;
        }
        if (level >= 5) {
            tally += CommonBadgeBS * 2 + CoinBS * 150;
        }
        if (level >= 6) {
            tally += CommonBadgeBS * 2 + CoinBS * 200;
        }
        if (level >= 7) {
            tally += CommonBadgeBS * 2 + CoinBS * 300;
        }
        if (level >= 8) {
            tally += CommonBadgeBS * 3 + CoinBS * 400;
        }
        if (level >= 9) {
            tally += UncommonBadgeBS * 1 + CoinBS * 500;
        }
        if (level >= 10) {
            tally += UncommonBadgeBS * 1 + CoinBS * 600;
        }
        if (level >= 11) {
            tally += UncommonBadgeBS * 1 + CoinBS * 700;
        }
        if (level >= 12) {
            tally += UncommonBadgeBS * 2 + CoinBS * 800;
        }
        if (level >= 13) {
            tally += UncommonBadgeBS * 2 + CoinBS * 900;
        }
        if (level >= 14) {
            tally += UncommonBadgeBS * 2 + CoinBS * 1000;
        }
        if (level >= 15) {
            tally += UncommonBadgeBS * 3 + CoinBS * 1250;
        }
        if (level >= 16) {
            tally += UncommonBadgeBS * 4 + CoinBS * 1500;
        }
        if (level >= 17) {
            tally += UncommonBadgeBS * 5 + CoinBS * 1750;
        }
        if (level >= 18) {
            tally += RareBadgeBS * 1 + CoinBS * 2000;
        }
        if (level >= 19) {
            tally += RareBadgeBS * 1 + CoinBS * 2500;
        }
        if (level >= 20) {
            tally += RareBadgeBS * 1 + CoinBS * 3000;
        }
        if (level >= 21) {
            tally += RareBadgeBS * 2 + CoinBS * 3500;
        }
        if (level >= 22) {
            tally += RareBadgeBS * 2 + CoinBS * 4000;
        }
        if (level >= 23) {
            tally += RareBadgeBS * 2 + CoinBS * 4500;
        }
        if (level >= 24) {
            tally += RareBadgeBS * 3 + CoinBS * 5000;
        }
        if (level >= 25) {
            tally += RareBadgeBS * 4 + CoinBS * 5500;
        }
        if (level >= 26) {
            tally += RareBadgeBS * 5 + CoinBS * 6000;
        }
        if (level >= 27) {
            tally += EpicBadgeBS * 1 + CoinBS * 6500;
        }
        if (level >= 28) {
            tally += EpicBadgeBS * 1 + CoinBS * 7000;
        }
        if (level >= 29) {
            tally += EpicBadgeBS * 1 + CoinBS * 7500;
        }
        if (level >= 30) {
            tally += EpicBadgeBS * 2 + CoinBS * 8000;
        }
        if (level >= 31) {
            tally += EpicBadgeBS * 2 + CoinBS * 8500;
        }
        if (level >= 32) {
            tally += EpicBadgeBS * 2 + CoinBS * 9000;
        }
        if (level >= 33) {
            tally += EpicBadgeBS * 3 + CoinBS * 9500;
        }
        if (level >= 34) {
            tally += EpicBadgeBS * 4 + CoinBS * 10000;
        }
        if (level >= 35) {
            tally += EpicBadgeBS * 5 + CoinBS * 11000;
        }
        if (level >= 36) {
            tally += LegendaryBadgeBS * 1 + CoinBS * 12000;
        }
        if (level >= 37) {
            tally += LegendaryBadgeBS * 1 + CoinBS * 13000;
        }
        if (level >= 38) {
            tally += LegendaryBadgeBS * 1 + CoinBS * 14000;
        }
        if (level >= 39) {
            tally += LegendaryBadgeBS * 2 + CoinBS * 15000;
        }
        if (level >= 40) {
            tally += LegendaryBadgeBS * 2 + CoinBS * 16000;
        }
        if (level >= 41) {
            tally += LegendaryBadgeBS * 2 + CoinBS * 18000;
        }
        if (level >= 42) {
            tally += LegendaryBadgeBS * 3 + CoinBS * 20000;
        }
        if (level >= 43) {
            tally += LegendaryBadgeBS * 3 + CoinBS * 22500;
        }
        if (level >= 44) {
            tally += LegendaryBadgeBS * 4 + CoinBS * 25000;
        }
        if (level >= 45) {
            tally += LegendaryBadgeBS * 5 + CoinBS * 30000;
        }
        if (level >= 46) {
            tally += LegendaryBadgeBS * 6 + CoinBS * 40000;
        }
        if (level >= 47) {
            tally += LegendaryBadgeBS * 7 + CoinBS * 50000;
        }
        if (level >= 48) {
            tally += LegendaryBadgeBS * 8 + CoinBS * 75000;
        }
        if (level >= 49) {
            tally += LegendaryBadgeBS * 9 + CoinBS * 100000;
        }
        if (level >= 50) {
            tally += LegendaryBadgeBS * 10 + CoinBS * 250000;
        }
        return tally;
    }

    public static getStarsValue(stars: RarityStars): number {
        const ShardBS = 35;
        const LegendaryOrbBS = 2800 / 3;

        switch (stars) {
            case RarityStars.None:
                return 0;
            case RarityStars.OneStar:
                return ShardBS * 10;
            case RarityStars.TwoStars:
                return ShardBS * 25;
            case RarityStars.ThreeStars:
                return ShardBS * 40;
            case RarityStars.FourStars:
                return ShardBS * 55;
            case RarityStars.FiveStars:
                return ShardBS * 85;
            case RarityStars.RedOneStar:
                return ShardBS * 125;
            case RarityStars.RedTwoStars:
                return ShardBS * 190;
            case RarityStars.RedThreeStars:
                return ShardBS * 275;
            case RarityStars.RedFourStars:
                return ShardBS * 425 + LegendaryOrbBS * 10;
            case RarityStars.RedFiveStars:
                return ShardBS * 675 + LegendaryOrbBS * 15;
            case RarityStars.OneBlueStar:
                return ShardBS * 1175 + LegendaryOrbBS * 20;
            // TODO(mythic): Implement other blue stars and Mythic Wings value
            default: {
                console.warn('Stars value unknown');
                return 0;
            }
        }
    }

    public static getInitialStarsValue(rarity: Rarity): number {
        const ShardBS = 35;

        switch (rarity) {
            case Rarity.Common:
                return 0;
            case Rarity.Uncommon:
                return ShardBS * 25;
            case Rarity.Rare:
                return ShardBS * 55;
            case Rarity.Epic:
                return ShardBS * 125;
            case Rarity.Legendary:
                return ShardBS * 275;
            default: {
                console.warn('Rarity value unknown');
                return 0;
            }
        }
    }

    public static getRarityValue(rarity: Rarity): number {
        const ShardBS = 35;
        const UncommonOrbBS = 210 / 3;
        const RareOrbBS = 490 / 3;
        const EpicOrbBS = 1143 / 3;
        const LegendaryOrbBS = 2800 / 3;
        // Mythic value estimated via AI, unsure of original source of values
        const MythicOrbBS = 6720 / 3;

        switch (rarity) {
            case Rarity.Common:
                return 0;
            case Rarity.Uncommon:
                return ShardBS * 15 + UncommonOrbBS * 10;
            case Rarity.Rare:
                return ShardBS * 20 + RareOrbBS * 10;
            case Rarity.Epic:
                return ShardBS * 50 + EpicOrbBS * 10;
            case Rarity.Legendary:
                return ShardBS * 100 + LegendaryOrbBS * 10;
            case Rarity.Mythic:
                // Mythic values were invented to get a rough idea. I have no idea where the pre-Mythic
                // value calcs come from, so unable to replicate the same logic here.
                return ShardBS * 200 + MythicOrbBS * 10;
            default: {
                console.warn('Rarity value unknown');
                return 0;
            }
        }
    }
}
