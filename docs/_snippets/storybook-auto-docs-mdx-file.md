<!-- prettier-ignore -->
```mdx filename="Page.mdx" renderer="common" language="mdx"
import { Canvas, Meta, Story } from '@storybook/blocks';

import * as ListStories from './List.stories';

import * as ListItemStories from './ListItem.stories';

import * as PageStories from './Page.stories';

<Meta of={PageStories} />

# Page

Page is a layout container that is used to position children in predetermined areas.

It's often used to apply consistent positioning for content across pages in an application

## Usage

<Canvas of={PageStories.Basic} />

# List

List is a grouping of related items. List can be ordered with multiple levels of nesting.

## Usage

<Story of={ListStories.Filled} />

# List Item

List items are used to group related content in a list. They must be nested within a List component.

## Usage

<Story of={ListItemStories.Starter} meta={ListItemStories} />
```

<!-- prettier-ignore -->
```mdx filename="Page.mdx" renderer="svelte" language="mdx" tabTitle="Svelte CSF"
import { Canvas, Meta, Story } from '@storybook/blocks';

import * as ListStories from './List.stories.svelte';

import * as ListItemStories from './ListItem.stories.svelte';

import * as PageStories from './Page.stories.svelte';

<Meta of={PageStories} />

# Page

Page is a layout container that is used to position children in predetermined areas.

It's often used to apply consistent positioning for content across pages in an application

## Usage

<Canvas of={PageStories.Basic} />

# List

List is a grouping of related items. List can be ordered with multiple levels of nesting.

## Usage

<Story of={ListStories.Filled} />

# List Item

List items are used to group related content in a list. They must be nested within a List component.

## Usage

<Story of={ListItemStories.Starter} meta={ListItemStories} />
```

<!-- prettier-ignore -->
```mdx filename="Page.mdx" renderer="svelte" language="mdx" tabTitle="CSF"
import { Canvas, Meta, Story } from '@storybook/blocks';

import * as ListStories from './List.stories';

import * as ListItemStories from './ListItem.stories';

import * as PageStories from './Page.stories';

<Meta of={PageStories} />

# Page

Page is a layout container that is used to position children in predetermined areas.

It's often used to apply consistent positioning for content across pages in an application

## Usage

<Canvas of={PageStories.Basic} />

# List

List is a grouping of related items. List can be ordered with multiple levels of nesting.

## Usage

<Story of={ListStories.Filled} />

# List Item

List items are used to group related content in a list. They must be nested within a List component.

## Usage

<Story of={ListItemStories.Starter} meta={ListItemStories} />
```
