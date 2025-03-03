/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';

// @ts-ignore-error (this only errors during compilation for production)
// eslint-disable-next-line import/no-extraneous-dependencies
import { ImageContext as ImageContextValue } from '@storybook/nextjs/dist/image-context';

import type * as _NextImage from 'next/image';
// @ts-ignore import is aliased in webpack config
import * as NextImageNamespace from 'sb-original/next/image';

import { type ImageContext as ImageContextType } from '../image-context';
import { defaultLoader } from './next-image-default-loader';

const OriginalNextImage = NextImageNamespace.default;
const { getImageProps: originalGetImageProps } = NextImageNamespace;
const ImageContext = ImageContextValue as typeof ImageContextType;

const MockedNextImage = React.forwardRef<HTMLImageElement, _NextImage.ImageProps>(
  ({ loader, ...props }, ref) => {
    const imageParameters = React.useContext(ImageContext);

    return (
      <OriginalNextImage
        ref={ref}
        {...imageParameters}
        {...props}
        loader={loader ?? defaultLoader}
      />
    );
  }
);

MockedNextImage.displayName = 'NextImage';

export const getImageProps = (props: _NextImage.ImageProps) =>
  originalGetImageProps?.({ loader: defaultLoader, ...props });

export default MockedNextImage;
