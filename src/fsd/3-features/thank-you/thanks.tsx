import Button from '@mui/material/Button';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { FlexBox } from '@/fsd/5-shared/ui';

import { contentCreators, contributors } from './data';
import { ThankYouCard } from './thank-you.card';
import { IContributor, IContentCreator, IYoutubeCreator } from './thank-you.model';

export const Thanks = ({ sliderMode }: { sliderMode?: boolean }) => {
    const [activeContributorIndex, setActiveContributorIndex] = useState<number>(0);
    const [hide, setHide] = useState<boolean>(false);
    const [contributorsList, setContributorsList] = useState<Array<IContributor | IContentCreator | IYoutubeCreator>>(
        []
    );

    const shuffleArray = (array: any[]): void => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    useEffect(() => {
        const api = axios.create({
            baseURL: 'https://tacticucplannerstorage.blob.core.windows.net',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        api({
            url: '/files/youtubeCreators.json',
            method: 'GET',
        })
            .then(data => {
                const lastContributor = contentCreators[0];
                const allContributors: Array<IContributor | IContentCreator | IYoutubeCreator> = [
                    ...data.data,
                    ...contributors,
                ];
                shuffleArray(allContributors);
                allContributors.unshift(lastContributor);
                setContributorsList(allContributors);
            })
            .catch(() => {
                const lastContributor = contentCreators[0];
                const allContributors: Array<IContributor | IContentCreator | IYoutubeCreator> = [
                    ...contentCreators.slice(1),
                    ...contributors,
                ];
                shuffleArray(allContributors);
                allContributors.unshift(lastContributor);
                setContributorsList(allContributors);
            });
    }, []);

    useEffect(() => {
        if (!sliderMode || !contributorsList.length) {
            return;
        }
        setTimeout(() => {
            setHide(true);
        }, 3000);

        const intervalId = setInterval(() => {
            setHide(false);
            setTimeout(() => {
                setHide(true);
            }, 3000);

            setActiveContributorIndex(curr => {
                const increment = isMobile ? 1 : 3;
                const maxStep = isMobile ? 0 : 2;
                const nextContributorId = curr + increment;

                return nextContributorId + maxStep > contributorsList.length - 1 ? 0 : nextContributorId;
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, [contributorsList.length]);

    const currentContributor = contributorsList[activeContributorIndex];

    return (
        <FlexBox className="flex-col">
            <Button className="text-center" component={Link} to={isMobile ? '/mobile/ty' : '/ty'}>
                Thank you cards
            </Button>

            {sliderMode && currentContributor ? (
                <div className="flex justify-center min-h-[400px] gap-2.5">
                    {isMobile && <ThankYouCard contributor={currentContributor} hide={hide} />}
                    {!isMobile && (
                        <>
                            <ThankYouCard contributor={currentContributor} hide={hide} />
                            <ThankYouCard contributor={contributorsList[activeContributorIndex + 1]} hide={hide} />
                            <ThankYouCard contributor={contributorsList[activeContributorIndex + 2]} hide={hide} />
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2.5 justify-center">
                    {contributorsList.map(x => (
                        <ThankYouCard key={x.name} contributor={x} />
                    ))}
                </div>
            )}
        </FlexBox>
    );
};
