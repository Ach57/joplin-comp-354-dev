import * as path from 'path';
import * as fs from 'fs';
import PythonProcessManager from '../../src/infrastructure/PythonProcessManager';
import RankingService from '../../src/services/RankingService';
import { spawn } from 'child_process';

const venvPython = path.resolve(__dirname, '../../python/.venv/bin/python');
const PYTHON_EXECUTABLE = fs.existsSync(venvPython) ? venvPython : 'python';
const BACKEND_CWD = path.resolve(__dirname, '../../python/src');

describe('NLP backend integration', () => {
	let manager: PythonProcessManager;
	let service: RankingService;

	beforeAll(async () => {
		manager = new PythonProcessManager(
			'thesaurus_nlp.main',
			PYTHON_EXECUTABLE,
			(pythonExec, _args) =>
				spawn(pythonExec, ['-u', '-m', 'thesaurus_nlp.main'], {
					stdio: ['pipe', 'pipe', 'pipe'],
					cwd: BACKEND_CWD,
				}),
		);
		service = new RankingService(manager);
		await manager.start();
	}, 30000);

	afterAll(async () => {
		await manager.stop();
	});

	test('returns ranked synonyms for a common word with context', async () => {
		const result = await service.getSuggestions(
			'happy',
			'She was happy to see her old friend again.',
		);

		expect(result.results.length).toBeGreaterThan(0);
		for (const entry of result.results) {
			expect(typeof entry.word).toBe('string');
			expect(entry.word.length).toBeGreaterThan(0);
			expect(typeof entry.score).toBe('number');
			expect(entry.score).toBeGreaterThanOrEqual(0);
			expect(entry.score).toBeLessThanOrEqual(1);
		}
	}, 30000);

	test('returns results sorted by score descending', async () => {
		const result = await service.getSuggestions(
			'sad',
			'He felt sad after hearing the news.',
		);

		const scores = result.results.map((e) => e.score);
		for (let i = 1; i < scores.length; i++) {
			expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
		}
	}, 30000);

	test('returns results without context', async () => {
		const result = await service.getSuggestions('bad', '');

		expect(result.results.length).toEqual(0);
	}, 30000);

	test('does not return the queried word itself in results', async () => {
		const word = 'large';
		const result = await service.getSuggestions(
			word,
			'The large building stood at the corner.',
		);

		const words = result.results.map((e) => e.word.toLowerCase());
		expect(words).not.toContain(word.toLowerCase());
	}, 30000);
});
