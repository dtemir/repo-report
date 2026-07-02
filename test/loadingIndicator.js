'use strict';

const test = require('tape');
const mockProperty = require('mock-property');

const loadingIndicator = require('../src/loadingIndicator');
const { stdout } = require('./test-utils');

test('loadingIndicator: when stdout is not a TTY', (t) => {
	t.teardown(mockProperty(process.stdout, 'isTTY', { value: false }));
	const output = stdout();

	loadingIndicator(() => 'task result').then((result) => {
		output.restore();
		t.equal(result, 'task result', 'returns the task result');
		t.deepEqual(output.loggedData, [], 'writes nothing to stdout');
		t.end();
	}).catch((error) => {
		output.restore();
		t.error(error);
		t.end();
	});
});

test('loadingIndicator: when stdout is a TTY', (t) => {
	/** @type {unknown[][]} */
	const calls = [];
	t.teardown(mockProperty(process.stdout, 'isTTY', { value: true }));
	t.teardown(mockProperty(process.stdout, 'clearLine', {
		value: /** @type {typeof process.stdout.clearLine} */ (function clearLine(dir) {
			calls[calls.length] = ['clearLine', dir];
			return true;
		}),
	}));
	t.teardown(mockProperty(process.stdout, 'cursorTo', {
		value: /** @type {typeof process.stdout.cursorTo} */ (function cursorTo(x) {
			calls[calls.length] = ['cursorTo', x];
			return true;
		}),
	}));
	const output = stdout();

	loadingIndicator(() => 'task result').then((result) => {
		output.restore();
		t.equal(result, 'task result', 'returns the task result');
		t.deepEqual(output.loggedData, ['Loading...', '\n'], 'writes the loading line, and a trailing newline');
		t.deepEqual(
			calls,
			[['clearLine', 0], ['cursorTo', 0]],
			'clears the loading line and resets the cursor',
		);
		t.end();
	}).catch((error) => {
		output.restore();
		t.error(error);
		t.end();
	});
});
