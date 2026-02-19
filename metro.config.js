const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Workaround for css-tree package.json resolution issue
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'css-tree': require.resolve('css-tree'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix css-tree package.json import
  if (moduleName === '../../package.json' && context.originModulePath.includes('css-tree')) {
    return {
      type: 'empty',
    };
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
