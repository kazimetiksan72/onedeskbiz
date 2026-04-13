const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '..');

config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];
config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  expo: path.resolve(workspaceRoot, 'node_modules/expo')
};

module.exports = config;
