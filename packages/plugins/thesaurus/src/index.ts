import joplin from 'api';
import { ContentScriptType, MenuItemLocation } from 'api/types';
import { SynonymMessage } from './types/types';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import PythonProcessManager from './infrastructure/PythonProcessManager';
import RankingService from './services/RankingService';

const venvPython = path.resolve(__dirname, '../../python/.venv/bin/python');
const PYTHON_EXECUTABLE = fs.existsSync(venvPython) ? venvPython : 'python';
const BACKEND_CWD = path.resolve(__dirname, '../../python/src');

const processManager = new PythonProcessManager(
	'thesaurus_nlp.boundary.worker',
	PYTHON_EXECUTABLE,
	(pythonExec, _args) =>
		spawn(pythonExec, ['-u', '-m', 'thesaurus_nlp.boundary.worker'], {
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: BACKEND_CWD,
		}),
);
const rankingService = new RankingService(processManager);

joplin.plugins.register({
	onStart: async function() {
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
						const response = await rankingService.getSuggestions(message.word, message.context);

						if (!response.results || response.results.length === 0) {
							return { status: 'empty' };
						}

						const top3 = [...response.results]
							.sort((a, b) => b.score - a.score)
							.slice(0, 3)
							.map((entry) => entry.word);
						return { status: 'success', synonyms: top3 };
					} catch (error) {
						console.error('Synonym backend request failed:', error);
						return { status: 'error' };
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
