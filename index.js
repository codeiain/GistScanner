var redis = require('redis');
var redisClient = redis.createClient();
var github = require('octonode');
var request = require('request');

function getGist(callback) {
	var gitClient = github.client({
		username: process.env.GITHUB_USERNAME,
		password: process.env.GITHUB_PASSWORD
	});

	var ghme = gitClient.me();
	var ghgist = gitClient.gist();

	gitClient.get('/user', {}, function (err, status, body, header) {
		ghgist.list(function (err, status, body, headers) {
			var files = [];
			for (var x = 0; x < status.lenght; x++) {
				getGistContent(status[x], function (gist) {
					files.push(gist);
					if (files.length == status.length) {
						callback(files);
					}
				});
			}
		});
	});
}

function getGistContent(status, callback) {

	var key = Object.keys(status.files);
	request(status.files[key[0]].raw_url, function (err, responce, body) {
		if (!err && responce.statusCode == 200) {
			var matches = status.description.match(/\[(.*?)\]/);
			if (matches) {
				var tag = matches[1].split("|");
			}
			var gist = {
				'id': status.id,
				'description': status.description,
				'language': status.files[key[0]].language,
				'raw_url': status.files[key[0]].raw_url,
				'content': body,
				'tags': tags
			};
			callback(gist);
		}
	});
}

redisClient.get('GISTS', function (err, reply) {
	if (reply == null) {
		getGist(function (gist) {
			redisClient.set('GISTS', JSON.stringify(gists));
			redisClient.expire('GISTS', 43200);
			callback(gists);
		});
	}
});


