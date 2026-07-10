const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve packages from all node_modules in the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules/.pnpm/node_modules'),
];

// 3. Force Metro to resolve symlinks (needed for pnpm)
config.resolver.unstable_enableSymlinks = true;

// 4. Alias expo-router to local copy (fixes pnpm isolation)
const expoRouterDir = path.resolve(projectRoot, 'node_modules/expo-router');
config.resolver.extraNodeModules = {
  'expo-router': expoRouterDir,
};

module.exports = config;
