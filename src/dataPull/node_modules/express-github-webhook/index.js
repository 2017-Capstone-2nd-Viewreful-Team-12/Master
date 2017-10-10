'use strict';

/**
 * Module dependencies
 */
const EventEmitter = require('events').EventEmitter;
const crypto = require('crypto');
const bufferEq = require('buffer-equal-constant-time');

/**
 * Helper functions
 */
function signData(secret, data) {
	return 'sha1=' + crypto.createHmac('sha1', secret).update(data).digest('hex');
}

function verifySignature(secret, data, signature) {
	return bufferEq(new Buffer(signature), new Buffer(signData(secret, data)));
}

const GithubWebhook = function(options) {
	if (typeof options !== 'object') {
		throw new TypeError('must provide an options object');
	}

	if (typeof options.path !== 'string') {
		throw new TypeError('must provide a \'path\' option');
	}

	options.secret = options.secret || '';

	// Make handler able to emit events
	Object.setPrototypeOf(githookHandler, EventEmitter.prototype);
	EventEmitter.call(githookHandler);

	return githookHandler;

	function githookHandler(req, res, next) {
		if (req.method !== 'POST' || req.url.split('?').shift() !== options.path) {
			return next();
		}

		function reportError(message) {
			// respond error to sender
			res.status(400).send({
				error: message
			});

			// emit error
			githookHandler.emit('error', new Error(message), req, res);
		}

		// check header fields
		let id = req.headers['x-github-delivery'];
		if (!id) {
			return reportError('No id found in the request');
		}

		let event = req.headers['x-github-event'];
		if (!event) {
			return reportError('No event found in the request');
		}

		let sign = req.headers['x-hub-signature'] || '';
		if (options.secret && !sign) {
			return reportError('No signature found in the request');
		}

		if (!req.body) {
			return reportError('Make sure body-parser is used');
		}

		// verify signature (if any)
		if (options.secret && !verifySignature(options.secret, JSON.stringify(req.body), sign)) {
			return reportError('Failed to verify signature');
		}

		// parse payload
		let payloadData = req.body;
		const repo = payloadData.repository && payloadData.repository.name;

		// emit events
		githookHandler.emit('*', event, repo, payloadData);
		githookHandler.emit(event, repo, payloadData);
		if (repo) {
			githookHandler.emit(repo, event, payloadData);
		}

		res.status(200).send({
			success: true
		});
	}
};

/**
 * Module exports
 */
module.exports = GithubWebhook;
