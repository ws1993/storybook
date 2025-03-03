import { addons } from 'storybook/internal/manager-api';

import { global } from '@storybook/global';

const TAG_FILTERS = 'tag-filters';
const STATIC_FILTER = 'static-filter';

addons.register(TAG_FILTERS, (api) => {
  // FIXME: this ensures the filter is applied after the first render
  //        to avoid a strange race condition in Webkit only.
  const staticExcludeTags = Object.entries(global.TAGS_OPTIONS ?? {}).reduce(
    (acc, entry) => {
      const [tag, option] = entry;
      if ((option as any).excludeFromSidebar) {
        acc[tag] = true;
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

  api.experimental_setFilter(STATIC_FILTER, (item) => {
    const tags = item.tags ?? [];
    return (
      // we can filter out the primary story, but we still want to show autodocs
      (tags.includes('dev') || item.type === 'docs') &&
      tags.filter((tag) => staticExcludeTags[tag]).length === 0
    );
  });
});
