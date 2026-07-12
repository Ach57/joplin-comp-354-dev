import * as path from 'path';
import * as fs from 'fs';

const venvPython = path.resolve(__dirname, '../../python/.venv/bin/python');
const PYTHON_EXECUTABLE = fs.existsSync(venvPython) ? venvPython : 'python';
const BACKEND_CWD = path.resolve(__dirname, '../../python/src');

describe('Path configurations', () => {
	test('should resolve venv python correctly', () => {
		expect(venvPython).toContain('.venv/bin/python');
	});
	test('should resolve python executable', () => {
		expect(PYTHON_EXECUTABLE).toContain('python');
	});
	test('should resolve backend current working directory correctly', () => {
		expect(BACKEND_CWD).toContain('/python/src');
	});
});
