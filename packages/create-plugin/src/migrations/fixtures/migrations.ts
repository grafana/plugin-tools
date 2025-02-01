export default {
  migrations: {
    'migration-key1': {
      version: '5.0.0',
      description: 'Update project to use new cache directory',
      migrationScript: './5-0-0-cache-directory.js',
    },
    'migration-key2': {
      version: '5.4.0',
      description: 'Update project to use new cache directory',
      migrationScript: './5-4-0-cache-directory.js',
    },
    'migration-key3': {
      version: '6.0.0',
      description: 'Update project to use new cache directory',
      migrationScript: './5-4-0-cache-directory.js',
    },
  },
};
