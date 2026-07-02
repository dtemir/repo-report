'use strict';

const test = require('tape');
const Module = require('module');
const path = require('path');

const mockGraphQL = require('./mocks');

const utilsPath = require.resolve('../src/utils');
const getRepositoriesPath = require.resolve('../src/getRepositories');

test('repositories.focus: repos matching any focus pattern are kept', (t) => {
	const nodes = ['owner/a', 'owner/b', 'owner/c'].map((nameWithOwner) => ({
		name: nameWithOwner.split('/')[1],
		nameWithOwner,
		isFork: false,
		isPrivate: false,
		viewerPermission: 'ADMIN',
		defaultBranchRef: null,
	}));

	const mockedGraphql = mockGraphQL({
		viewer: { repositories: { nodes, pageInfo: { hasNextPage: false } } },
		rateLimit: { cost: 1, remaining: 4999 },
	});

	const originalRequire = Module.prototype.require;
	/** @param {string} id */
	Module.prototype.require = function (id) {
		if (id === '@octokit/graphql') {
			return { graphql: mockedGraphql };
		}
		return originalRequire.call(this, id);
	};

	const restore = () => {
		Module.prototype.require = originalRequire;
		delete require.cache[utilsPath];
		delete require.cache[getRepositoriesPath];
	};

	delete require.cache[utilsPath];
	delete require.cache[getRepositoriesPath];
	// eslint-disable-next-line global-require -- must load after the @octokit/graphql mock is installed
	const { isConfigValid } = require('../src/utils');
	// eslint-disable-next-line global-require -- must load after the @octokit/graphql mock is installed
	const { getRepositories } = require('../src/getRepositories');

	const validation = isConfigValid([path.join(__dirname, 'fixtures/focusConfig.json')]);
	t.deepEqual(validation, { valid: true }, 'focus fixture config is valid');

	getRepositories({ token: 'secret', sort: 'name' }).then((result) => {
		t.deepEqual(
			result.repositories.map((repo) => repo.nameWithOwner),
			['owner/a', 'owner/c'],
			'keeps every repo that matches at least one focus pattern',
		);
		restore();
		t.end();
	}).catch((e) => {
		restore();
		t.error(e);
		t.end();
	});
});
