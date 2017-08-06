const express = require('express')
	, GithubWebHook = require('express-github-webhook')
	, bodyParser = require('body-parser')
	, node_ssh = require('node-ssh')
	, redis = require('redis')

global.config = require('./config.js');
// Redis Subscriptions
global.pub = redis.createClient(config.redis.server);
global.sub = redis.createClient(config.redis.server);

const app = express();

// Github Webhook
var webhookHandler = GithubWebHook(config.github.webHook);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Redis Subscriptions
sub.on('subscribe', function (channel, count) {
	console.log('Redis Subscribe Channel '+channel);
});
sub.on('message', function (channel, message) {
	if (channel == 'SVN') {
		if (message == 'update') {
			ssh = new node_ssh();
			ssh.connect(config.ssh)
			.then(function() {
				ssh.execCommand('svn update', { cwd: __dirname }).then(function(result) {
					console.log(result.stdout);
					ssh.dispose();
				})
			});
		}
	}
});
sub.subscribe('SVN');

// Github Webhook
app.use(webhookHandler);
webhookHandler.on('*', function (event, repo, data) {
	if (event == 'push' && repo == 'Warehouse' && data.ref == 'refs/heads/'+config.github.branch) {
		pub.publish('SVN', 'update');
	}
});

app.get('*', function (req, res) {
  res.send(config.systemName);
});



app.listen(config.port, function () {
  console.log('Example app listening on port '+config.port+'!')
})