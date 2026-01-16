/* eslint-disable import-x/no-internal-modules */

import { useEffect, useMemo, useState } from 'react';

import I_Block_C002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C002.png';
import I_Block_C003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C003.png';
import I_Block_C004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C004.png';
import I_Block_C006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C006.png';
import I_Block_C007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C007.png';
import I_Block_C008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_C008.png';
import I_Block_E002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E002.png';
import I_Block_E003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E003.png';
import I_Block_E004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E004.png';
import I_Block_E006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E006.png';
import I_Block_E007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E007.png';
import I_Block_E008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_E008.png';
import I_Block_L002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L002.png';
import I_Block_L003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L003.png';
import I_Block_L004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L004.png';
import I_Block_L006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L006.png';
import I_Block_L007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L007.png';
import I_Block_L008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_L008.png';
import I_Block_M003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_M003.png';
import I_Block_R002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R002.png';
import I_Block_R003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R003.png';
import I_Block_R004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R004.png';
import I_Block_R005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R005.png';
import I_Block_R006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R006.png';
import I_Block_R007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R007.png';
import I_Block_R008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_R008.png';
import I_Block_U002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U002.png';
import I_Block_U003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U003.png';
import I_Block_U004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U004.png';
import I_Block_U006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U006.png';
import I_Block_U007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U007.png';
import I_Block_U008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Block_U008.png';
import I_Booster_Block_C002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_C002.png';
import I_Booster_Block_E002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_E002.png';
import I_Booster_Block_L002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_L002.png';
import I_Booster_Block_M001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_M001.png';
import I_Booster_Block_M002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_M002.png';
import I_Booster_Block_R002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_R002.png';
import I_Booster_Block_U002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Block_U002.png';
import I_Booster_Crit_C001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C001.png';
import I_Booster_Crit_C002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C002.png';
import I_Booster_Crit_C003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C003.png';
import I_Booster_Crit_C004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C004.png';
import I_Booster_Crit_C005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C005.png';
import I_Booster_Crit_C006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_C006.png';
import I_Booster_Crit_E001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E001.png';
import I_Booster_Crit_E002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E002.png';
import I_Booster_Crit_E003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E003.png';
import I_Booster_Crit_E004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E004.png';
import I_Booster_Crit_E005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E005.png';
import I_Booster_Crit_E006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_E006.png';
import I_Booster_Crit_L001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L001.png';
import I_Booster_Crit_L002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L002.png';
import I_Booster_Crit_L003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L003.png';
import I_Booster_Crit_L004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L004.png';
import I_Booster_Crit_L005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L005.png';
import I_Booster_Crit_L006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_L006.png';
import I_Booster_Crit_M001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M001.png';
import I_Booster_Crit_M002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M002.png';
import I_Booster_Crit_M003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M003.png';
import I_Booster_Crit_M004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M004.png';
import I_Booster_Crit_M005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M005.png';
import I_Booster_Crit_M006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_M006.png';
import I_Booster_Crit_R001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R001.png';
import I_Booster_Crit_R002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R002.png';
import I_Booster_Crit_R003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R003.png';
import I_Booster_Crit_R004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R004.png';
import I_Booster_Crit_R005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R005.png';
import I_Booster_Crit_R006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_R006.png';
import I_Booster_Crit_U001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U001.png';
import I_Booster_Crit_U002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U002.png';
import I_Booster_Crit_U003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U003.png';
import I_Booster_Crit_U004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U004.png';
import I_Booster_Crit_U005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U005.png';
import I_Booster_Crit_U006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Booster_Crit_U006.png';
import I_Crit_C001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C001.png';
import I_Crit_C002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C002.png';
import I_Crit_C003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C003.png';
import I_Crit_C005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C005.png';
import I_Crit_C006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C006.png';
import I_Crit_C007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C007.png';
import I_Crit_C008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C008.png';
import I_Crit_C009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C009.png';
import I_Crit_C010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C010.png';
import I_Crit_C011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_C011.png';
import I_Crit_E001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E001.png';
import I_Crit_E002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E002.png';
import I_Crit_E003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E003.png';
import I_Crit_E005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E005.png';
import I_Crit_E006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E006.png';
import I_Crit_E007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E007.png';
import I_Crit_E008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E008.png';
import I_Crit_E009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E009.png';
import I_Crit_E010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E010.png';
import I_Crit_E011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_E011.png';
import I_Crit_L001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L001.png';
import I_Crit_L002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L002.png';
import I_Crit_L003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L003.png';
import I_Crit_L005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L005.png';
import I_Crit_L006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L006.png';
import I_Crit_L007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L007.png';
import I_Crit_L008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L008.png';
import I_Crit_L009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L009.png';
import I_Crit_L010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L010.png';
import I_Crit_L011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L011.png';
import I_Crit_L132 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_L132.png';
import I_Crit_M002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M002.png';
import I_Crit_M005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M005.png';
import I_Crit_M006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M006.png';
import I_Crit_M007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M007.png';
import I_Crit_M008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M008.png';
import I_Crit_M009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M009.png';
import I_Crit_M010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M010.png';
import I_Crit_M011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_M011.png';
import I_Crit_R001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R001.png';
import I_Crit_R002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R002.png';
import I_Crit_R003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R003.png';
import I_Crit_R005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R005.png';
import I_Crit_R006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R006.png';
import I_Crit_R007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R007.png';
import I_Crit_R008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R008.png';
import I_Crit_R009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R009.png';
import I_Crit_R010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R010.png';
import I_Crit_R011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_R011.png';
import I_Crit_U001 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U001.png';
import I_Crit_U002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U002.png';
import I_Crit_U003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U003.png';
import I_Crit_U004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U004.png';
import I_Crit_U005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U005.png';
import I_Crit_U006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U006.png';
import I_Crit_U007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U007.png';
import I_Crit_U008 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U008.png';
import I_Crit_U009 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U009.png';
import I_Crit_U010 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U010.png';
import I_Crit_U011 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Crit_U011.png';
import I_Defensive_C002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C002.png';
import I_Defensive_C003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C003.png';
import I_Defensive_C004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C004.png';
import I_Defensive_C005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C005.png';
import I_Defensive_C006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C006.png';
import I_Defensive_C007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_C007.png';
import I_Defensive_E002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E002.png';
import I_Defensive_E003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E003.png';
import I_Defensive_E004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E004.png';
import I_Defensive_E005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E005.png';
import I_Defensive_E006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E006.png';
import I_Defensive_E007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_E007.png';
import I_Defensive_L002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L002.png';
import I_Defensive_L003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L003.png';
import I_Defensive_L004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L004.png';
import I_Defensive_L005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L005.png';
import I_Defensive_L006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L006.png';
import I_Defensive_L007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_L007.png';
import I_Defensive_M003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_M003.png';
import I_Defensive_M005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_M005.png';
import I_Defensive_M006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_M006.png';
import I_Defensive_R002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R002.png';
import I_Defensive_R003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R003.png';
import I_Defensive_R004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R004.png';
import I_Defensive_R005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R005.png';
import I_Defensive_R006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R006.png';
import I_Defensive_R007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_R007.png';
import I_Defensive_U002 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U002.png';
import I_Defensive_U003 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U003.png';
import I_Defensive_U004 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U004.png';
import I_Defensive_U005 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U005.png';
import I_Defensive_U006 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U006.png';
import I_Defensive_U007 from '@/assets/images/snowprint_assets/equipment/ui_icon_item_I_Defensive_U007.png';
import R_Block_Booster_Phoenix_Gem from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Block_Booster_Phoenix_Gem.png';
import R_Block_DaemonFleshPlate from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Block_DaemonFleshPlate.png';
import R_Booster_Block_NornCrown from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Block_NornCrown.png';
import R_Booster_Block_PhoenixGem from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Block_PhoenixGem.png';
import R_Booster_Crit_AmuletOfTheVoidwyrm from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_AmuletOfTheVoidwyrm.png';
import R_Booster_Crit_BookOfFate from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_BookOfFate.png';
import R_Booster_Crit_IntoxicatingElixir from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_IntoxicatingElixir.png';
import R_Booster_Crit_KardiocoreGalvanus from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_KardiocoreGalvanus.png';
import R_Booster_Crit_NetherRealmCasket from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_NetherRealmCasket.png';
import R_Booster_Crit_OrbsOfDecay from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_OrbsOfDecay.png';
import R_Booster_Crit_TalismanOfRage from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_TalismanOfRage.png';
import R_Booster_Crit_WyrdmakersHelm from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Booster_Crit_WyrdmakersHelm.png';
import R_Crit_Booster_Amulet_of_the_Voidwyrm from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_Amulet_of_the_Voidwyrm.png';
import R_Crit_Booster_BookOfFate from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_BookOfFate.png';
import R_Crit_Booster_Intoxicating_Elixir from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_Intoxicating_Elixir.png';
import R_Crit_Booster_KardiocoreGalvanus from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_KardiocoreGalvanus.png';
import R_Crit_Booster_Netherrealm_Casket from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_Netherrealm_Casket.png';
import R_Crit_Booster_Orb_of_Decay from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_Orb_of_Decay.png';
import R_Crit_Booster_Talisman_of_Rage from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Booster_Talisman_of_Rage.png';
import R_Crit_DawnBlade from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_DawnBlade.png';
import R_Crit_Defense_of_Lost_Cadia from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Defense_of_Lost_Cadia.png';
import R_Crit_DW02AdvancedBurstCannon from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_DW02AdvancedBurstCannon.png';
import R_Crit_Maugetar from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Maugetar.png';
import R_Crit_MawClawsOfThyrax from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_MawClawsOfThyrax.png';
import R_Crit_ParagonSpear from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_ParagonSpear.png';
import R_Crit_RelicBoltPistol from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_RelicBoltPistol.png';
import R_Crit_RelicPowerFist from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_RelicPowerFist.png';
import R_Crit_TalonOfHorus from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_TalonOfHorus.png';
import R_Crit_TheArdentBlade from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_TheArdentBlade.png';
import R_Crit_Vitarus from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_Vitarus.png';
import R_Crit_VolummsMasterArtifice from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Crit_VolummsMasterArtifice.png';
import R_Defensive_RelicOfLostCadia from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Defensive_RelicOfLostCadia.png';
import R_Defensive_SupaCyborkBody from '@/assets/images/snowprint_assets/equipment/ui_icon_item_R_Defensive_SupaCyborkBody.png';
import unknown from '@/assets/images/snowprint_assets/equipment/ui_icon_item_unknown.png';

