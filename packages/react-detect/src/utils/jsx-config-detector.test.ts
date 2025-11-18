import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsxConfigDetector } from './jsx-config-detector.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('JsxConfigDetector', () => {
  const testDir = path.join(__dirname, '__test-fixtures__', 'jsx-config');

  beforeEach(() => {
    // Create test directory
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('detectAutomaticJsxConfig', () => {
    it('should detect automatic JSX in .swcrc', () => {
      const swcConfig = {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      };

      fs.writeFileSync(path.join(testDir, '.swcrc'), JSON.stringify(swcConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('.swcrc');
      expect(result.configType).toBe('swc');
      expect(result.snippet).toContain('automatic');
    });

    it('should detect automatic JSX in tsconfig.json with react-jsx', () => {
      const tsConfig = {
        compilerOptions: {
          jsx: 'react-jsx',
          target: 'ES2020',
        },
      };

      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('tsconfig.json');
      expect(result.configType).toBe('tsconfig');
      expect(result.snippet).toBe('"jsx": "react-jsx"');
    });

    it('should detect automatic JSX in tsconfig.json with react-jsxdev', () => {
      const tsConfig = {
        compilerOptions: {
          jsx: 'react-jsxdev',
        },
      };

      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('tsconfig.json');
      expect(result.configType).toBe('tsconfig');
      expect(result.snippet).toBe('"jsx": "react-jsxdev"');
    });

    it('should not detect classic JSX in tsconfig.json', () => {
      const tsConfig = {
        compilerOptions: {
          jsx: 'react',
        },
      };

      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(false);
      expect(result.configFile).toBeNull();
      expect(result.configType).toBeNull();
    });

    it('should detect automatic JSX in grafanaDependency.json', () => {
      const configDir = path.join(testDir, '.config');
      fs.mkdirSync(configDir, { recursive: true });

      const grafanaConfig = {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      };

      fs.writeFileSync(path.join(configDir, 'grafanaDependency.json'), JSON.stringify(grafanaConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('.config/grafanaDependency.json');
      expect(result.configType).toBe('swc');
    });

    it('should prioritize .swcrc over tsconfig.json', () => {
      const swcConfig = {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      };

      const tsConfig = {
        compilerOptions: {
          jsx: 'react-jsx',
        },
      };

      fs.writeFileSync(path.join(testDir, '.swcrc'), JSON.stringify(swcConfig, null, 2));
      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('.swcrc');
      expect(result.configType).toBe('swc');
    });

    it('should return false when no config files exist', () => {
      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(false);
      expect(result.configFile).toBeNull();
      expect(result.configType).toBeNull();
      expect(result.snippet).toBeNull();
    });

    it('should handle tsconfig.json with comments', () => {
      const tsConfigWithComments = `{
        // TypeScript configuration
        "compilerOptions": {
          "jsx": "react-jsx", // Use automatic JSX transform
          "target": "ES2020"
        }
      }`;

      fs.writeFileSync(path.join(testDir, 'tsconfig.json'), tsConfigWithComments);

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(true);
      expect(result.configFile).toBe('tsconfig.json');
    });

    it('should handle malformed JSON gracefully', () => {
      fs.writeFileSync(path.join(testDir, '.swcrc'), '{ invalid json }');

      const detector = new JsxConfigDetector(testDir);
      const result = detector.detectAutomaticJsxConfig();

      expect(result.hasAutomaticJsx).toBe(false);
    });
  });

  describe('getWebpackConfigPath', () => {
    it('should find webpack.config.ts', () => {
      fs.writeFileSync(path.join(testDir, 'webpack.config.ts'), '');

      const detector = new JsxConfigDetector(testDir);
      const result = detector.getWebpackConfigPath();

      expect(result).toBe('webpack.config.ts');
    });

    it('should find webpack.config.js', () => {
      fs.writeFileSync(path.join(testDir, 'webpack.config.js'), '');

      const detector = new JsxConfigDetector(testDir);
      const result = detector.getWebpackConfigPath();

      expect(result).toBe('webpack.config.js');
    });

    it('should find webpack config in .config directory', () => {
      const configDir = path.join(testDir, '.config', 'webpack');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(path.join(configDir, 'webpack.config.ts'), '');

      const detector = new JsxConfigDetector(testDir);
      const result = detector.getWebpackConfigPath();

      expect(result).toBe('.config/webpack/webpack.config.ts');
    });

    it('should return null when no webpack config exists', () => {
      const detector = new JsxConfigDetector(testDir);
      const result = detector.getWebpackConfigPath();

      expect(result).toBeNull();
    });
  });

  describe('generateFixInstructions', () => {
    it('should generate SWC fix instructions', () => {
      const detector = new JsxConfigDetector(testDir);
      const instructions = detector.generateFixInstructions('swc');

      expect(instructions).toContain('Update your .swcrc or grafanaDependency.json:');
      expect(instructions.some((i) => i.includes('runtime'))).toBe(true);
    });

    it('should generate tsconfig fix instructions', () => {
      const detector = new JsxConfigDetector(testDir);
      const instructions = detector.generateFixInstructions('tsconfig');

      expect(instructions).toContain('Update your tsconfig.json:');
      expect(instructions.some((i) => i.includes('react-jsx'))).toBe(true);
    });

    it('should include webpack config check when webpack.config.ts exists', () => {
      fs.writeFileSync(path.join(testDir, 'webpack.config.ts'), '');

      const detector = new JsxConfigDetector(testDir);
      const instructions = detector.generateFixInstructions('swc');

      expect(instructions.some((i) => i.includes('webpack.config.ts'))).toBe(true);
    });

    it('should return empty array for null config type when no webpack config exists', () => {
      const detector = new JsxConfigDetector(testDir);
      const instructions = detector.generateFixInstructions(null);

      expect(instructions.length).toBe(0);
    });
  });
});
