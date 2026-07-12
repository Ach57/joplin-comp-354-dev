import joplin from 'api';
import { ContentScriptType, MenuItemLocation } from 'api/types';
import { SynonymMessage } from './types/types';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import PythonProcessManager from './infrastructure/PythonProcessManager';
import RankingService from './services/RankingService';

// Joplin runs plugins from packages/app-desktop/services/plugins,
// so __dirname is NOT the plugin directory at runtime.
//
// The Python backend actually lives under:
// packages/plugins/thesaurus/python
//
// We therefore resolve paths from the repository root back into the
// plugin directory instead of using ../python directly.
// NOTE:
// We currently prefer the plugin-local virtual environment and fall back
// to "python" if it does not exist.
//
// This assumes either:
//   1. python/.venv has been created, or
//   2. a compatible Python interpreter is available on PATH.
//
// Consider adding startup validation and a clearer error message if neither
// environment is available, since failures currently surface later when the
// Python process cannot be started.

const PLUGIN_ROOT = path.resolve(__dirname, '../../../plugins/thesaurus');
const venvPython = path.join(PLUGIN_ROOT, 'python/.venv/bin/python');
const PYTHON_EXECUTABLE = fs.existsSync(venvPython) ? venvPython : 'python';
const BACKEND_CWD = path.join(PLUGIN_ROOT, 'python/src');

const processManager = new PythonProcessManager(
	'thesaurus_nlp.main',
	PYTHON_EXECUTABLE,
	(pythonExec, _args) =>
		spawn(pythonExec, ['-u', '-m', 'thesaurus_nlp.main'], {
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: BACKEND_CWD,
		}),
);

const rankingService = new RankingService(processManager);

joplin.plugins.register({
	onStart: async function() {
		// throw new Error(
		//   JSON.stringify(
		//     {
		//       pluginRoot: PLUGIN_ROOT,
		//       pluginExists: fs.existsSync(PLUGIN_ROOT),
		//       venvPython,
		//       venvExists: fs.existsSync(venvPython),
		//       BACKEND_CWD,
		//       cwdExists: fs.existsSync(BACKEND_CWD),
		//     },
		//     null,
		//     2,
		//   ),
		// );

		await processManager.start();

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'synonymFinderScript',
			'./contentScript.js',
		);

		await joplin.contentScripts.onMessage(
			'synonymFinderScript',
			async (message: SynonymMessage) => {
				if (message.type === 'synonymRequest') {
					try {
						const response = await rankingService.getSuggestions(
							message.word,
							message.context,
						);

						if (!response.results || response.results.length === 0) {
							return { status: 'empty' };
						}

						const top3 = [...response.results]
							.sort((a, b) => b.score - a.score)
							.slice(0, 3)
							.map((entry) => entry.word);
						return { status: 'success', synonyms: top3 };
					} catch (error) {
						return {
							status: 'error',
							error:
                error instanceof Error
                	? {
                		message: error.message,
                		stack: error.stack,
                	}
                	: String(error),
						};
					}
				}
			},
		);

		await joplin.commands.register({
			name: 'findSynonym',
			label: 'Find Synonym',
			execute: async () => {
				await joplin.commands.execute('editor.execCommand', {
					name: 'triggerSynonymFinder',
					args: [],
				});
			},
		});

		await joplin.views.menuItems.create(
			'findSynonymMenuItem',
			'findSynonym',
			MenuItemLocation.EditorContextMenu,
		);
	},
});
