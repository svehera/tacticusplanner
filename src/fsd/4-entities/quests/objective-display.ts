/* eslint-disable import-x/no-internal-modules */
import damageNames from '@/fsd/5-shared/l10n/data/en/damage_type_names.json';
import factionNames from '@/fsd/5-shared/l10n/data/en/faction_names.json';
import traitNames from '@/fsd/5-shared/l10n/data/en/trait_names.json';
import { FactionId } from '@/fsd/5-shared/model';

export interface IQuestObjective {
    ObjectiveType: string;
    ObjectiveTarget?: string | number;
}

export interface IObjectiveDisplay {
    /** Key into `snowprintIcons`, when the objective has an icon there. */
    iconKey?: string;
    /** Faction whose emblem is the icon (NotFaction). */
    factionId?: FactionId;
    /** Restrictions (things the player must not do) are drawn with a red cross over the icon. */
    isRestriction: boolean;
    label: string;
    description: string;
}

/** Traits whose icon isn't `snowprintIcons['trait' + id]`. */
const TRAIT_ICON_KEY_OVERRIDES: Record<string, string> = {
    MkXGravis: 'traitMkGravis',
    Psyker: 'traitPsychic',
    FinalJustice: 'traitFinalVengeance',
};

const lookupName = (names: Record<string, string>, id: string): string => names[id] || id;

export function getObjectiveDisplay(objective: IQuestObjective): IObjectiveDisplay {
    const target = String(objective.ObjectiveTarget ?? '');

    switch (objective.ObjectiveType) {
        case 'NotTrait': {
            const name = lookupName(traitNames, target);
            return {
                iconKey: TRAIT_ICON_KEY_OVERRIDES[target] ?? `trait${target}`,
                isRestriction: true,
                label: `No ${name}`,
                description: `Don't deploy units with the ${name} trait.`,
            };
        }
        case 'NotFaction': {
            const name = lookupName(factionNames, target);
            return {
                factionId: target as FactionId,
                isRestriction: true,
                label: `No ${name}`,
                description: `Don't deploy units from ${name}.`,
            };
        }
        case 'NotDamageType': {
            const name = lookupName(damageNames, target);
            return {
                iconKey: `damage${target}`,
                isRestriction: true,
                label: `No ${name}`,
                description: `Don't deploy units that deal ${name} damage.`,
            };
        }
        case 'DamageType': {
            const name = lookupName(damageNames, target);
            return {
                iconKey: `damage${target}`,
                isRestriction: false,
                label: name,
                description: `Every deployed unit must deal ${name} damage.`,
            };
        }
        case 'HasRangedAttack': {
            return {
                iconKey: 'rangedAttack',
                isRestriction: false,
                label: 'Ranged attack',
                description: 'Every deployed unit must have a ranged attack.',
            };
        }
        case 'MaxHits': {
            return {
                iconKey: 'questScoreHits',
                isRestriction: false,
                label: `≤${target} hits`,
                description: `Every deployed unit's attack must have at most ${target} hits.`,
            };
        }
        case 'MinHits': {
            return {
                iconKey: 'questScoreHits',
                isRestriction: false,
                label: `≥${target} hits`,
                description: `Every deployed unit's attack must have at least ${target} hits.`,
            };
        }
        case 'UseNoSummons': {
            return {
                iconKey: 'traitSummon',
                isRestriction: true,
                label: 'No summons',
                description: "Don't use summons.",
            };
        }
        case 'DoNoHealOrRepair': {
            return {
                iconKey: 'traitHealer',
                isRestriction: true,
                label: 'No heal or repair',
                description: "Don't heal or repair any unit.",
            };
        }
        case 'NoDamageTakenByAnyHero': {
            return {
                iconKey: 'questDamageBurst',
                isRestriction: true,
                label: 'No damage taken',
                description: 'No hero may take damage.',
            };
        }
        default: {
            return { isRestriction: false, label: objective.ObjectiveType, description: objective.ObjectiveType };
        }
    }
}
