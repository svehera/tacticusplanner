import { IMaterialQuantityInfo } from './goals.models';

/**
 * Progress-bar model for an upgrade-material goal, kept consistent between the card and the table.
 * In goal-priority mode the bar tracks THIS goal's own coverage (so the fill matches the headline
 * number); otherwise it tracks global inventory vs total demand. The other pair is shown in parens.
 */
export const getMaterialBar = (
    info: IMaterialQuantityInfo
): { value: number; max: number; label: string; valueLabel: string } =>
    info.isGoalPriority
        ? {
              value: info.coveredByInventory ?? 0,
              max: info.thisGoalQuantity,
              label: 'Covered',
              valueLabel: `${info.coveredByInventory ?? 0} / ${info.thisGoalQuantity} (${info.held}/${info.totalNeeded})`,
          }
        : {
              value: info.held,
              max: info.totalNeeded,
              label: 'Held / needed',
              valueLabel: `${info.held} / ${info.totalNeeded} (${info.thisGoalQuantity})`,
          };
