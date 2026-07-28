/* eslint-disable import-x/no-internal-modules */
import AdaptiveStrategyIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_AdaptiveStrategy.png';
import ArmoriumCherubIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_ArmoriumCherub.png';
import CamoCloakIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_CamoCloak.png';
import CombatRestorativesIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_CombatRestoratives.png';
import DeathFromAboveIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_DeathFromAbove.png';
import FabricatorClawArrayIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_FabricatorClawArray.png';
import FireOfAbsolutionIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_FireOfAbsolution.png';
import HarbingerOfDestructionIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_HarbingerOfDestruction.png';
import InescapableDeathIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_InescapableDeath.png';
import LivingLightningIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_LivingLightning.png';
import MortisRoundIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_MortisRound.png';
import MultiThreatEliminatorIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_MultiThreatEliminator.png';
import MyWillBeDoneOverlordIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_MyWillBeDoneOverlord.png';
import NartheciumIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_Narthecium.png';
import PsychicFortressIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_PsychicFortress.png';
import ReanimationProtocolsIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_ReanimationProtocols.png';
import RelentlessMarchIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_RelentlessMarch.png';
import ResurrectionOrbIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_ResurrectionOrb.png';
import ScarabHiveIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_ScarabHive.png';
import SendInTheNextWaveIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_SendInTheNextWave.png';
import ShockAssaultIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_ShockAssault.png';
import StormOfFlensingBladesIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_StormOfFlensingBlades.png';
import StormOfWrathIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_StormOfWrath.png';
import SummaryExecutionIcon from '@/assets/images/snowprint_assets/abilities/ui_icon_ability2_SummaryExecution.png';

interface IconData {
    file: string;
    name: string;
}

export const abilityIcons: Record<string, IconData> = {
    AdaptiveStrategy: { file: AdaptiveStrategyIcon, name: 'Adaptive Strategy' },
    ArmoriumCherub: { file: ArmoriumCherubIcon, name: 'Armorium Cherub' },
    CamoCloak: { file: CamoCloakIcon, name: 'Camo Cloak' },
    CombatRestoratives: { file: CombatRestorativesIcon, name: 'Combat Restoratives' },
    DeathFromAbove: { file: DeathFromAboveIcon, name: 'Death From Above' },
    FabricatorClawArray: { file: FabricatorClawArrayIcon, name: 'Fabricator Claw Array' },
    FireOfAbsolution: { file: FireOfAbsolutionIcon, name: 'Fire of Absolution' },
    HarbingerOfDestruction: { file: HarbingerOfDestructionIcon, name: 'Harbinger of Destruction' },
    InescapableDeath: { file: InescapableDeathIcon, name: 'Inescapable Death' },
    LivingLightning: { file: LivingLightningIcon, name: 'Living Lightning' },
    MortisRound: { file: MortisRoundIcon, name: 'Mortis Round' },
    MultiThreatEliminator: { file: MultiThreatEliminatorIcon, name: 'Multi-Threat Eliminator' },
    MyWillBeDoneOverlord: { file: MyWillBeDoneOverlordIcon, name: 'My Will Be Done' },
    Narthecium: { file: NartheciumIcon, name: 'Narthecium' },
    PsychicFortress: { file: PsychicFortressIcon, name: 'Psychic Fortress' },
    ReanimationProtocols: { file: ReanimationProtocolsIcon, name: 'Reanimation Protocols' },
    RelentlessMarch: { file: RelentlessMarchIcon, name: 'Relentless March' },
    ResurrectionOrb: { file: ResurrectionOrbIcon, name: 'Resurrection Orb' },
    ScarabHive: { file: ScarabHiveIcon, name: 'Scarab Hive' },
    SendInTheNextWave: { file: SendInTheNextWaveIcon, name: 'Send In The Next Wave' },
    ShockAssault: { file: ShockAssaultIcon, name: 'Shock Assault' },
    StormOfFlensingBlades: { file: StormOfFlensingBladesIcon, name: 'Storm of Flensing Blades' },
    StormOfWrath: { file: StormOfWrathIcon, name: 'Storm Of Wrath' },
    SummaryExecution: { file: SummaryExecutionIcon, name: 'Summary Execution' },
};
