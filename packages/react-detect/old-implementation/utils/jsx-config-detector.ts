import fs from 'fs';
import path from 'path';

/**
 * Detects automatic JSX transform configuration in build files
 * This helps identify if jsx-runtime bundling is caused by build config
 */
export class JsxConfigDetector {
  private pluginRoot: string;

  constructor(pluginRoot: string) {
    this.pluginRoot = pluginRoot;
  }

  /**
   * Check if automatic JSX transform is configured
   * Returns configuration details if found
   */
  detectAutomaticJsxConfig(): {
    hasAutomaticJsx: boolean;
    configFile: string | null;
    configType: 'swc' | 'tsconfig' | null;
    snippet: string | null;
  } {
    // Check for SWC config (grafanaDependency.json or .swcrc)
    const swcResult = this.checkSwcConfig();
    if (swcResult.hasAutomaticJsx) {
      return swcResult;
    }

    // Check for tsconfig.json
    const tsconfigResult = this.checkTsConfig();
    if (tsconfigResult.hasAutomaticJsx) {
      return tsconfigResult;
    }

    return {
      hasAutomaticJsx: false,
      configFile: null,
      configType: null,
      snippet: null,
    };
  }

  /**
   * Check SWC configuration for automatic JSX
   */
  private checkSwcConfig() {
    const result = {
      hasAutomaticJsx: false,
      configFile: null as string | null,
      configType: null as 'swc' | null,
      snippet: null as string | null,
    };

    // Check .swcrc
    const swcrcPath = path.join(this.pluginRoot, '.swcrc');
    if (fs.existsSync(swcrcPath)) {
      try {
        const content = fs.readFileSync(swcrcPath, 'utf8');
        const config = JSON.parse(content);

        if (config?.jsc?.transform?.react?.runtime === 'automatic') {
          result.hasAutomaticJsx = true;
          result.configFile = '.swcrc';
          result.configType = 'swc';
          result.snippet = '"jsc": { "transform": { "react": { "runtime": "automatic" } } }';
        }
      } catch (error) {
        // Ignore parse errors
      }
    }

    // Check grafanaDependency.json (often contains SWC config)
    if (!result.hasAutomaticJsx) {
      const grafanaDepPath = path.join(this.pluginRoot, '.config', 'grafanaDependency.json');
      if (fs.existsSync(grafanaDepPath)) {
        try {
          const content = fs.readFileSync(grafanaDepPath, 'utf8');
          const config = JSON.parse(content);

          if (
            config?.compilerOptions?.jsxFactory === 'automatic' ||
            config?.jsc?.transform?.react?.runtime === 'automatic'
          ) {
            result.hasAutomaticJsx = true;
            result.configFile = '.config/grafanaDependency.json';
            result.configType = 'swc';
            result.snippet = '"runtime": "automatic"';
          }
        } catch (error) {
          // Ignore parse errors
        }
      }
    }

    return result;
  }

  /**
   * Check tsconfig.json for automatic JSX
   */
  private checkTsConfig() {
    const result = {
      hasAutomaticJsx: false,
      configFile: null as string | null,
      configType: null as 'tsconfig' | null,
      snippet: null as string | null,
    };

    const tsconfigPath = path.join(this.pluginRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      return result;
    }

    try {
      const content = fs.readFileSync(tsconfigPath, 'utf8');
      // Remove comments before parsing (simple approach)
      const cleanedContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const config = JSON.parse(cleanedContent);

      const jsx = config?.compilerOptions?.jsx;
      if (jsx === 'react-jsx' || jsx === 'react-jsxdev') {
        result.hasAutomaticJsx = true;
        result.configFile = 'tsconfig.json';
        result.configType = 'tsconfig';
        result.snippet = `"jsx": "${jsx}"`;
      }
    } catch (error) {
      // Ignore parse errors
    }

    return result;
  }

  /**
   * Get webpack config path if it exists
   */
  getWebpackConfigPath(): string | null {
    const possiblePaths = [
      'webpack.config.ts',
      'webpack.config.js',
      '.config/webpack/webpack.config.ts',
      '.config/webpack/webpack.config.js',
    ];

    for (const relativePath of possiblePaths) {
      const fullPath = path.join(this.pluginRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        return relativePath;
      }
    }

    return null;
  }

  /**
   * Generate fix instructions based on configuration
   */
  generateFixInstructions(configType: 'swc' | 'tsconfig' | null): string[] {
    const instructions: string[] = [];

    if (configType === 'swc') {
      instructions.push('Update your .swcrc or grafanaDependency.json:');
      instructions.push('  Change "runtime": "automatic" to "runtime": "classic"');
      instructions.push('  Or remove the runtime property to use the default (classic)');
    } else if (configType === 'tsconfig') {
      instructions.push('Update your tsconfig.json:');
      instructions.push('  Change "jsx": "react-jsx" to "jsx": "react"');
      instructions.push('  This uses the classic JSX transform instead of automatic');
    }

    const webpackPath = this.getWebpackConfigPath();
    if (webpackPath) {
      instructions.push('');
      instructions.push(`Additionally, check your ${webpackPath} for any JSX-related configuration.`);
    }

    return instructions;
  }
}
