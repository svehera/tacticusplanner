import { Button, FormControl, FormControlLabel, InputLabel, Select, Switch, TextField } from '@mui/material';
import { useState } from 'react';

const MORTY_ARMOR = 2335;
const TRAJANN_HIT_BUFF = 2;
const TRAJANN_DAMAGE_BUFF = 1310;
const KARIYAN_BUFF_PER_HIT_PERCENTAGE = 0.33;
const HMH_ACTIVE_BUFF = 1796;
const HMH_ACTIVE_PIERCE_BUFF = 0.2;
const HMH_PASSIVE_BUFF = 596;
const HIGH_GROUND_BUFF_PERCENTAGE = 1.5;
const BEAST_SLAYER_BUFF_PERCENTAGE = 1.2;
const ATLACOYA_BUFF = 1.2;
const BOSS_BUFF = 952;
const BOSS_HITS_BUFF = 1;
const MORTY_TRAIT_DEBUFF = 0.5;
const CRUSHING_STRIKE_BUFF = 1.5;
const MOW_MOD = 1.2;

enum RollType {
    MAXIMUM,
    MINIMUM,
    AVERAGE,
}

interface DamageMods {
    enabled: boolean;
    trajannBuff: boolean;
    hmhActiveBuff: boolean;
    hmhPassiveBuff: boolean;
    atlacoyaBuff: boolean;
    bossBuff: boolean;
    highGround: boolean;
    mowBuff: boolean;
    crit: number; // The amount of crit damage per hit.
    rollType: RollType;
}

interface Attack {
    name: string;
    hits: number[];
    atlaBuffPerHit: number[];
    hmhBuffPerHit: number[];
}

interface CharacterLineProps {
    name: string;
    critDamage: number;
    damageMods: DamageMods;
    onDamageModsChange: (newMods: DamageMods) => void;
}

const CharacterLine = ({ name, critDamage, damageMods, onDamageModsChange }: CharacterLineProps) => {
    const handleChange = (field: keyof DamageMods, value: boolean | number) => {
        onDamageModsChange({ ...damageMods, [field]: value });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <FormControlLabel
                control={
                    <Switch checked={damageMods.enabled} onChange={e => handleChange('enabled', e.target.checked)} />
                }
                label=""
            />
            <div className="w-40 font-bold">{name}:</div>
            {[
                { label: 'Trajann Buff', field: 'trajannBuff' },
                { label: 'HMH Active', field: 'hmhActiveBuff' },
                { label: 'HMH Passive', field: 'hmhPassiveBuff' },
                { label: 'Atlacoya Buff', field: 'atlacoyaBuff' },
                { label: 'Boss Buff', field: 'bossBuff' },
                { label: 'High Ground', field: 'highGround' },
                { label: 'MoW +20%', field: 'mowBuff' },
            ].map(({ label, field }) => (
                <FormControlLabel
                    disabled={!damageMods.enabled}
                    key={field}
                    control={
                        <Switch
                            checked={!!damageMods[field as keyof DamageMods]}
                            onChange={e => handleChange(field as keyof DamageMods, e.target.checked)}
                        />
                    }
                    label={label}
                />
            ))}
            <FormControlLabel
                disabled={!damageMods.enabled}
                control={
                    <Switch
                        checked={damageMods.crit > 0}
                        onChange={e => handleChange('crit', e.target.checked ? critDamage : 0)}
                    />
                }
                label={`Crit (${critDamage})`}
            />
            <FormControl className="w-32" size="small" disabled={!damageMods.enabled}>
                <InputLabel variant="outlined">Roll Type</InputLabel>
                <Select
                    native
                    label="Roll Type"
                    value={damageMods.rollType}
                    onChange={e => handleChange('rollType', Number(e.target.value))}>
                    <option value={RollType.MINIMUM}>Minimum</option>
                    <option value={RollType.AVERAGE}>Average</option>
                    <option value={RollType.MAXIMUM}>Maximum</option>
                </Select>
            </FormControl>
        </div>
    );
};

