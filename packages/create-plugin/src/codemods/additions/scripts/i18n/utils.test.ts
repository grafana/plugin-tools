import { describe, expect, it } from 'vitest';

import { Context } from '../../../context.js';
import { checkReactVersion } from './utils.js';

describe('utils', () => {
  describe('checkReactVersion', () => {
    it('should throw error if React < 18 in dependencies', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          dependencies: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).toThrow('@grafana/i18n requires React 18 or higher');
    });

    it('should throw error if React 17 in devDependencies', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          devDependencies: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).toThrow('@grafana/i18n requires React 18 or higher');
    });

    it('should throw error if React 17 in peerDependencies', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          peerDependencies: {
            react: '^17.0.2',
            'react-dom': '^17.0.2',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).toThrow('@grafana/i18n requires React 18 or higher');
    });

    it('should continue if React >= 18', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          dependencies: {
            react: '^18.3.0',
            'react-dom': '^18.3.0',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).not.toThrow();
    });

    it('should continue if React version cannot be determined (no package.json)', () => {
      const context = new Context('/virtual');
      // No package.json file

      expect(() => {
        checkReactVersion(context);
      }).not.toThrow();
    });

    it('should continue if React version cannot be determined (no React dependency)', () => {
      const context = new Context('/virtual');

      context.addFile('package.json', JSON.stringify({})); // No React dependency

      expect(() => {
        checkReactVersion(context);
      }).not.toThrow();
    });

    it('should handle version ranges correctly', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          dependencies: {
            react: '~18.1.0',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).not.toThrow();
    });

    it('should handle React 19', () => {
      const context = new Context('/virtual');

      context.addFile(
        'package.json',
        JSON.stringify({
          dependencies: {
            react: '^19.0.0',
          },
        })
      );

      expect(() => {
        checkReactVersion(context);
      }).not.toThrow();
    });
  });
});
