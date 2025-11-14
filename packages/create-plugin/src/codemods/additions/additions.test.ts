import defaultAdditions from './additions.js';

describe('additions json', () => {
  // as addition scripts are imported dynamically when add is run we assert the path is valid
  defaultAdditions.forEach((addition) => {
    it(`should have a valid addition script path for ${addition.name}`, () => {
      expect(async () => {
        await import(addition.scriptPath);
      }).not.toThrow();
    });
  });
});
