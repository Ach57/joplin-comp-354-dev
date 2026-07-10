import joplin from 'api';
import { ContentScriptType, MenuItemLocation } from 'api/types';
import { RankResponse, RankRequest, SynonymMessage } from './types/types';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';

// const venvPython = path.resolve(
//   __dirname,
//   "../../python/venv/Scripts/python.exe",
// );
const venvPython = path.resolve(__dirname, '../../python/.venv/bin/python');

const PYTHON_EXECUTABLE = fs.existsSync(venvPython) ? venvPython : 'python';
const BACKEND_CWD = path.resolve(__dirname, '../../python/src');

let workerProcess: ChildProcessWithoutNullStreams | null = null;
const pendingRequests = new Map<
	string,
	{ resolve: (response: RankResponse)=> void; reject: (error: Error)=> void }
>();

function startWorker() {
	workerProcess = spawn(
		PYTHON_EXECUTABLE,
		['-u', '-m', 'thesaurus_nlp.boundary.worker'],
		{
			cwd: BACKEND_CWD,
		},
	);

	workerProcess.stderr.on('data', (data) => {
		console.error('[synonym backend stderr]', data.toString());
	});

	workerProcess.on('exit', (code) => {
		console.warn('[synonym backend] process exited with code', code);
		workerProcess = null;
	});

	workerProcess.on('error', (error) => {
		console.error('[synonym backend] failed to start:', error);
		workerProcess = null;
	});

	const rl = readline.createInterface({ input: workerProcess.stdout });
	rl.on('line', (line) => {
		let response: RankResponse;
		try {
			response = JSON.parse(line);
		} catch {
			console.error('[synonym backend] failed to parse response line:', line);
			return;
		}
		const pending = pendingRequests.get(response.id);
		if (pending) {
			pendingRequests.delete(response.id);
			pending.resolve(response);
		}
	});
}

function requestSynonyms(
	word: string,
	context: string | undefined,
): Promise<RankResponse> {
	return new Promise((resolve, reject) => {
		if (!workerProcess) {
			reject(new Error('Synonym backend is not running'));
			return;
		}

		const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
		const request: RankRequest = { id, word, context, topN: 10 };

		const timeout = setTimeout(() => {
			pendingRequests.delete(id);
			reject(new Error('Synonym backend timed out'));
		}, 10000);

		pendingRequests.set(id, {
			resolve: (response) => {
				clearTimeout(timeout);
				resolve(response);
			},
			reject: (error) => {
				clearTimeout(timeout);
				reject(error);
			},
		});

		workerProcess.stdin.write(`${JSON.stringify(request)}\n`);
	});
}

joplin.plugins.register({
	onStart: async function() {
		startWorker();

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'synonymFinderScript',
			'./contentScript.js',
		);

		await joplin.contentScripts.onMessage(
			'synonymFinderScript',
			async (message: SynonymMessage) => {
				if (message.type === 'synonymRequest') {
					let response: RankResponse;
					try {
						response = await requestSynonyms(message.word, message.context);
					} catch (error) {
						console.error('Synonym backend request failed:', error);
						return { status: 'error' };
					}

					if (response.error) {
						return { status: 'error' };
					}
					if (!response.results || response.results.length === 0) {
						return { status: 'empty' };
					}

					const top3 = [...response.results]
						.sort((a, b) => b.score - a.score)
						.slice(0, 3)
						.map((entry) => entry.word);
					return {
						status: 'success',
						synonyms: top3,
					};
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
