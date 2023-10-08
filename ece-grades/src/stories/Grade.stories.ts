import type { Meta, StoryObj } from '@storybook/svelte';

import Grade from '../lib/components/Grade.svelte';

const meta = {
    title: 'Grade',
    component: Grade,
    tags: ['autodocs'],
    argTypes: {
        grade: { control: 'number' },
        weight: { control: 'number' },
    },
} satisfies Meta<Grade>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        grade: 0,
        weight: 0,
    },
};