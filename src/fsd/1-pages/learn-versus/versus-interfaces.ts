import { EquipmentType, IEquipment } from '@/fsd/4-entities/equipment';

/**
 * Holds the selected equipment. If equipment is undefined, it means the user
 * did not select equipment for that particular slot.
 */
export interface IEquipmentSpec {
    /** The type of equipment, e.g. Block. */
    type: EquipmentType;
    /** The actual equipment selected. */
    equipment?: IEquipment;
    /**
     * The level of the equipment. E.g. Level 5. This affects stats/damage
     * computations.
     */
    level?: number;
}