import { RarityMapper } from '@/fsd/5-shared/model';
import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import type { IEquipment } from '../model';

const equipmentIcons = {
    I_Block_C002,
    I_Block_C003,
    I_Block_C004,
    I_Block_C006,
    I_Block_C007,
    I_Block_C008,
    I_Block_E002,
    I_Block_E003,
    I_Block_E004,
    I_Block_E006,
    I_Block_E007,
    I_Block_E008,
    I_Block_L002,
    I_Block_L003,
    I_Block_L004,
    I_Block_L006,
    I_Block_L007,
    I_Block_L008,
    I_Block_M003,
    I_Block_R002,
    I_Block_R003,
    I_Block_R004,
    I_Block_R005,
    I_Block_R006,
    I_Block_R007,
    I_Block_R008,
    I_Block_U002,
    I_Block_U003,
    I_Block_U004,
    I_Block_U006,
    I_Block_U007,
    I_Block_U008,
    I_Booster_Block_C002,
    I_Booster_Block_E002,
    I_Booster_Block_L002,
    I_Booster_Block_M001,
    I_Booster_Block_M002,
    I_Booster_Block_R002,
    I_Booster_Block_U002,
    I_Booster_Crit_C001,
    I_Booster_Crit_C002,
    I_Booster_Crit_C003,
    I_Booster_Crit_C004,
    I_Booster_Crit_C005,
    I_Booster_Crit_C006,
    I_Booster_Crit_E001,
    I_Booster_Crit_E002,
    I_Booster_Crit_E003,
    I_Booster_Crit_E004,
    I_Booster_Crit_E005,
    I_Booster_Crit_E006,
    I_Booster_Crit_L001,
    I_Booster_Crit_L002,
    I_Booster_Crit_L003,
    I_Booster_Crit_L004,
    I_Booster_Crit_L005,
    I_Booster_Crit_L006,
    I_Booster_Crit_M001,
    I_Booster_Crit_M002,
    I_Booster_Crit_M003,
    I_Booster_Crit_M004,
    I_Booster_Crit_M005,
    I_Booster_Crit_M006,
    I_Booster_Crit_R001,
    I_Booster_Crit_R002,
    I_Booster_Crit_R003,
    I_Booster_Crit_R004,
    I_Booster_Crit_R005,
    I_Booster_Crit_R006,
    I_Booster_Crit_U001,
    I_Booster_Crit_U002,
    I_Booster_Crit_U003,
    I_Booster_Crit_U004,
    I_Booster_Crit_U005,
    I_Booster_Crit_U006,
    I_Crit_C001,
    I_Crit_C002,
    I_Crit_C003,
    I_Crit_C005,
    I_Crit_C006,
    I_Crit_C007,
    I_Crit_C008,
    I_Crit_C009,
    I_Crit_C010,
    I_Crit_C011,
    I_Crit_E001,
    I_Crit_E002,
    I_Crit_E003,
    I_Crit_E005,
    I_Crit_E006,
    I_Crit_E007,
    I_Crit_E008,
    I_Crit_E009,
    I_Crit_E010,
    I_Crit_E011,
    I_Crit_L001,
    I_Crit_L002,
    I_Crit_L003,
    I_Crit_L005,
    I_Crit_L006,
    I_Crit_L007,
    I_Crit_L008,
    I_Crit_L009,
    I_Crit_L010,
    I_Crit_L011,
    I_Crit_L132,
    I_Crit_M002,
    I_Crit_M005,
    I_Crit_M006,
    I_Crit_M007,
    I_Crit_M008,
    I_Crit_M009,
    I_Crit_M010,
    I_Crit_M011,
    I_Crit_R001,
    I_Crit_R002,
    I_Crit_R003,
    I_Crit_R005,
    I_Crit_R006,
    I_Crit_R007,
    I_Crit_R008,
    I_Crit_R009,
    I_Crit_R010,
    I_Crit_R011,
    I_Crit_U001,
    I_Crit_U002,
    I_Crit_U003,
    I_Crit_U004,
    I_Crit_U005,
    I_Crit_U006,
    I_Crit_U007,
    I_Crit_U008,
    I_Crit_U009,
    I_Crit_U010,
    I_Crit_U011,
    I_Defensive_C002,
    I_Defensive_C003,
    I_Defensive_C004,
    I_Defensive_C005,
    I_Defensive_C006,
    I_Defensive_C007,
    I_Defensive_E002,
    I_Defensive_E003,
    I_Defensive_E004,
    I_Defensive_E005,
    I_Defensive_E006,
    I_Defensive_E007,
    I_Defensive_L002,
    I_Defensive_L003,
    I_Defensive_L004,
    I_Defensive_L005,
    I_Defensive_L006,
    I_Defensive_L007,
    I_Defensive_M003,
    I_Defensive_M005,
    I_Defensive_M006,
    I_Defensive_R002,
    I_Defensive_R003,
    I_Defensive_R004,
    I_Defensive_R005,
    I_Defensive_R006,
    I_Defensive_R007,
    I_Defensive_U002,
    I_Defensive_U003,
    I_Defensive_U004,
    I_Defensive_U005,
    I_Defensive_U006,
    I_Defensive_U007,
    R_Block_Booster_Phoenix_Gem,
    R_Block_DaemonFleshPlate,
    R_Booster_Block_NornCrown,
    R_Booster_Block_PhoenixGem,
    R_Booster_Crit_AmuletOfTheVoidwyrm,
    R_Booster_Crit_BookOfFate,
    R_Booster_Crit_IntoxicatingElixir,
    R_Booster_Crit_KardiocoreGalvanus,
    R_Booster_Crit_NetherRealmCasket,
    R_Booster_Crit_OrbsOfDecay,
    R_Booster_Crit_TalismanOfRage,
    R_Booster_Crit_WyrdmakersHelm,
    R_Crit_Booster_Amulet_of_the_Voidwyrm,
    R_Crit_Booster_BookOfFate,
    R_Crit_Booster_Intoxicating_Elixir,
    R_Crit_Booster_KardiocoreGalvanus,
    R_Crit_Booster_Netherrealm_Casket,
    R_Crit_Booster_Orb_of_Decay,
    R_Crit_Booster_Talisman_of_Rage,
    R_Crit_DawnBlade,
    R_Crit_Defense_of_Lost_Cadia,
    R_Crit_DW02AdvancedBurstCannon,
    R_Crit_Maugetar,
    R_Crit_MawClawsOfThyrax,
    R_Crit_ParagonSpear,
    R_Crit_RelicBoltPistol,
    R_Crit_RelicPowerFist,
    R_Crit_TalonOfHorus,
    R_Crit_TheArdentBlade,
    R_Crit_Vitarus,
    R_Crit_VolummsMasterArtifice,
    R_Defensive_RelicOfLostCadia,
    R_Defensive_SupaCyborkBody,
    unknown,
} as const;

