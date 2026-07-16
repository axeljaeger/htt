import type { StorybookConfig } from "@storybook/angular-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@chromatic-com/storybook",
    "@storybook/addon-docs"
  ],
  framework: {
    name: "@storybook/angular-vite",
    options: {
      compodoc: false,
    },
  },
  docs: {},
};
export default config;
