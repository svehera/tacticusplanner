import React from 'react';
import './about.css';
import { Link } from 'react-router-dom';

const About = () => {

    return (
        <div className="about-root">
            <h3 style={{ textAlign: 'center' }}>Plan your success in Tacticus, No more Google Sh**t</h3>

            <div>
                <p>
                    Big Thanks to <b><a href="https://www.youtube.com/@DBPreacherTacticus" target={'_blank'}
                        rel="noreferrer">DB Preacher: Tacticus</a></b> for his content
                    and <a href="https://youtu.be/aD2ky2BxX_g?si=43Hk2O84QL23EzMY" target={'_blank'}
                        rel="noreferrer">work</a> that inspired me for creating this web app
                </p>
                <p>
                    Shout out to <a href="https://tacticus.fandom.com/wiki/Tacticus_Wiki" target={'_blank'}
                        rel="noreferrer">Tacticus Wiki</a>
                    and <a
                        href="https://docs.google.com/spreadsheets/u/0/d/1al2IWwvTP3QOhHtfr6P8stdlA48ED4JFrtK8wDKznrk/htmlview"
                        target={'_blank'} rel="noreferrer">EN Labs T.A.C.T.I.C.U.S</a>
                    for collecting and publishing game data. It was very helpful in creating this app.
                </p>
            </div>

            <h3 style={{ textAlign: 'center' }}>F.A.Q. and Instructions</h3>

            <h4>What is this web app?</h4>
            <p>This web is made to make your planning in the mobile title <a href="https://tacticusgame.com/"
                target={'_blank'} rel="noreferrer">Warhammer
                40K Tacticus.</a> easier.</p>

            <h4>What does it do?</h4>
            <p>You can use it to find out which of your chars are the best for each Legendary Event and an overall
                rating.</p>

            <h4>What features it has?</h4>
            <p> &quot;Who You Own&quot; - You enter which characters you have unlocked and what rank they are.</p>
            <p> &quot;Characters&quot; - View and filter characters stats.</p>
            <p> &quot;Dirty Dozen&quot; -<Link to={'https://tacticus.fandom.com/wiki/Infographics#Dirty_Dozen_Series'} target={'_blank'}>Nandi&apos;s</Link> DirtyDozen infographic in table format</p>
            <p> &quot;Legendary Events&quot; - page contains all future Legendary events with target dates
                <br/>
                <ul>
                    <li>Characters filters - use to show only characters you have unlocked or characters that are
                        required for campaigns.
                    </li>
                    <li>Event Details - All the details of which characters can do participate in each match per track
                        i.e. Alpha/Beta/Gamma.
                    </li>
                    <li>Your Selected Teams - table of characters you&apos;ve selected for each track i.e.
                        Alpha/Beta/Gamma.
                    </li>
                    <li>Event Best Characters - tables of characters that scores the most points in the event (Best
                        Overall, Your Best, Selected Best).
                    </li>
                    <li>Overall Best Characters - same as &quot;Event Best Characters&quot; except it displayed combined
                        data from all legendary events
                    </li>
                </ul>
            </p>
            <p> &quot;Import&quot; - Import your personal data that you&apos;ve backed up with Export feature.</p>
            <p> &quot;Export&quot; - Back up personal data on your device to import it in case of current state is
                lost.</p>

            <h4>How do I use it?</h4>
            <p>1. Go to the &quot;Who You Own&quot; page, check characters you have unlocked and set the current rank of
                your characters in the drop down menu. </p>
            <p>2. Go to the &quot;Legendary Events&quot; page then to specific event and select your teams on the Event
                Details table </p>
            <p>3. View &quot;Event Best Characters&quot; table to understand what characters you should prioritize in
                preparation for the legendary event</p>

            <h4>I found a bug? I have an idea? I want to reach you out?</h4>
            <p>Send email to <a href="mailto: tacticusplanner@gmail.com" target={'_blank'}
                rel="noreferrer">tacticusplanner@gmail.com</a> or reach me out in <a
                href="discordapp.com/users/514327364688281602" target={'_blank'}>Discord</a></p>

            <h4>What are future plans for the Tacticus Planner?</h4>
            <p>UI/UX improvements</p>
            <p>Ukrainian localization</p>
            <p>&quot;Stats&quot; feature - table with characters stats (range/melee hits, range distance, movements,
                etc.)</p>
            <p>More Filters - Nandi&apos;s &quot;Dirty Dozed&quot;, Nandi Recommends</p>
            <p>&quot;My Lists&quot; feature - create your own PvP, Guild raids lists.</p>
            <p>More personal data on Who You Own page - rarity, abilities level, power</p>
            <p>Buying an standalone domain and hosting.</p>
            <p>Login feature - share your data across multiple devices.</p>
        </div>
    );
};

export default About;