type EquipmentIcon = keyof typeof equipmentIcons;
const isValidEquipmentIcon = (icon: string): icon is EquipmentIcon => icon in equipmentIcons;

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };

        img.onerror = error => {
            reject(new Error(`Failed to load image from URL: ${url}. Error: ${error}`));
        };

        img.src = url;
    });
}

interface Size {
    width: number;
    height: number;
}

// Helper component for a single centered image layer
const ImageLayer = ({
    url,
    size,
    zIndex,
    scaleFactor,
}: {
    url: string;
    scaleFactor: number;
    size: Size;
    zIndex: number;
}) => (
    <img
        src={url}
        alt={`Layer ${zIndex}`}
        className="absolute pointer-events-none top-1/2 left-1/2"
        style={{
            width: size.width,
            height: size.height,
            transform: 'translate(-50%, -50%) scale(' + scaleFactor + '%, ' + scaleFactor + '%)',
            zIndex: zIndex,
        }}
        loading="lazy"
    />
);

export const EquipmentIcon = ({
    equipment,
    height = 50, // Set default sizes for better control
    width = 50,
    tooltip,
}: {
    equipment: IEquipment;
    height?: number;
    width?: number;
    tooltip?: boolean;
}) => {
    const [equipSize, setEquipSize] = useState<Size>({ width: 0, height: 0 });
    const [frameSize, setFrameSize] = useState<Size>({ width: 0, height: 0 });
    const [relicSize, setRelicSize] = useState<Size>({ width: 0, height: 0 });
    const [equipIsLoading, setEquipIsLoading] = useState<boolean>(true);
    const [frameIsLoading, setFrameIsLoading] = useState<boolean>(true);
    const [relicIsLoading, setRelicIsLoading] = useState<boolean>(true);
    const [equipError, setEquipError] = useState<Error | null>(null);
    const [frameError, setFrameError] = useState<Error | null>(null);
    const [relicError, setRelicError] = useState<Error | null>(null);

    const frameKey = (RarityMapper.rarityToRarityString(equipment.rarity).toLocaleLowerCase() +
        'EquipmentFrame') as keyof typeof tacticusIcons;
    const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
    const relicDetails = tacticusIcons['relicEquipmentFrame'] ?? { file: '', label: 'relicEquipmentFrame' };

    // 2. Use the useEffect hook to call the async function
    useEffect(() => {
        if (!equipment.icon) return;

        setEquipIsLoading(true);
        setEquipError(null);
        setEquipSize({ width: 0, height: 0 });

        getImageDimensions(getImageUrl(equipment.icon))
            .then(data => setEquipSize(data))
            .catch(err => setEquipError(err))
            .finally(() => setEquipIsLoading(false));

        getImageDimensions(frameDetails.file)
            .then(data => setFrameSize(data))
            .catch(err => setFrameError(err))
            .finally(() => setFrameIsLoading(false));

        getImageDimensions(relicDetails.file)
            .then(data => setRelicSize(data))
            .catch(err => setRelicError(err))
            .finally(() => setRelicIsLoading(false));

        // The dependency array [imageUrl] ensures this effect runs
        // only when the imageUrl prop changes.
    }, [equipment]);

    const containerDimensions = useMemo(() => {
        const maxWidth = width;
        const maxHeight = height;

        return { width: maxWidth, height: maxHeight };
    }, [equipSize, frameSize, relicSize]);

    // 3. Render based on the state
    if (equipIsLoading || frameIsLoading || relicIsLoading) {
        return <div>Loading...</div>;
    }

    if (equipError) {
        return <div className="text-red-500">Error loading image: {equipError.message}</div>;
    }
    if (frameError) {
        return <div className="text-red-500">Error loading image: {frameError.message}</div>;
    }
    if (relicError) {
        return <div className="text-red-500">Error loading image: {relicError.message}</div>;
    }

    const adjustedEquipSize = {
        width: (equipSize.width / Math.max(equipSize.width, equipSize.height)) * containerDimensions.width,
        height: (equipSize.height / Math.max(equipSize.width, equipSize.height)) * containerDimensions.height,
    };

    const adjustedFrameSize = {
        width: (frameSize.width / Math.max(frameSize.width, frameSize.height)) * containerDimensions.width,
        height: (frameSize.height / Math.max(frameSize.width, frameSize.height)) * containerDimensions.height,
    };

    const adjustedRelicSize = {
        width: (relicSize.width / Math.max(relicSize.width, relicSize.height)) * containerDimensions.width,
        height: (relicSize.height / Math.max(relicSize.width, relicSize.height)) * containerDimensions.height,
    };

    const iconUrl = isValidEquipmentIcon(equipment.icon) ? equipmentIcons[equipment.icon] : equipmentIcons.unknown;

    return (
        <AccessibleTooltip title={tooltip ? equipment.name : ''}>
            <div className="layered-image-stack relative overflow-hidden" style={containerDimensions}>
                <ImageLayer url={iconUrl} size={adjustedEquipSize} zIndex={1} scaleFactor={85} />
                <ImageLayer url={frameDetails.file} size={adjustedFrameSize} zIndex={2} scaleFactor={100} />
                {equipment.isRelic && (
                    <ImageLayer url={relicDetails.file} size={adjustedRelicSize} zIndex={3} scaleFactor={100} />
                )}
            </div>
        </AccessibleTooltip>
    );
};
