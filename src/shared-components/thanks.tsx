import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { isMobile } from 'react-device-detect';
import { StaticDataService } from '../services';
import { ContributorImage } from './contributor-image';
import { Link, useNavigate } from 'react-router-dom';
import { IContentCreator, IContributor } from '../models/interfaces';

export const Thanks = ({ sliderMode }: { sliderMode?: boolean }) => {
    const [activeContributorIndex, setActiveContributorIndex] = useState<number>(0);
    const [hide, setHide] = useState<boolean>(false);
    const shuffleArray = (array: any[]): void => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const contributorsList: Array<IContributor | IContentCreator> = useMemo(() => {
        const lastContributor = StaticDataService.contentCreators[0];
        const allContributors: Array<IContributor | IContentCreator> = [
            ...StaticDataService.contentCreators.slice(1),
            ...StaticDataService.contributors,
        ];
        shuffleArray(allContributors);
        allContributors.unshift(lastContributor);

        return allContributors;
    }, []);

    useEffect(() => {
        if (!sliderMode) {
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
                const nextContributorId = curr + 1;

                return nextContributorId > contributorsList.length - 1 ? 0 : nextContributorId;
            });
        }, 4000);

        return () => clearInterval(intervalId);
    }, []);

    const displayedContributor = useMemo<IContributor | IContentCreator>(
        () => contributorsList[activeContributorIndex],
        [activeContributorIndex]
    );

    return (
        <div>
            <h3 style={{ textAlign: 'center' }}>Thank you!!!</h3>

            {sliderMode ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ThankYouCard contributor={displayedContributor} hide={hide} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                    {contributorsList.map(x => (
                        <ThankYouCard key={x.name} contributor={x} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ThankYouCard = ({
    contributor,
    hide,
}: {
    contributor: IContributor | IContentCreator;
    hide?: boolean;
}) => {
    const navigate = useNavigate();
    return (
        <Card
            onClick={() => navigate(isMobile ? '/mobile/ty' : '/ty')}
            sx={{
                opacity: hide ? 0 : 1,
                width: 350,
                height: 400,
                cursor: 'pointer',
                transition: 'opacity 1s ease-in-out',
            }}>
            <CardHeader
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        {isContentMaker(contributor) ? (
                            <Link
                                to={contributor.youtubeLink}
                                target={'_blank'}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                                onClick={event => event.stopPropagation()}>
                                <ContributorImage
                                    iconPath={contributor.avatarIcon}
                                    height={50}
                                    width={50}
                                    borderRadius={true}
                                />
                                {contributor.name}
                            </Link>
                        ) : (
                            <React.Fragment>
                                <ContributorImage
                                    iconPath={contributor.avatarIcon}
                                    height={50}
                                    width={50}
                                    borderRadius={true}
                                />
                                {contributor.name}
                            </React.Fragment>
                        )}
                    </div>
                }
                subheader={isContentMaker(contributor) ? 'Content creator' : 'Contributor'}
            />
            <CardContent style={{ paddingTop: 0 }}>
                {isContentMaker(contributor) ? (
                    <React.Fragment>
                        <p>{contributor.thankYou}</p>
                        <Link
                            to={contributor.resourceLink}
                            target={'_blank'}
                            onClick={event => event.stopPropagation()}>
                            <ContributorImage iconPath={contributor.resourceIcon} height={200} width={320} />
                        </Link>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <p>{contributor.thankYou}</p>
                        {contributor.resourceLink ? (
                            <React.Fragment>
                                Check out{' '}
                                <Link
                                    to={contributor.resourceLink}
                                    target={'_blank'}
                                    onClick={event => event.stopPropagation()}>
                                    {contributor.resourceDescription}
                                </Link>
                            </React.Fragment>
                        ) : undefined}
                    </React.Fragment>
                )}
            </CardContent>
        </Card>
    );
};

const isContentMaker = (contributor: IContentCreator | IContributor): contributor is IContentCreator => {
    return Object.hasOwn(contributor, 'youtubeLink');
};
