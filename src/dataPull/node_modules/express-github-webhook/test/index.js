'use strict';

const request = require('supertest');
const	crypto = require('crypto');
const	test = require('tape');
const	express = require('express');
const bodyParser = require('body-parser');
const GithubWebHook = require('../');

function signData(secret, data) {
	return 'sha1=' + crypto.createHmac('sha1', secret).update(data).digest('hex');
}

test('Invalid construction of GithubWebHook handler', function (t) {
	t.plan(4);
	t.equal(typeof GithubWebHook, 'function', 'GithubWebHook exports a function');
	t.throws(GithubWebHook, /must provide an options object/, 'throws if no options');
	t.throws(GithubWebHook.bind(null, ''), /must provide an options object/, 'throws if option is not an object');
	t.throws(GithubWebHook.bind(null, {}), /must provide a 'path' option/, 'throws if no path option');
});

test('GithubWebHook handler is an EventEmitter', function (t) {
	t.plan(5);

	const options = {path: '/hook', secret: 'secret'};
	let handler = GithubWebHook(options);
	t.equal(typeof handler.on, 'function', 'has h.on()');
	t.equal(typeof handler.emit, 'function', 'has h.emit()');
	t.equal(typeof handler.removeListener, 'function', 'has h.removeListener()');

	handler.on('foo', function (bar) {
		t.equal(bar, 'bar', 'got event');
	});

	handler.emit('foo', 'bar');

	t.throws(handler.emit.bind(handler, 'error', new Error('error')), /error/, 'works as a EventEmitter');
});

test('Ignore unmatched path', function (t) {
	t.plan(3);

	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook'});
	let app = express();

	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
	});

	request(app)
		.get('/')
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			t.deepEqual(res.body, {message: 'Here'}, 'ignore pathunmatched request');
		});

	request(app)
		.get('/github/hook/')
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			t.deepEqual(res.body, {message: 'Here'}, 'ignore path unmatched request');
		});

	request(app)
		.get('/github')
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			t.deepEqual(res.body, {message: 'Here'}, 'ignore path unmatched request');
		});
});

test('Ignore unmatched request method', function (t) {
	t.plan(1);

	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook'});
	let app = express();

	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
	});

	request(app)
		.get('/github/hook')
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			t.deepEqual(res.body, {message: 'Here'}, 'ignore unmatched request method');
		});
});

test('Invalid request meta', function (t) {
	t.plan(6);
	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook', secret: 'secret'});
	let app = express();
	app.use(bodyParser.json());
	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
		t.fail(true, 'should not reach here');
	});

	request(app)
		.post('/github/hook')
		.set('Content-Type', 'application/json')
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function(err, res) {
			t.deepEqual(res.body, {error: 'No id found in the request'}, 'request should have id');
		});

	request(app)
		.post('/github/hook')
		.set('Content-Type', 'application/json')
		.set('X-GitHub-Delivery', 'id')
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function(err, res) {
			t.deepEqual(res.body, {error: 'No event found in the request'}, 'request should have event');
		});

	request(app)
		.post('/github/hook')
		.set('Content-Type', 'application/json')
		.set('X-GitHub-Delivery', 'id')
		.set('X-GitHub-Event', 'event')
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function(err, res) {
			t.deepEqual(res.body, {error: 'No signature found in the request'}, 'request should have signature');
		});

	webhookHandler.on('error', function(err, req, res) {
		t.ok(err, 'error caught');
	});
});

test('Invalid signature', function (t) {
	t.plan(2);
	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook', secret: 'secret'});
	let app = express();
	app.use(bodyParser.json());
	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
		t.fail(true, 'should not reach here');
	});

	let invalidSignature = 'signature';

	request(app)
		.post('/github/hook')
		.set('Content-Type', 'application/json')
		.set('X-GitHub-Delivery', 'id')
		.set('X-GitHub-Event', 'event')
		.set('X-Hub-Signature', invalidSignature)
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function(err, res) {
			t.deepEqual(res.body, {error: 'Failed to verify signature'}, 'signature does not match');
		});

	webhookHandler.on('error', function(err, req, res) {
		t.ok(err, 'error caught');
	});
});

test('No body-parser is used', function (t) {
	t.plan(2);
	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook', secret: 'secret'});
	let app = express();
	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
		t.fail(true, 'should not reach here');
	});

	let invalidSignature = 'signature';

	request(app)
		.post('/github/hook')
		.set('Content-Type', 'application/json')
		.set('X-GitHub-Delivery', 'id')
		.set('X-GitHub-Event', 'event')
		.set('X-Hub-Signature', invalidSignature)
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function(err, res) {
			t.deepEqual(res.body, {error: 'Make sure body-parser is used'}, 'Verify use of body-parser');
		});

	webhookHandler.on('error', function(err, req, res) {
		t.ok(err, 'error caught');
	});
});

test('Accept a valid request with json data', function (t) {
	t.plan(8);
	/**
	 * Create mock express app
	 */
	let webhookHandler = GithubWebHook({path: '/github/hook', secret: 'secret'});
	let app = express();
	app.use(bodyParser.json());
	app.use(webhookHandler); // use our middleware
	app.use(function(req, res) {
		res.status(200).send({message: 'Here'});
		t.fail(true, 'should not reach here');
	});

	/**
	 * Mock request data
	 */
	var data = {
		ref: 'ref',
		foo: 'bar',
		repository: {
			name: 'repo'
		}
	};
	var json = JSON.stringify(data);

	request(app)
		.post('/github/hook')
		.send(json)
		.set('Content-Type', 'application/json')
		.set('X-GitHub-Delivery', 'id')
		.set('X-GitHub-Event', 'push')
		.set('X-Hub-Signature', signData('secret', json))
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function(err, res) {
			t.deepEqual(res.body, {success:true}, 'accept valid json request');
		});

	webhookHandler.on('repo', function(event, data) {
		t.equal(event, 'push', 'receive a push event on event \'repo\'');
		t.deepEqual(data, data, 'receive correct data on event \'repo\'');
	});

	webhookHandler.on('push', function(repo, data) {
		t.equal(repo, 'repo', 'receive a event for repo on event \'push\'');
		t.deepEqual(data, data, 'receive correct data on event \'push\'');
	});

	webhookHandler.on('*', function(event, repo, data) {
		t.equal(event, 'push', 'receive a push event on event \'*\'');
		t.equal(repo, 'repo', 'receive a event for repo on event \'*\'');
		t.deepEqual(data, data, 'receive correct data on event \'*\'');
	});
});
