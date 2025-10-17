import { Card, CardHeader, CardContent } from '@mui/material';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate, Link } from 'react-router-dom';

import { BmcIcon } from '@/fsd/5-shared/ui/icons';

import { ContributorImage } from './contributor-image';
import { IContributor, IContentCreator, IYoutubeCreator } from './thank-you.model';

export const ThankYouCard = ({
    contributor,
    hide,
}: {
    contributor: IContributor | IContentCreator | IYoutubeCreator;
    hide?: boolean;
}) => {
    const navigate = useNavigate();
    return (
        <Card
            variant="outlined"
            onClick={() => navigate(isMobile ? '/mobile/ty' : '/ty')}
            sx={{
                opacity: hide ? 0 : 1,
                width: 350,
                height: 'fit-content',
                maxHeight: 400,
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
                        ) : !isYoutubeCreator(contributor) ? (
                            <>
                                {!!contributor.avatarIcon && (
                                    <ContributorImage
                                        iconPath={contributor.avatarIcon}
                                        height={50}
                                        width={50}
                                        borderRadius={true}
                                    />
                                )}
                                {!contributor.avatarIcon && <BmcIcon />}
                                {contributor.name}
                            </>
                        ) : (
                            <>
                                <img
                                    loading={'lazy'}
                                    style={{
                                        contentVisibility: 'auto',
                                        borderRadius: '50%',
                                    }}
                                    src={contributor.avatarLink}
                                    height={50}
                                    width={50}
                                    alt={contributor.name}
                                />
                                {contributor.name}
                            </>
                        )}
                    </div>
                }
                subheader={
                    isContentMaker(contributor)
                        ? 'Content creator'
                        : !isYoutubeCreator(contributor)
                          ? contributor.type
                          : ''
                }
            />
            <CardContent style={{ paddingTop: 0 }}>
                {isContentMaker(contributor) ? (
                    <>
                        <p>{contributor.thankYou}</p>
                        <Link
                            to={contributor.resourceLink}
                            style={{ display: 'block', width: '100%', textAlign: 'center' }}
                            target={'_blank'}
                            onClick={event => event.stopPropagation()}>
                            <ContributorImage
                                iconPath={contributor.resourceIcon}
                                height={200}
                                width={contributor.name.includes('Severyn') ? 200 : 320}
                            />
                        </Link>
                    </>
                ) : !isYoutubeCreator(contributor) ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <Link
                            to={`https://www.youtube.com/watch?v=${contributor.youtubeVideoId}`}
                            style={{ display: 'block', width: '100%', textAlign: 'center' }}
                            target={'_blank'}
                            onClick={event => event.stopPropagation()}>
                            <img
                                loading={'lazy'}
                                style={{
                                    contentVisibility: 'auto',
                                }}
                                src={`https://i3.ytimg.com/vi/${contributor.youtubeVideoId}/mqdefault.jpg`}
                                height={200}
                                width={320}
                                alt={contributor.name}
                            />
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const isContentMaker = (
    contributor: IContentCreator | IContributor | IYoutubeCreator
): contributor is IContentCreator => {
    return Object.hasOwn(contributor, 'youtubeLink');
};

const isYoutubeCreator = (
    contributor: IContentCreator | IContributor | IYoutubeCreator
): contributor is IYoutubeCreator => {
    return Object.hasOwn(contributor, 'youtubeVideoId');
};
