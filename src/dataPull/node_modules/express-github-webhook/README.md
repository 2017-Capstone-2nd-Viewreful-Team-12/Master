# express-github-webhook
[![Build Status](https://travis-ci.org/Gisonrg/express-github-webhook.svg?branch=master)](https://travis-ci.org/Gisonrg/express-github-webhook)

A Express middleware for handle Github [Webhooks](https://developer.github.com/webhooks/)

To Install:
-----------
```
npm install express-github-webhook
```

To Use:
-------

**Make sure you use [body-parser](https://github.com/expressjs/body-parser) middleware for your Express app**

```javascript
var GithubWebHook = require('express-github-webhook');
var webhookHandler = GithubWebHook({ path: '/webhook', secret: 'secret' });

// use in your express app
let app = express();
app.use(bodyParser.json()); // must use bodyParser in express
app.use(webhookHandler); // use our middleware

// Now could handle following events
webhookHandler.on('*', function (event, repo, data) {
});

webhookHandler.on('event', function (repo, data) {
});

webhookHandler.on('reponame', function (event, data) {
});

webhookHandler.on('error', function (err, req, res) {
});
```

Where **'event'** is the event name to listen to (sent by [GitHub](https://developer.github.com/webhooks/#events), such as 'push'), **'reponame'** is the name of your repo.

**'error'** event is a special event, which will be triggered when something goes wrong in the handler (like failed to verify the signature).

Available options for creating handler are:

* path: the path for the GitHub callback, only request that matches this path will be handled by the middleware.
* secret (option): the secret used to verify the signature of the hook. If secret is set, then request without signature will fail the handler. If secret is not set, then the signature of the request (if any) will be ignored. [Read more](https://developer.github.com/webhooks/securing/)


TODO
-----------
* Add support for content type of `application/x-www-form-urlencoded`
* Provide more available options
* Get rid of `body-parser` middleware

License
=======

[MIT](LICENSE)
