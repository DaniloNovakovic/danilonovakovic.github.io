import type { Preview } from '@storybook/react-vite';
import { UI_FONT_FAMILY } from '../src/config/typography';
import '../src/index.css';

document.documentElement.style.setProperty('--font-ui', UI_FONT_FAMILY);

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'sketchbook',
      values: [
        { name: 'sketchbook', value: '#f4f1ea' },
        { name: 'paper', value: '#fbfbf9' },
        { name: 'ink', value: '#1a1a1a' }
      ]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
