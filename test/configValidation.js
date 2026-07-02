'use strict';

const test = require('tape');

const validateConfig = require('../config/validate');
const defaults = require('../config/defaults.json');

/** @type {(metrics: object) => import('../src/types').Config} */
function withMetrics(metrics) {
	return {
		...defaults,
		metrics: {
			...defaults.metrics,
			...metrics,
		},
	};
}

test('validateConfig', (t) => {
	t.deepEqual(validateConfig(defaults), { valid: true }, 'default config is valid');

	t.deepEqual(
		validateConfig(withMetrics({ IssueCreationPolicy: ['ALL', 'ALL'] })),
		{
			error: 'Config validation error(s):\n\tconfig.metrics.IssueCreationPolicy has duplicate values',
			valid: false,
		},
		'an array with duplicate values is reported as having duplicates',
	);

	t.deepEqual(
		validateConfig(withMetrics({ IssueCreationPolicy: 'EVERYONE' })),
		{
			error: 'Config validation error(s):\n\tconfig.metrics.IssueCreationPolicy has an invalid value',
			valid: false,
		},
		'an invalid value is not reported as having duplicates',
	);

	t.deepEqual(
		validateConfig(withMetrics({ Subscription: ['SUBSCRIBED', 'BOGUS'] })),
		{
			error: 'Config validation error(s):\n\tconfig.metrics.Subscription has an invalid value',
			valid: false,
		},
		'an array with an invalid value is not reported as having duplicates',
	);

	t.deepEqual(
		validateConfig(withMetrics({ IssuesEnabled: 'yes' })),
		{
			error: 'Config validation error(s):\n\tconfig.metrics.IssuesEnabled is not of a type(s) boolean,null',
			valid: false,
		},
		'non-`oneOf` errors report the underlying schema message',
	);

	t.end();
});
