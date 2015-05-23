#!/usr/bin/env node
// reem.js

var fs = require('fs'),
	path = require('path'),
	Reem = require('../'),
	async = require('async'),
	program = require('commander'),
	monocle = require('monocle')();

program
	.version(require('../package.json').version)
	.usage('[options]')
	.option('-d, --dir <folder>', '<folder> where everthing is')
	.option('-r, --run <script>', '<script> configures before builds')
	.option('-w, --watch', 'rebuild output directory after changes')
	.option('-i, --init', 'initialize <folder> with default directories and a Reemfile')
	.option('-p, --production', 'configure to build for production')
	.parse(process.argv);

var reem,
	root = program.dir 
		? path.join(process.cwd(), program.dir)
		: process.cwd();

if(program.init) return init();
exec();

function init() {
	async.parallel([
		mkdir('source'),
		mkdir('output'),
		mkdir('layout'),
		writeReemfile
	], function(error) {
		if(error) throw error;
	});

	function mkdir(name) {
		return function(done) {
			var dir = path.join(root, name);
			fs.stat(dir, function(error, stats) {
				if(error && error.code === 'ENOENT') {
					// directory does not exist
					fs.mkdir(dir, done);
				} else {
					done(error);
				}
			});
		}
	}

	function writeReemfile(done) {
		var file = path.join(root, 'reemfile.js'),
			REEMFILE = [
				'// reemfile.js',
				'module.exports = function(reem, done) {',
				'	// configure reem...',
				'',
				'	done(null);',
				'}'
			].join("\n");
		fs.readFile(file, function(error) {
			if(error && error.code === 'ENOENT') {
				// file does not exist yet
				fs.writeFile(file, REEMFILE, done);
			} else {
				done(error);
			}
		});
	}
}

function exec() {
	reem = Reem(root);
	reem.env.production = !!program.production;

	async.series([
		setup,
		build, 
		watch
	], error);

	function error(err) {
		if(err) throw err;
	}

	function setup(done) {
		var rf = getReemfile();
		if(typeof rf === 'function') {
			return rf(reem, done);
		}
		done(null);
	}

	function getReemfile() {
		return require(
			path.join(root, program.run || 'reemfile.js'));
	}

	function build(done) {
		reem.build(done);
	}

	function watch(done) {
		if(program.watch) {
			return async.parallel([
				watchDir(reem.fs.source.sourcePath),
				watchDir(reem.fs.layout.filepath)
			], done); 
		}
		done(null);

		function watchDir(dir) {
			return function(next) {
				monocle.watchDirectory({
					root: dir,
					listener: function(file) {
						watchLog("'"+file.path+"' changed");
						reem.diffBuild(file.fullPath, error);
					},
					complete: function() {
						watchLog("watching /"+path.relative(reem.fs.root, dir)+"...");
						next(null);
					}
				});
			}
		}

		function watchLog(msg) {
			var date = new Date(Date.now()),
				hrmn = (function() {
					var hr = (date.getHours() % 12).toString(),
						mn = date.getMinutes().toString();
					return (hr.length === 1 ? "0"+hr : hr)+":"+(mn.length === 1 ? "0"+mn : mn);
				})();
			console.log("\t"+hrmn+" "+msg);
		}
	}
}
