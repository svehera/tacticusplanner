import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import React, { forwardRef } from 'react';

interface SectionAccordionProps {
    expanded: boolean;
    onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
    summary: React.ReactNode;
    children: React.ReactNode;
    transitionProps?: NonNullable<React.ComponentProps<typeof Accordion>['slotProps']>['transition'];
}

export const SectionAccordion = forwardRef<HTMLDivElement, SectionAccordionProps>(
    ({ expanded, onChange, summary, children, transitionProps }, reference) => (
        <Accordion
            ref={reference}
            expanded={expanded}
            onChange={onChange}
            slotProps={{ transition: transitionProps }}
            disableGutters
            square
            className="overflow-hidden border-0 border-t border-(--border) bg-transparent shadow-none [&::before]:hidden">
            <AccordionSummary
                expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                {summary}
            </AccordionSummary>
            <AccordionDetails className="px-0! pt-0 pb-4 min-[354px]:px-2!">{children}</AccordionDetails>
        </Accordion>
    )
);

SectionAccordion.displayName = 'SectionAccordion';
