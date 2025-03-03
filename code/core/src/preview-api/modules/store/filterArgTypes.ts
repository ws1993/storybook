import type { StrictArgTypes } from 'storybook/internal/types';

import { pickBy } from 'es-toolkit';

export type PropDescriptor = string[] | RegExp;

const matches = (name: string, descriptor: PropDescriptor) =>
  Array.isArray(descriptor) ? descriptor.includes(name) : name.match(descriptor);

export const filterArgTypes = (
  argTypes: StrictArgTypes,
  include?: PropDescriptor,
  exclude?: PropDescriptor
) => {
  if (!include && !exclude) {
    return argTypes;
  }
  return (
    argTypes &&
    pickBy(argTypes, (argType, key) => {
      const name = argType.name || key.toString();
      return !!(!include || matches(name, include)) && (!exclude || !matches(name, exclude));
    })
  );
};
