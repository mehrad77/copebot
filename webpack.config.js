import { config } from 'dotenv';
config({
	path: './.dev.vars',
});
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { DefinePlugin } = webpack;

export default {
	entry: path.resolve(__dirname, 'src/index.ts'),
	target: 'webworker',
	output: {
		filename: 'worker.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'module',
		},
	},
	experiments: {
		outputModule: true,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	mode: 'production',
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		fallback: {
			fs: false,
		},
	},
	plugins: [
		new NodePolyfillPlugin(),
		new DefinePlugin({
			BOT_TOKEN: JSON.stringify(process.env.BOT_TOKEN || ''),
			SECRET_PATH: JSON.stringify(process.env.SECRET_PATH || ''),
		}),
	],
	optimization: {
		minimize: false,
	},
	performance: {
		hints: false,
	},
};
