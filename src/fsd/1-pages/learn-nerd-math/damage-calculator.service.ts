import { DamageCalculationInput, SimulationType } from './models';

export class DamageCalculatorService {
    public static calculateDamage(input: DamageCalculationInput): number {
        switch (input.simulationType) {
            case SimulationType.MAX_DAMAGE:
                return this.calculateMaxDamage(input);
            case SimulationType.MIN_DAMAGE:
                return this.calculateMinDamage(input);
            case SimulationType.SIMULATED_DAMAGE:
                return this.calculateSimulatedDamage(input);
            default:
                throw new Error('Invalid simulation type');
        }
    }

    private static calculateMaxDamage(input: DamageCalculationInput): number {
        const damagePerHit = input.baseMaxDamage + input.critDamage;
        const pierceDamage = damagePerHit * input.pierceRatio;
        const armorDamage = damagePerHit - input.defenderArmor;
        const rawDamage = Math.max(pierceDamage, armorDamage);
        const modDamage =
            rawDamage *
            (input.adjustments.attackerOnHighGround ? 1.5 : 1) *
            (input.adjustments.defenderOnRazorWire ? 1.5 : 1);
        return modDamage * input.numHits;
    }

    private static calculateMinDamage(input: DamageCalculationInput): number {
        const damagePerHit = input.baseMinDamage;
        const pierceDamage = damagePerHit * input.pierceRatio;
        const armorDamage = damagePerHit - input.defenderArmor;
        const rawDamage = Math.max(pierceDamage, armorDamage);
        const modDamage =
            rawDamage *
            (input.adjustments.attackerOnHighGround ? 1.5 : 1) *
            (input.adjustments.defenderOnRazorWire ? 1.5 : 1);
        const damageAfterBlock = Math.max(0, modDamage - input.blockDamage);
        return damageAfterBlock * input.numHits;
    }

    private static calculateSimulatedDamage(input: DamageCalculationInput): number {
        let totalDamage = 0;
        for (let i = 0; i < input.numHits; i++) {
            const isCrit = Math.random() < input.critChance;
            const isBlock = Math.random() < input.blockChance;
            const damage = input.baseMinDamage + (isCrit ? input.critDamage : 0);
            const pierceDamage = damage * input.pierceRatio;
            const armorDamage = damage - input.defenderArmor;
            const rawDamage = Math.max(pierceDamage, armorDamage);
            const modDamage =
                rawDamage *
                (input.adjustments.attackerOnHighGround ? 1.5 : 1) *
                (input.adjustments.defenderOnRazorWire ? 1.5 : 1);
            const damageAfterBlock = Math.max(0, modDamage - (isBlock ? input.blockDamage : 0));
            totalDamage += damageAfterBlock;
        }
        return totalDamage;
    }
}
