export interface TacticusPlayerResponse {
    player: TacticusPlayer;
}

export interface TacticusPlayer {
    units: TacticusUnit[];
    inventory: TacticusInventory;
}

export interface TacticusInventory {
    upgrades: TacticusUpgrade[];
}

export interface TacticusAbility {
    /**
     * Unique identifier for the ability.
     */
    id: string;

    /**
     * 0 = ability is locked
     */
    level: number;
}

export interface TacticusUnit {
    /**
     * Unique identifier for the unit.
     */
    id: string;

    /**
     * Name of the unit.
     */
    name: string;

    /**
     * Star level: 0 = Common, 3 = Uncommon, 6 = Rare, 9 = Epic, 12 = Legendary
     */
    progressionIndex: number;

    /**
     * Total XP gained for the unit.
     */
    xp: number;

    /**
     * XP level of the unit.
     */
    xpLevel: number;

    /**
     * 0 = Stone I, 3 = Iron I, 6 = Bronze I, 9 = Silver I, 12 = Gold I, 15 = Diamond I, 17 = Diamond III
     */
    rank: number;

    /**
     * Active and passive abilities of the unit.
     */
    abilities: [TacticusAbility, TacticusAbility];

    /**
     * 2*3 matrix, 0 = top left, 1 = bottom left, 2 top center etc
     */
    upgrades: number[];

    /**
     * Owned shards of the unit.
     */
    shards: number;
}

export interface TacticusUpgrade {
    id: string;
    name: string;
    amount: number;
}
