import type { Meta, StoryObj } from '@storybook/vue3';
import Component from './template-slots/component.vue';
import { h } from 'vue';

const meta = {
  component: Component,
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

type Story = StoryObj<typeof meta>;
export default meta;

export const Default: Story = {
  args: {
    default: ({ num }) => `Default slot: num=${num}`,
    named: ({ str }) => `Named slot: str=${str}`,
    vbind: ({ num, str, obj }) => [
      `Named v-bind slot: num=${num}, str=${str}, obj.title=${obj.title}`,
      h('br'),
      h('button', obj, 'button'),
      h('br'),
      h('button', { disabled: true, ...obj }, 'merged props'),
    ],
  },
};
