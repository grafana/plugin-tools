import Enquirer from 'enquirer';
import { output } from '../../utils/utils.console.js';

// Common locales supported by Grafana
// Reference: https://github.com/grafana/grafana/blob/main/packages/grafana-i18n/src/constants.ts
const COMMON_LOCALES = [
  { name: 'en-US', message: 'English (US)' },
  { name: 'es-ES', message: 'Spanish (Spain)' },
  { name: 'fr-FR', message: 'French (France)' },
  { name: 'de-DE', message: 'German (Germany)' },
  { name: 'zh-Hans', message: 'Chinese (Simplified)' },
  { name: 'pt-BR', message: 'Portuguese (Brazil)' },
  { name: 'sv-SE', message: 'Swedish (Sweden)' },
  { name: 'nl-NL', message: 'Dutch (Netherlands)' },
  { name: 'ja-JP', message: 'Japanese (Japan)' },
  { name: 'it-IT', message: 'Italian (Italy)' },
];

export type I18nOptions = {
  locales: string[];
};

export async function promptI18nOptions(): Promise<I18nOptions> {
  const enquirer = new Enquirer();

  output.log({
    title: 'Configure internationalization (i18n) for your plugin',
    body: [
      'Select the locales you want to support. At least one locale must be selected.',
      'Use space to select, enter to continue.',
    ],
  });

  const localeChoices = COMMON_LOCALES.map((locale) => ({
    name: locale.name,
    message: locale.message,
    value: locale.name,
  }));

  let selectedLocales: string[] = [];

  try {
    const result = (await enquirer.prompt({
      type: 'multiselect',
      name: 'locales',
      message: 'Select locales to support:',
      choices: localeChoices,
      initial: [0], // Pre-select en-US by default
      validate(value: string[]) {
        if (value.length === 0) {
          return 'At least one locale must be selected';
        }
        return true;
      },
    } as any)) as { locales: string[] };

    selectedLocales = result.locales;
  } catch (error) {
    // User cancelled the prompt
    output.warning({ title: 'Addition cancelled by user.' });
    process.exit(0);
  }

  // Ask if they want to add additional locales
  try {
    const addMoreResult = (await enquirer.prompt({
      type: 'input',
      name: 'additionalLocales',
      message: 'Enter additional locale codes (comma-separated, e.g., "ko-KR,ru-RU") or press enter to skip:',
    } as any)) as { additionalLocales: string };

    const additionalLocalesInput = addMoreResult.additionalLocales;

    if (additionalLocalesInput && additionalLocalesInput.trim()) {
      const additionalLocales = additionalLocalesInput
        .split(',')
        .map((locale: string) => locale.trim())
        .filter((locale: string) => locale.length > 0 && !selectedLocales.includes(locale));

      selectedLocales.push(...additionalLocales);
    }
  } catch (error) {
    // User cancelled, just continue with what we have
  }

  output.log({
    title: `Selected locales: ${selectedLocales.join(', ')}`,
  });

  return {
    locales: selectedLocales,
  };
}
