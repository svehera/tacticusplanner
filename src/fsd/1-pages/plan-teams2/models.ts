export interface ITeam2 {
    // The name of the team.
    name: string;
    // The snowpring ID of the characters.
    chars: string[];
    // If there are flex characters, the first flex character appears at chars[flexIndex].
    flexIndex?: number;
    // The snowpring IDs of the machines of war.
    mows?: string[];
    // If the team is viable as a warOffense team.
    warOffense?: boolean;
    // If the team is viable as a warDefense team.
    warDefense?: boolean;
    // If the team is viable as a guild-raid team.
    raid?: boolean;
    // If the team is viable in tournament arena.
    ta?: boolean;
    // war battlefield levels
    bfs?: boolean[];
    notes: string;
}
