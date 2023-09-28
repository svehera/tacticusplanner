import { Tooltip } from '@fluentui/react-components';
import React from 'react';

export const TextWithTooltip = ({ text }: {text: string}) => (<Tooltip content={text} relationship={'description'} hideDelay={1000}><span>{text}</span></Tooltip>);