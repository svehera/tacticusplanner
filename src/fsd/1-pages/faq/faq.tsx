import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

const faqData = {
    'Getting Started': [
        {
            question: 'Where should I start?',
            answer: 'With the release of the Tacticus API, you can now upload your roster data directly from the game. Begin by registering an account on tacticusplanner.app. You can then sync your data by going to https://api.tacticusgame.com and generating a player API and inputting your key in the Sync via Tacticus API option which can be found in the user menu by clicking on your profile icon at the top right of the screen.',
        },
    ],
    'Data Management': [
        {
            question: 'Is there a way to import my roster from the game?',
            answer: 'Yes, you can now import your roster data directly from the game by syncing your tacticusplanner.app account directly with the Tacticus API.',
        },
        {
            question: "I've lost all my roster. Can I restore it?",
            answer: "Use the 'Restore backup' option in the user menu. You can also manually backup and restore via 'Export data' and 'Import data.' Alternatively, you can sync your data again via the Tacticus API.",
        },
    ],
    'App Features': [
        {
            question: 'What do the numbers mean once I set a goal?',
            answer: 'The bold number indicates number of days it is estimated for a player to farm the highest planned items across all goals; the one in parentheses is the number of days for specific goal. Sometimes they can match sometimes no. E.g. you have top #1 priority goal that takes 8 days to farm some legendary upgrade but not all 8 day it will take full of your daily energy so the rest of energy can be used to complete other goals and #2 goal can be finish e.g. in 3 days and will have estimate "8 (3)".',
        },
        {
            question: 'What do the highlighted rows mean in LE master table?',
            answer: 'The colors represent character rank.',
        },
    ],
    'Legendary Events': [
        {
            question: 'Aun Shi, Beta Track, No Summons shows many of the summoners.',
            answer: "It's not a 'No Summoner' but a 'No Summon' condition. Certain characters like Aleph, Re'vas, Abraxas, etc., can work since their summons are purely active abilities you can elect not to use. All those with passive summons (Archimatos on kill, Celeste when hit and a few like that) you can't use.",
        },
    ],
} as const satisfies Record<
    string, // Category
    { question: string; answer: string }[]
>;

export const Faq = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                maxWidth: isMobile ? undefined : 800,
            }}>
            <p>
                Below you&apos;ll find answers to the most common questions you may have on the Tacticus Planner app. If
                you still can&apos;t find the answer you&apos;re looking for, just{' '}
                <Link to={'../contacts'}>Contact me</Link>
            </p>
            {Object.entries(faqData).map(([category, faqs]) => (
                <div key={category}>
                    <h2>{category}</h2>
                    {faqs.map(({ question, answer }) => (
                        <Accordion key={question}>
                            <AccordionSummary expandIcon={<ArrowDownwardIcon />}>
                                <Typography>Q: {question}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography>A: {answer}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </div>
            ))}
        </Box>
    );
};
