const path = require('path');

module.exports = function override(config, env) {
	// Add polyfills for Node.js modules
	config.resolve.fallback = {
		...config.resolve.fallback,
		path: require.resolve('path-browserify'),
		stream: require.resolve('stream-browserify'),
		crypto: require.resolve('crypto-browserify'),
		buffer: require.resolve('buffer'),
		util: require.resolve('util'),
		process: require.resolve('process/browser'),
		vm: require.resolve('vm-browserify')
	};

	// Modify babel-loader to allow namespace tags in JSX
	const oneOfRule = config.module.rules.find(rule => rule.oneOf);
	if (oneOfRule) {
		oneOfRule.oneOf.forEach(rule => {
			if (rule.loader && rule.loader.includes('babel-loader') && rule.options) {
				// Add plugin to override throwIfNamespace
				if (!rule.options.plugins) {
					rule.options.plugins = [];
				}
				
				// Check if @babel/plugin-transform-react-jsx is already there
				const existingPlugin = rule.options.plugins.find(
					plugin => Array.isArray(plugin) && plugin[0] && plugin[0].includes('@babel/plugin-transform-react-jsx')
				);
				
				if (!existingPlugin) {
					// Add the plugin with throwIfNamespace: false
					rule.options.plugins.push([
						require.resolve('@babel/plugin-transform-react-jsx'),
						{ throwIfNamespace: false },
						'react-jsx-namespace-fix'
					]);
				} else {
					// Update existing plugin
					existingPlugin[1] = {
						...(existingPlugin[1] || {}),
						throwIfNamespace: false
					};
				}
			}
		});
	}

	return config;
};

