const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Block @react-native-firebase from being resolved — guard-app does not use Firebase,
// but the monorepo watchFolders causes Metro to pick it up from resident-app's deps.
config.resolver.blockList = [
  /.*[/\\]apps[/\\]resident-app[/\\].*/,
  /.*@react-native-firebase.*/,
];

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

// 5. Prevent Metro from walking up directories into sibling apps
config.resolver.disableHierarchicalLookup = true;

// 6. Bind Metro to all interfaces so physical devices can reach it via LAN IP
config.server = {
  ...config.server,
  host: '0.0.0.0',
};

module.exports = config;
