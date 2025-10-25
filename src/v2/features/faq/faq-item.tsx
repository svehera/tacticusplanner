import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';

import { IFaqItem } from './faq.models';

export const FaqItem = ({ item }: { item: IFaqItem }) => (
    <Accordion>
        <AccordionSummary expandIcon={<ArrowDownwardIcon />}>
            <Typography>Q: {item.question}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Typography>A: {item.answer}</Typography>
        </AccordionDetails>
    </Accordion>
);
