/* eslint-disable no-magic-numbers */

'use strict';

/** @import { Config, ValidationResult } from '../src/types' */

const { Validator } = require('jsonschema');

const schemaValidator = new Validator();

const metricSchema = require('./metrics.json');

const repoSchema = {
	additionalProperties: false,
	id: '/repo',
	properties: {
		focus: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
		ignore: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
	},
};

const overridesSchema = {
	additionalProperties: false,
	id: '/overrides',
	properties: {
		metrics: { $ref: '/metrics' },
		repos: {
			oneOf: [
				{ type: 'string' },
				{
					items: { type: 'string' },
					type: 'array',
					uniqueItems: true,
				},
			],
		},
	},
};

const configSchema = {
	additionalProperties: false,
	id: '/config',
	properties: {
		metrics: { $ref: '/metrics' },
		overrides: {
			$ref: '/overrides',
		},
		repositories: {
			$ref: '/repo',
		},
	},
	type: 'object',

};

schemaValidator.addSchema(metricSchema, '/metrics');
schemaValidator.addSchema(repoSchema, '/repo');
schemaValidator.addSchema(overridesSchema, '/overrides');

/** @type {(config: Config) => ValidationResult} */
module.exports = function validate(config) {
	const { errors } = schemaValidator.validate(config, configSchema);
	if (errors && errors.length) {
		const errorList = errors.map((error) => {
			const prefix = `config${error.path.length > 0 ? '.' : ''}${error.path.join('.')}`;
			if (error.name === 'oneOf') {
				const hasDuplicateValues = Array.isArray(error.instance)
					&& new Set(error.instance).size !== error.instance.length;
				return `${prefix} ${hasDuplicateValues ? 'has duplicate values' : 'has an invalid value'}`;
			}
			return `${prefix} ${error.message}`;
		});
		return { error: `Config validation error(s):\n\t${errorList.join('\n\t')}`, valid: false };
	}

	return { valid: true };
};

