import Button from '@mui/material/Button';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router-dom';

import { FlexBox } from '@/fsd/5-shared/ui';

import { contentCreators, contributors } from './data';
import { ThankYouCard } from './thank-you.card';
import { IContributor, IContentCreator, IYoutubeCreator } from './thank-you.model';

const shuffleArray = (array: unknown[]): void => {
    for (let index = array.length - 1; index > 0; index--) {
        const index_ = Math.floor(Math.random() * (index + 1));
        [array[index], array[index_]] = [array[index_], array[index]];
    }
};

export const Thanks = ({ sliderMode }: { sliderMode?: boolean }) => {
    const [activeContributorIndex, setActiveContributorIndex] = useState<number>(0);
    const [hide, setHide] = useState<boolean>(false);
    const [contributorsList, setContributorsList] = useState<Array<IContributor | IContentCreator | IYoutubeCreator>>(
        []
    );

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
        if (!sliderMode || contributorsList.length === 0) {
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

            setActiveContributorIndex(current => {
                const increment = isMobile ? 1 : 3;
                const maxStep = isMobile ? 0 : 2;
                const nextContributorId = current + increment;

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
                <div className="flex min-h-[400px] justify-center gap-2.5">
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
                <div className="flex flex-wrap justify-center gap-2.5">
                    {contributorsList.map(x => (
                        <ThankYouCard key={x.name} contributor={x} />
                    ))}
                </div>
            )}
        </FlexBox>
    );
};
