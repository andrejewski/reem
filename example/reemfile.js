// reemfile.js
var markdown = require('reem-markdown');

module.exports = function(reem, done) {
	// configure reem...
	reem.view.engine = 'pug';
	reem.view.extension = '.pug';

	reem.Post.use(markdown())

	done(null);
}
