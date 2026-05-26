// Monorepo-aware Metro config. EAS Build uploads the entire repo and
// runs `npm install` at the workspace root, so transitive deps like
// `warn-once` get hoisted to `<repo>/node_modules/` rather than
// `packages/android/node_modules/`. Without these watchFolders +
// nodeModulesPaths settings, Metro's resolver stops walking up at
// `packages/android/` and can't find the hoisted modules.
//
// Reference: https://docs.expo.dev/guides/monorepos/

const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so changes to packages/shared etc. trigger
// rebuilds; also so the resolver knows the workspace boundary.
config.watchFolders = [workspaceRoot];

// Tell Metro to look in both the local and the workspace-root
// node_modules. npm workspaces hoist most deps to the root; only a
// few stay nested in packages/android/node_modules/.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Hard-map packages that npm install consistently drops in EAS's
// monorepo isolation. These all live at the workspace root in the
// cloud after `npm install`; Metro's default hierarchical walk
// stops too early to find them from inside
// packages/android/node_modules/@react-navigation/*.
function ws(pkg) {
  return path.resolve(workspaceRoot, 'node_modules', pkg);
}

config.resolver.extraNodeModules = {
  'warn-once': ws('warn-once'),
  'react-freeze': ws('react-freeze'),
  '@react-navigation/elements': ws('@react-navigation/elements'),
  '@react-navigation/core': ws('@react-navigation/core'),
  '@react-navigation/routers': ws('@react-navigation/routers'),
  'use-latest-callback': ws('use-latest-callback'),
  'query-string': ws('query-string'),
  nanoid: ws('nanoid'),
  'escape-string-regexp': ws('escape-string-regexp'),
  'fast-deep-equal': ws('fast-deep-equal'),
};

module.exports = config;
