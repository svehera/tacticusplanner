import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { sortBy } from 'lodash';
import React, { useContext, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from 'src/reducers/store.provider';

import { DynamicProps } from '@/fsd/5-shared/model';

import { mows2Data, MowsService, IMow, IMow2, IMowDb, IMowStatic, IMowStatic2 } from '@/fsd/4-entities/mow';

import { IMowLookupInputs } from './lookup.models';
import { MowLookupInputs } from './mow-lookup-inputs';
import { MowLookupService } from './mow-lookup.service';
import { MowMaterialsTable } from './mow-materials-table';
import { MowMaterialsTotal } from './mow-materials-total';
import { MowUpgradesTable } from './mow-upgrades-table';

export const MowLookup = () => {
    const { mows, inventory } = useContext(StoreContext);
    const autocompleteOptions = sortBy(mows, 'name');

    const [inputs, setInputs] = useState<IMowLookupInputs>({
        mow: autocompleteOptions[0],
        primaryAbilityStart: 1,
        primaryAbilityEnd: 1,
        secondaryAbilityStart: 1,
        secondaryAbilityEnd: 1,
    });

    const resolvedMows: IMow2[] = mows.map(mow => {
        let mow2: IMowStatic2 | undefined = mow as IMowStatic2;

        if (mow2 !== undefined) return mow as IMow2;

        const mow1: IMowStatic | undefined = mow as IMowStatic;
        const db: IMowDb = mow as IMowDb;
        const props: DynamicProps = mow as DynamicProps;
        mow2 = mows2Data.mows.find(x => x.snowprintId === mow1.tacticusId);
        return { ...mow2, ...db, ...props };
    });

    const mowMaterials = useMemo(
        () => (inputs.mow ? MowsService.getMaterialsList(inputs.mow.id, inputs.mow.name, inputs.mow.alliance) : []),
        [inputs.mow?.id]
    );

    const maxedTotal = useMemo(() => MowLookupService.getTotals(mowMaterials, 2), [mowMaterials]);
    const upgradesTotal = useMemo(
        () =>
            MowLookupService.getUpgradesList(mowMaterials.flatMap(x => [...x.primaryUpgrades, ...x.secondaryUpgrades])),
        [mowMaterials]
    );

    const primaryAbility = mowMaterials.slice(inputs.primaryAbilityStart - 1, inputs.primaryAbilityEnd - 1);
    const secondaryAbility = mowMaterials.slice(inputs.secondaryAbilityStart - 1, inputs.secondaryAbilityEnd - 1);

    const customTotal = useMemo(() => {
        return MowLookupService.getTotals([...primaryAbility, ...secondaryAbility]);
    }, [primaryAbility, secondaryAbility]);

    const customUpgrades = useMemo(() => {
        return MowLookupService.getUpgradesList([
            ...primaryAbility.flatMap(x => x.primaryUpgrades),
            ...secondaryAbility.flatMap(x => x.secondaryUpgrades),
        ]);
    }, [primaryAbility, secondaryAbility]);

    return (
        <>
            <MowLookupInputs mows={autocompleteOptions} inputs={inputs} inputsChange={setInputs} />

            {inputs.mow && (
                <>
                    <Accordion defaultExpanded={true}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <MowMaterialsTotal
                                label="Upgrades Needed for Selected Levels:"
                                mowAlliance={inputs.mow.alliance}
                                total={customTotal}
                            />
                        </AccordionSummary>
                        <AccordionDetails>
                            <MowUpgradesTable rows={customUpgrades} upgrades={inventory.upgrades} />
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded={false}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <MowMaterialsTotal
                                label="Complete Upgrade Table:"
                                mowAlliance={inputs.mow.alliance}
                                total={maxedTotal}
                            />
                        </AccordionSummary>
                        <AccordionDetails className="flex-box gap20">
                            <MowMaterialsTable rows={mowMaterials} />
                            <MowUpgradesTable rows={upgradesTotal} upgrades={inventory.upgrades} />
                        </AccordionDetails>
                    </Accordion>
                </>
            )}
        </>
    );
};
