/** Round portraits for each boss / prime / minion unitId. */
export const unitRoundIconMap: Record<string, string> = {
    // Boss 1 – Tervigon (portrait only, no RoundPortrait available)
    GuildBoss1Boss1TyranTervigonLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_01.png',
    GuildBoss1Boss2TyranTervigonKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_02.png',
    GuildBoss1Boss3TyranTervigonGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_03.png',
    GuildBoss1MiniBoss1TyranWarriorLeviathan: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_01.png',
    GuildBoss1MiniBoss2TyranWarriorKronos: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_02.png',
    GuildBoss1MiniBoss3TyranWarriorGorgon: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_warrior_03.png',
    // Boss 2 – Hive Tyrant
    GuildBoss2Boss1TyranHiveTyrantLeviathan: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_01.png',
    GuildBoss2Boss2TyranHiveTyrantKronos: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_02.png',
    GuildBoss2Boss3TyranHiveTyrantGorgon: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_tyrant_03.png',
    // Boss 3 – Silent King + Minions
    GuildBoss3Boss1NecroSilentKing: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_silentking_01.png',
    GuildBoss3Minion1NecroMesophet: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_mesophet_01.png',
    GuildBoss3Minion2NecroHapthatra: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_hapthatra_01.png',
    GuildBoss3Minion3NecroMenhir: 'snowprint_assets/characters/ui_image_RoundPortrait_necro_menhir_01.png',
    // Boss 4 – Ghazghkull
    GuildBoss4Boss1OrksGhazghkull: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_ghazghkull_01.png',
    // Boss 5 – Mortarion + Minion
    GuildBoss5Boss1DeathMortarion: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_mortarion_01.png',
    GuildBoss5Minion1DeathBlightlord: 'snowprint_assets/characters/ui_image_RoundPortrait_death_blightlord_01.png',
    // Boss 6 – Screamer-killer
    GuildBoss6Boss1TyranScreamerKiller:
        'snowprint_assets/characters/ui_image_RoundPortrait_guild_screamerkiller_01.png',
    // Boss 7 – Rogaldorn
    GuildBoss7Boss1AstraRogaldorn: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_rogaldorn_01.png',
    // Boss 8 – Avatar of Khaine
    GuildBoss8Boss1EldarAvatar: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_avatar_01.png',
    // Boss 9 – Magnus
    GuildBoss9Boss1ThousMagnus: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_magnus_01.png',
    // Boss 10 – Belisarius Cawl
    GuildBoss10Boss1AdmecBelisarius: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_belisarius_01.png',
    // Boss 11 – Riptide
    GuildBoss11Boss1TauRiptide: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_riptide_01.png',
    // Boss 12 - The Lion
    GuildBoss12Boss1DarkaLion: 'snowprint_assets/characters/ui_image_RoundPortrait_guild_lion_01.png',
};

/** Full (non-round) portraits for main boss unitIds. */
export const bossPortraitMap: Record<string, string> = {
    GuildBoss1Boss1TyranTervigonLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_01.png',
    GuildBoss1Boss2TyranTervigonKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_02.png',
    GuildBoss1Boss3TyranTervigonGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tervigon_03.png',
    GuildBoss2Boss1TyranHiveTyrantLeviathan: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_01.png',
    GuildBoss2Boss2TyranHiveTyrantKronos: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_02.png',
    GuildBoss2Boss3TyranHiveTyrantGorgon: 'snowprint_assets/characters/ui_image_portrait_guild_tyrant_03.png',
    GuildBoss3Boss1NecroSilentKing: 'snowprint_assets/characters/ui_image_portrait_necro_silentking_01.png',
    GuildBoss4Boss1OrksGhazghkull: 'snowprint_assets/characters/ui_image_portrait_guild_ghazghkull_01.png',
    GuildBoss5Boss1DeathMortarion: 'snowprint_assets/characters/ui_image_portrait_guild_mortarion_01.png',
    GuildBoss6Boss1TyranScreamerKiller: 'snowprint_assets/characters/ui_image_portrait_guild_screamerkiller_01.png',
    GuildBoss7Boss1AstraRogaldorn: 'snowprint_assets/characters/ui_image_portrait_guild_rogaldorn_01.png',
    GuildBoss8Boss1EldarAvatar: 'snowprint_assets/characters/ui_image_portrait_guild_avatar_01.png',
    GuildBoss9Boss1ThousMagnus: 'snowprint_assets/characters/ui_image_portrait_guild_magnus_01.png',
    GuildBoss10Boss1AdmecBelisarius: 'snowprint_assets/characters/ui_image_portrait_guild_belisarius_01.png',
    GuildBoss11Boss1TauRiptide: 'snowprint_assets/characters/ui_image_portrait_guild_riptide_01.png',
    GuildBoss12Boss1DarkaLion: 'snowprint_assets/characters/ui_image_portrait_guild_lion_01.png',
};

/** Round portraits for NPC units used in unitAmountDecrease modifiers. */
export const npcUnitRoundIconMap: Record<string, string> = {
    GuildBoss6Npc1TyranHormagaunt: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_hormagaunt_01.png',
    GuildBoss6Npc5TyranBarbgaunt: 'snowprint_assets/characters/ui_image_RoundPortrait_tyran_barbgaunt_01.png',
    GuildBoss7Npc1AstraGuardsman: 'snowprint_assets/characters/ui_image_RoundPortrait_astra_npc_01.png',
    GuildBoss8Npc2EldarWarlock: 'snowprint_assets/characters/ui_image_RoundPortrait_aelda_warlock_01.png',
    GuildBoss9Npc3ThousRubricMarine: 'snowprint_assets/characters/ui_image_RoundPortrait_thous_rubric_01.png',
    GuildBoss9Npc4ThousTerminator: 'snowprint_assets/characters/ui_image_RoundPortrait_thous_terminator_02.png',
    GuildBoss10Npc2AdmecElectropriest: 'snowprint_assets/characters/ui_image_RoundPortrait_admec_electropriest_01.png',
    GuildBoss11Npc3TauDroneShield: 'snowprint_assets/characters/ui_image_RoundPortrait_tauta_drone_02.png',
    GuildBoss12Npc2DarkaHellblaster: 'snowprint_assets/characters/ui_image_RoundPortrait_darka_hellblaster_02.png',
};

/** Full portrait keyed by GuildBoss{N} prefix — first entry per prefix from bossPortraitMap. */
export const bossPrefixPortraitMap: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const unitId of Object.keys(bossPortraitMap)) {
        const prefix = /^(GuildBoss\d+)/.exec(unitId)?.[1];
        if (prefix !== undefined && map[prefix] === undefined) map[prefix] = unitId;
    }
    return map;
})();
