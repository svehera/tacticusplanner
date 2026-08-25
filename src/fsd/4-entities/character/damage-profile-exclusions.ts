import { DamageType } from '@/fsd/5-shared/model';

import { ICharacter2 } from './model';

/**
 * Some abilities' `damageProfile`/`damageProfile_2`/... constants (see
 * `new-ability-data.json`) describe damage the character *reduces or reacts to*, not damage
 * they deal — e.g. a defensive passive that lowers incoming damage of a given type. The
 * character-data pipeline that builds `ICharacterData.damageTypes` (see
 * `characters.service.ts`) can't tell the two cases apart, so it credits the character with
 * dealing that damage type too. That false positive then leaks into any feature that filters
 * characters by damage type — today that's LRE restrictions (`lre/model/filters.ts`'s
 * `byDamageType`, used by both the hand-written `*.le.ts` event files and the generic
 * objective dispatcher); `plan-quests` doesn't filter by damage type today, but would hit the
 * same bug if it ever does.
 *
 * List such cases here, keyed by `snowprintId`, and always check a character's damage types
 * through `characterDealsDamageType` below rather than reading `damageTypes.all` directly, so
 * every consumer gets the correction. Add an entry whenever a character's damage-type
 * membership looks wrong and the root cause is an ability constant describing incoming rather
 * than outgoing damage.
 */
export const damageProfileExclusions: Partial<Record<string, DamageType[]>> = {
    // Modified Exoarmour reduces pierce ratio on incoming attacks *except* Psychic/Direct
    // damage — those two damage types are an exemption clause, not damage Kîmm deals.
    votanChampion: [DamageType.Psychic, DamageType.Direct],
    thousSekhetar: [DamageType.Psychic],
};

/** Whether `char` deals `damageType`, per `damageTypes.all` minus `damageProfileExclusions`. */
export function characterDealsDamageType(char: ICharacter2, damageType: DamageType): boolean {
    const isExcluded = damageProfileExclusions[char.snowprintId]?.includes(damageType) ?? false;
    return !isExcluded && char.damageTypes.all.includes(damageType);
}
