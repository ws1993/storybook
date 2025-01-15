import type { FC, PropsWithChildren } from 'react';
import React from 'react';

import { H3 } from 'storybook/internal/components';

import GithubSlugger from 'github-slugger';

import type { HeadingProps } from './Heading';
import { HeaderMdx } from './mdx';

const slugs = new GithubSlugger();

export const Subheading: FC<PropsWithChildren<HeadingProps>> = ({ children, disableAnchor }) => {
  if (disableAnchor || typeof children !== 'string') {
    return <H3>{children}</H3>;
  }
  const tagID = slugs.slug(children.toLowerCase());
  return (
    <HeaderMdx as="h3" id={tagID}>
      {children}
    </HeaderMdx>
  );
};
