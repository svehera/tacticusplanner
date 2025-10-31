import { LeTokenMilestones } from './le-token-milestones';
import { LeTokenTable } from './le-token-table';
import { TokenUse } from './token-estimation-service';

/**
 * Displays the tokenomics of a Legendary Event (LE), including milestones
 * already achieved, and a table of tokens to use, and which milestones they
 * achieve.
 */
export const LeTokenomics = ({ tokens, currentPoints }: { tokens: TokenUse[]; currentPoints: number }) => {
    return (
        <>
            <div>
                Found the tokenomics page helpful? Consider using cpunerd&apos;s Refer-A-Friend code
                &apos;DUG-38-VAT&apos;.
                <br />
                Maybe also{' '}
                <a style={{ color: '#808080', textDecoration: 'none' }} href="https://buymeacoffee.com/tacticusplanner">
                    {' '}
                    buy
                </a>{' '}
                the site owner a coffee?
            </div>
            <div key="tokenmilestones" style={{ width: 400, height: 'auto' }}>
                <div className="flex justify-center">
                    <h3 className="text-lg font-bold">Milestones Already Achieved</h3>
                </div>
                <LeTokenMilestones currentPoints={currentPoints} />
            </div>
            <div key="tokens" className="flex flex-col gap-2">
                <LeTokenTable tokens={tokens} currentPoints={currentPoints} />
            </div>
        </>
    );
};
