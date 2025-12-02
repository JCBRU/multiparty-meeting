module.exports = {
	presets: [
		[
			require.resolve('babel-preset-react-app'),
			{
				runtime: 'automatic'
			}
		]
	],
	plugins: [
		[
			require.resolve('@babel/plugin-transform-react-jsx'),
			{
				throwIfNamespace: false
			}
		]
	]
};