export const NerdMath = () => {
    const [kariyanActiveState, setKariyanActiveState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: false,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [kariyanPassiveState, setKariyanPassiveState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [trajannMeleeState, setTrajannMeleeState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [bossMeleeState, setBossMeleeState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: true,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [bossPassiveState, setBossPassiveState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [hmhMeleeState, setHmhMeleeState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: false,
        hmhActiveBuff: true,
        hmhPassiveBuff: true,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [hmhRangeState, setHmhRangeState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: false,
        hmhActiveBuff: true,
        hmhPassiveBuff: true,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [atlacoyaActiveState, setAtlacoyaActiveState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: false,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: true,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [laviscusActiveState, setLaviscusActiveState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [laviscusMeleeState, setLaviscusMeleeState] = useState<DamageMods>({
        enabled: true,
        trajannBuff: true,
        hmhActiveBuff: false,
        hmhPassiveBuff: false,
        atlacoyaBuff: false,
        bossBuff: false,
        highGround: false,
        mowBuff: false,
        crit: 0,
        rollType: RollType.MAXIMUM,
    });
    const [highGroundState, setHighGroundState] = useState<boolean>(false);
    const [mowState, setMowState] = useState<boolean>(false);
    const [critState, setCritState] = useState<boolean>(false);
    const [rollTypeState, setRollTypeState] = useState<RollType>(RollType.MAXIMUM);
    const [bossArmor, setBossArmor] = useState<number>(MORTY_ARMOR);
    const [morty, setMorty] = useState<boolean>(true);

    const getBaseDamage = (min: number, max: number, rollType: RollType): number => {
        return rollType === RollType.MAXIMUM ? max : rollType === RollType.MINIMUM ? min : (min + max) / 2;
    };

    const getPreArmorDamage = (baseDamage: number, damageMods: DamageMods): number => {
        return (
            baseDamage +
            damageMods.crit +
            (damageMods.trajannBuff ? TRAJANN_DAMAGE_BUFF : 0) +
            (damageMods.hmhActiveBuff ? HMH_ACTIVE_BUFF : 0) +
            (damageMods.hmhPassiveBuff ? HMH_PASSIVE_BUFF : 0) +
            (damageMods.bossBuff ? BOSS_BUFF : 0)
        );
    };

    const getPreModDamage = (basePierce: number, preArmorDamage: number, damageMods: DamageMods): number => {
        const pierce = Math.min(basePierce + (damageMods.hmhActiveBuff ? HMH_ACTIVE_PIERCE_BUFF : 0), 1);
        const damageViaPierce = preArmorDamage * pierce;
        const damageViaArmor = preArmorDamage - bossArmor;
        return Math.max(damageViaPierce, damageViaArmor);
    };

    const applyMortyTrait = (damage: number, totalHits: number): number[] => {
        const hits: number[] = [];
        for (let i = 0; i < totalHits; ++i) {
            let hitDamage = damage;
            for (let hit = 3; hit <= i; ++hit) {
                hitDamage *= MORTY_TRAIT_DEBUFF;
            }
            hits.push(hitDamage);
        }
        return hits;
    };

    const calculatePreModDamage = (
        minBaseDamage: number,
        maxBaseDamage: number,
        basePierce: number,
        damageMods: DamageMods
    ): number => {
        const baseDamage = getBaseDamage(minBaseDamage, maxBaseDamage, damageMods.rollType);
        const preArmorDamage = getPreArmorDamage(baseDamage, damageMods);
        return getPreModDamage(basePierce, preArmorDamage, damageMods);
    };

    const kariyanActive = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(5712, 7140, 0.5, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            BEAST_SLAYER_BUFF_PERCENTAGE *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(
            damagePerHit * mods,
            3 + TRAJANN_HIT_BUFF * (damageMods.trajannBuff ? 1 : 0) + (damageMods.bossBuff ? BOSS_HITS_BUFF : 0)
        );
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = kariyanActive(newDamageMods);
            return {
                name: 'Kariyan Active (with HMH)',
                hits: hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = kariyanActive(newDamageMods);
            return {
                name: 'Kariyan Active (with Atlacoya)',
                hits: hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Kariyan Active',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const kariyanPassive = (damageMods: DamageMods, kariyanHits: number): Attack => {
        const damagePerHit = calculatePreModDamage(5712, 7140, 0.8, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            BEAST_SLAYER_BUFF_PERCENTAGE *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1) *
            (1 + KARIYAN_BUFF_PER_HIT_PERCENTAGE * kariyanHits);
        const hits = applyMortyTrait(
            damagePerHit * mods,
            1 + TRAJANN_HIT_BUFF * (damageMods.trajannBuff ? 1 : 0) + (damageMods.bossBuff ? BOSS_HITS_BUFF : 0)
        );
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = kariyanPassive(newDamageMods, kariyanHits);
            return {
                name: 'Kariyan Passive (with HMH)',
                hits: hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = kariyanPassive(newDamageMods, kariyanHits);
            return {
                name: 'Kariyan Passive (with Atlacoya)',
                hits: hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Kariyan Passive',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };
    const hmhMelee = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(1821 * 0.8, 1821 * 1.2, 0.4, damageMods);
        const mods = (damageMods.mowBuff ? MOW_MOD : 1) * (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 6 + (damageMods.bossBuff ? BOSS_HITS_BUFF : 0));
        if (damageMods.hmhPassiveBuff || damageMods.hmhActiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = hmhMelee(newDamageMods);
            return {
                name: 'HMH Melee (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        return {
            name: 'HMH Melee',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const hmhRange = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(1821 * 0.8, 1821 * 1.2, 0.2, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 3);
        if (damageMods.hmhPassiveBuff || damageMods.hmhActiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = hmhRange(newDamageMods);
            return {
                name: 'HMH Range (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = hmhRange(newDamageMods);
            return {
                name: 'HMH Range (with Atlacoya)',
                hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'HMH Range',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const trajannMelee = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(1336 * 0.8, 1336 * 1.2, 0.8, damageMods);
        const mods =
            CRUSHING_STRIKE_BUFF *
            (damageMods.mowBuff ? MOW_MOD : 1) *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 3 + (damageMods.bossBuff ? 1 : 0));
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = trajannMelee(newDamageMods);
            return {
                name: 'Trajann Melee (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = trajannMelee(newDamageMods);
            return {
                name: 'Trajann Melee (with Atlacoya)',
                hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Trajann Melee',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const bossMelee = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(3158 * 0.8, 3158 * 1.2, 0.5, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 2 + (damageMods.bossBuff ? BOSS_HITS_BUFF : 0));
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = bossMelee(newDamageMods);
            return {
                name: 'Boss Melee (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = bossMelee(newDamageMods);
            return {
                name: 'Boss Melee (with Atlacoya)',
                hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Boss Melee',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const bossPassive = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(1786, 2380, 0.15, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 3 + (damageMods.trajannBuff ? TRAJANN_HIT_BUFF : 0));
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = bossPassive(newDamageMods);
            return {
                name: 'Boss Passive (with Atlacoya)',
                hits: hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Boss Passive',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const atlacoyaActive = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(5712, 7140, 1, damageMods);
        const mods =
            (damageMods.mowBuff ? MOW_MOD : 1) *
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const ret: number[] = [];
        for (let i = 0; i < 1 + TRAJANN_HIT_BUFF * (damageMods.trajannBuff ? 1 : 0); ++i) {
            ret.push(damagePerHit * mods);
        }
        const hits = ret;
        return {
            name: 'Atlacoya Active',
            hits,
            atlaBuffPerHit: hits.map(hit => hit / 1.2),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const laviscusActive = (damageMods: DamageMods): Attack => {
        const damagePerHit = calculatePreModDamage(4760, 5712, 0.4, damageMods);
        const mods =
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) * (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = applyMortyTrait(damagePerHit * mods, 1 + TRAJANN_HIT_BUFF * (damageMods.trajannBuff ? 1 : 0));
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = laviscusActive(newDamageMods);
            return {
                name: 'Laviscus Active (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = laviscusActive(newDamageMods);
            return {
                name: 'Laviscus Active (with Atlacoya)',
                hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Laviscus Active',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const laviscusMelee = (damageMods: DamageMods, allOtherCharacterAttacks: number[][]): Attack => {
        const outrage = allOtherCharacterAttacks.map(arr => Math.max(...arr)).reduce((a, b) => a + b, 0);
        const baseDamage = 4860 + outrage * 1.2;
        const damagePerHit = calculatePreModDamage(baseDamage * 0.8, baseDamage * 1.2, 0.4, damageMods);
        const mods =
            (damageMods.highGround ? HIGH_GROUND_BUFF_PERCENTAGE : 1) *
            CRUSHING_STRIKE_BUFF *
            (damageMods.atlacoyaBuff ? ATLACOYA_BUFF : 1);
        const hits = [damagePerHit * mods, damageMods.bossBuff ? damagePerHit * mods * BOSS_HITS_BUFF : null].filter(
            (x): x is number => x !== null
        );
        if (damageMods.hmhActiveBuff || damageMods.hmhPassiveBuff) {
            const newDamageMods = { ...damageMods, hmhActiveBuff: false, hmhPassiveBuff: false };
            const hits2 = laviscusMelee(newDamageMods, allOtherCharacterAttacks);
            return {
                name: 'Laviscus Melee (with HMH)',
                hits,
                atlaBuffPerHit: hits.map(_ => 0),
                hmhBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
            };
        }
        if (damageMods.atlacoyaBuff) {
            const newDamageMods = { ...damageMods, atlacoyaBuff: false };
            const hits2 = laviscusMelee(newDamageMods, allOtherCharacterAttacks);
            return {
                name: 'Laviscus Melee (with Atlacoya)',
                hits,
                atlaBuffPerHit: hits.map((_, index) => hits[index] - hits2.hits[index]),
                hmhBuffPerHit: hits.map(_ => 0),
            };
        }
        return {
            name: 'Laviscus Melee',
            hits,
            atlaBuffPerHit: hits.map(_ => 0),
            hmhBuffPerHit: hits.map(_ => 0),
        };
    };

    const allAttacksExceptLaviscusMelee: Attack[] =
        [
            kariyanActiveState.enabled ? kariyanActive(kariyanActiveState) : null,
            kariyanPassiveState.enabled ? kariyanPassive(kariyanPassiveState, 5) : null,
            trajannMeleeState.enabled ? trajannMelee(trajannMeleeState) : null,
            bossMeleeState.enabled ? bossMelee(bossMeleeState) : null,
            bossPassiveState.enabled ? bossPassive(bossPassiveState) : null,
            hmhMeleeState.enabled ? hmhMelee(hmhMeleeState) : null,
            hmhRangeState.enabled ? hmhRange(hmhRangeState) : null,
            atlacoyaActiveState.enabled ? atlacoyaActive(atlacoyaActiveState) : null,
            laviscusActiveState.enabled ? laviscusActive(laviscusActiveState) : null,
        ].filter((attack): attack is Attack => attack !== null) ?? [];
    const outrage = allAttacksExceptLaviscusMelee.map(arr => Math.max(...arr.hits)).reduce((a, b) => a + b, 0);
    const allAttacks =
        [
            ...allAttacksExceptLaviscusMelee,
            laviscusMeleeState.enabled
                ? laviscusMelee(
                      laviscusMeleeState,
                      allAttacksExceptLaviscusMelee.map(a => a.hits)
                  )
                : null,
        ].filter((attack): attack is Attack => attack !== null) ?? [];

    const setToMaxHmh = () => {
        setKariyanActiveState({
            enabled: true,
            trajannBuff: false,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2706,
            rollType: RollType.MAXIMUM,
        });
        setKariyanPassiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2706,
            rollType: RollType.MAXIMUM,
        });
        setTrajannMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2185,
            rollType: RollType.MAXIMUM,
        });
        setBossMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: true,
            highGround: true,
            mowBuff: true,
            crit: 1561,
            rollType: RollType.MAXIMUM,
        });
        setBossPassiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 1561,
            rollType: RollType.MAXIMUM,
        });
        setHmhMeleeState({
            enabled: true,
            trajannBuff: false,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 1561,
            rollType: RollType.MAXIMUM,
        });
        setHmhRangeState(prev => ({ ...prev, enabled: false }));
        setAtlacoyaActiveState(prev => ({ ...prev, enabled: false }));
        setLaviscusActiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2082,
            rollType: RollType.MAXIMUM,
        });
        setLaviscusMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: true,
            hmhPassiveBuff: true,
            atlacoyaBuff: false,
            bossBuff: true,
            highGround: true,
            mowBuff: true,
            crit: 2082 + 952,
            rollType: RollType.MAXIMUM,
        });
    };

    const setToMaxAtlacoya = () => {
        setKariyanActiveState({
            enabled: true,
            trajannBuff: false,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2706,
            rollType: RollType.MAXIMUM,
        });
        setKariyanPassiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2706,
            rollType: RollType.MAXIMUM,
        });
        setTrajannMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2185,
            rollType: RollType.MAXIMUM,
        });
        setBossMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: true,
            highGround: true,
            mowBuff: true,
            crit: 1561,
            rollType: RollType.MAXIMUM,
        });
        setBossPassiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 1561,
            rollType: RollType.MAXIMUM,
        });
        setHmhMeleeState(prev => ({ ...prev, enabled: false }));
        setHmhRangeState(prev => ({ ...prev, enabled: false }));
        setAtlacoyaActiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2706,
            rollType: RollType.MAXIMUM,
        });
        setLaviscusActiveState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: false,
            highGround: true,
            mowBuff: true,
            crit: 2082,
            rollType: RollType.MAXIMUM,
        });
        setLaviscusMeleeState({
            enabled: true,
            trajannBuff: true,
            hmhActiveBuff: false,
            hmhPassiveBuff: false,
            atlacoyaBuff: true,
            bossBuff: true,
            highGround: true,
            mowBuff: true,
            crit: 2082 + 952,
            rollType: RollType.MAXIMUM,
        });
    };

    const toggleHighGround = () => {
        const hg = highGroundState;
        setHighGroundState(prev => !prev);
        setKariyanActiveState(prev => ({ ...prev, highGround: !hg }));
        setKariyanPassiveState(prev => ({ ...prev, highGround: !hg }));
        setTrajannMeleeState(prev => ({ ...prev, highGround: !hg }));
        setBossMeleeState(prev => ({ ...prev, highGround: !hg }));
        setBossPassiveState(prev => ({ ...prev, highGround: !hg }));
        setHmhMeleeState(prev => ({ ...prev, highGround: !hg }));
        setHmhRangeState(prev => ({ ...prev, highGround: !hg }));
        setAtlacoyaActiveState(prev => ({ ...prev, highGround: !hg }));
        setLaviscusActiveState(prev => ({ ...prev, highGround: !hg }));
        setLaviscusMeleeState(prev => ({ ...prev, highGround: !hg }));
    };

    const toggleMow = () => {
        const mow = mowState;
        setMowState(!mow);
        setKariyanActiveState(prev => ({ ...prev, mowBuff: !mow }));
        setKariyanPassiveState(prev => ({ ...prev, mowBuff: !mow }));
        setTrajannMeleeState(prev => ({ ...prev, mowBuff: !mow }));
        setBossMeleeState(prev => ({ ...prev, mowBuff: !mow }));
        setBossPassiveState(prev => ({ ...prev, mowBuff: !mow }));
        setHmhMeleeState(prev => ({ ...prev, mowBuff: !mow }));
        setHmhRangeState(prev => ({ ...prev, mowBuff: !mow }));
        setAtlacoyaActiveState(prev => ({ ...prev, mowBuff: !mow }));
        setLaviscusActiveState(prev => ({ ...prev, mowBuff: !mow }));
        setLaviscusMeleeState(prev => ({ ...prev, mowBuff: !mow }));
    };

    const toggleCrit = () => {
        const crit = critState;
        setCritState(!crit);
        setKariyanActiveState(prev => ({ ...prev, crit: crit ? 0 : 2706 }));
        setKariyanPassiveState(prev => ({ ...prev, crit: crit ? 0 : 2706 }));
        setTrajannMeleeState(prev => ({ ...prev, crit: crit ? 0 : 2185 }));
        setBossMeleeState(prev => ({ ...prev, crit: crit ? 0 : 1561 }));
        setBossPassiveState(prev => ({ ...prev, crit: crit ? 0 : 1561 }));
        setHmhMeleeState(prev => ({ ...prev, crit: crit ? 0 : 1561 }));
        setHmhRangeState(prev => ({ ...prev, crit: crit ? 0 : 1561 }));
        setAtlacoyaActiveState(prev => ({ ...prev, crit: crit ? 0 : 2706 }));
        setLaviscusActiveState(prev => ({ ...prev, crit: crit ? 0 : 2082 }));
        setLaviscusMeleeState(prev => ({ ...prev, crit: crit ? 0 : 2082 + 952 }));
    };

    const changeRollType = () => {
        const newRollType =
            rollTypeState === RollType.MAXIMUM
                ? RollType.MINIMUM
                : rollTypeState === RollType.MINIMUM
                  ? RollType.AVERAGE
                  : RollType.MAXIMUM;
        setRollTypeState(newRollType);
        setKariyanActiveState(prev => ({ ...prev, rollType: newRollType }));
        setKariyanPassiveState(prev => ({ ...prev, rollType: newRollType }));
        setTrajannMeleeState(prev => ({ ...prev, rollType: newRollType }));
        setBossMeleeState(prev => ({ ...prev, rollType: newRollType }));
        setBossPassiveState(prev => ({ ...prev, rollType: newRollType }));
        setHmhMeleeState(prev => ({ ...prev, rollType: newRollType }));
        setHmhRangeState(prev => ({ ...prev, rollType: newRollType }));
        setAtlacoyaActiveState(prev => ({ ...prev, rollType: newRollType }));
        setLaviscusActiveState(prev => ({ ...prev, rollType: newRollType }));
        setLaviscusMeleeState(prev => ({ ...prev, rollType: newRollType }));
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="contained" color="primary" onClick={setToMaxHmh}>
                    Max HMH
                </Button>
                <Button variant="contained" color="primary" onClick={setToMaxAtlacoya}>
                    Max Atlacoya
                </Button>
                <Button variant="contained" color="primary" onClick={toggleHighGround}>
                    {highGroundState ? 'Disable High Ground' : 'Enable High Ground'}
                </Button>
                <Button variant="contained" color="primary" onClick={toggleMow}>
                    {mowState ? 'Disable MoW Buff' : 'Enable MoW Buff'}
                </Button>
                <Button variant="contained" color="primary" onClick={toggleCrit}>
                    {critState ? 'Disable Crit' : 'Enable Crit'}
                </Button>
                <Button variant="contained" color="primary" onClick={changeRollType}>
                    Change Roll Type to{' '}
                    {rollTypeState === RollType.MAXIMUM
                        ? 'Minimum'
                        : rollTypeState === RollType.MINIMUM
                          ? 'Average'
                          : 'Maximum'}
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <TextField
                    type="number"
                    label="Boss Armor"
                    value={bossArmor}
                    onChange={e => setBossArmor(Number(e.target.value))}
                    variant="outlined"
                    size="small"
                />
                <FormControlLabel
                    control={<Switch checked={morty} onChange={e => setMorty(e.target.checked)} />}
                    label="Morty?"
                />
            </div>
            <div>
                <CharacterLine
                    name="Kariyan Active"
                    critDamage={2706}
                    damageMods={kariyanActiveState}
                    onDamageModsChange={setKariyanActiveState}
                />
                <CharacterLine
                    name="Kariyan Passive"
                    critDamage={2706}
                    damageMods={kariyanPassiveState}
                    onDamageModsChange={setKariyanPassiveState}
                />
                <CharacterLine
                    name="Trajann Melee"
                    critDamage={2185}
                    damageMods={trajannMeleeState}
                    onDamageModsChange={setTrajannMeleeState}
                />
                <CharacterLine
                    name="Boss Melee"
                    critDamage={1561}
                    damageMods={bossMeleeState}
                    onDamageModsChange={setBossMeleeState}
                />
                <CharacterLine
                    name="Boss Passive"
                    critDamage={1561}
                    damageMods={bossPassiveState}
                    onDamageModsChange={setBossPassiveState}
                />
                <CharacterLine
                    name="HMH Melee"
                    critDamage={1561}
                    damageMods={hmhMeleeState}
                    onDamageModsChange={setHmhMeleeState}
                />
                <CharacterLine
                    name="HMH Range"
                    critDamage={1561}
                    damageMods={hmhRangeState}
                    onDamageModsChange={setHmhRangeState}
                />
                <CharacterLine
                    name="Atlacoya Active"
                    critDamage={2706}
                    damageMods={atlacoyaActiveState}
                    onDamageModsChange={setAtlacoyaActiveState}
                />
                <CharacterLine
                    name="Laviscus Active"
                    critDamage={2082}
                    damageMods={laviscusActiveState}
                    onDamageModsChange={setLaviscusActiveState}
                />
                <CharacterLine
                    name="Laviscus Melee"
                    critDamage={2082 + 952}
                    damageMods={laviscusMeleeState}
                    onDamageModsChange={setLaviscusMeleeState}
                />
            </div>
            <div>
                {allAttacks.map(attack => (
                    <div key={attack.name}>
                        <strong>{attack.name}:</strong> {attack.hits.map(hit => hit.toFixed(0)).join(', ')}
                        {attack.atlaBuffPerHit.reduce((sum, buff) => sum + buff, 0) > 0
                            ? `- Atla Buff: ${attack.atlaBuffPerHit.map(buff => buff.toFixed(0)).join(', ')}`
                            : ''}
                        {attack.hmhBuffPerHit.reduce((sum, buff) => sum + buff, 0) > 0
                            ? `- HMH Buff: ${attack.hmhBuffPerHit.map(buff => buff.toFixed(0)).join(', ')}`
                            : ''}
                    </div>
                ))}
                <div>
                    <strong>Outrage:</strong> {outrage.toFixed(0)}
                </div>
                <div>
                    <strong>Total:</strong>{' '}
                    {allAttacks
                        .flatMap(attack => attack.hits)
                        .reduce((sum, hit) => sum + hit, 0)
                        .toFixed(0)}
                </div>
            </div>
        </div>
    );
};
