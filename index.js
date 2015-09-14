var Through = require('through2');
var Util = require('gulp-util');
var Dot = require('dot');
var Path = require('path');
var Htmlmin = require('html-minifier');

const PLUGIN_NAME = 'gulp-seajs-dot';

function readStream(stream, done) {
	var buffer = '';
	stream.on('data', function (chunk) {
		buffer += chunk;
	}).on('end', function () {
		done(null, buffer);
	}).on('error', function (error) {
		done(error);
	});
}

function compile(contents, moduleId){

	// 先删掉注释
	contents = contents.replace(/<!--[\w\W\r\n]*?-->/gmi, '');

	var regStart = /(<script.*?id=["'](.*?)["'].*?type=["']text\/template["'].*?>|<script.*?type=["']text\/template["'].*?id=["'](.*?)["'].*?>)/i;
	var regRepAll = /(<script.*?type=["']text\/template["'].*?>)/ig;

	function getChildId(child){
		var m = child.match(regStart);
		return m ? (m[2] || m[3]) : false;
	}

	function getChildCode(child){
		return child.replace(/^\s*<script.*?>/, '').replace(/<\/script>\s*$/, '');
	}

	var output = [];
	if(!regStart.test(contents)){
		// 如果没有指定模板，则按普通html整体暴露
		output.push("  module.exports = '" + Htmlmin.minify(getChildCode(contents), {collapseWhitespace: true}).replace(/[']/g, "\\'") + "'");
	}else{
		var input = contents.replace(regRepAll, '|###|$1').split('|###|').slice(1);
		input.forEach(function(item){
			var childId = getChildId(item);
			if(!childId) return;
			output.push('  exports.' + childId + ' = ' + Dot.template(getChildCode(item)).toString() + ';');
		});
	}

	return "define('" + moduleId + "', function(require, exports, module){\n" +
		output.join('\n') +
		"\n});";
}

module.exports = function (options) {

	options = options || {};

	var stream = Through.obj(function (file, enc, callback) {
		var complete = function (error, contents) {
			if (error) {
				this.emit('error', new Util.PluginError(PLUGIN_NAME, error));
			}
			try {
				var moduleId = file.path.replace(file.base, '').replace(Path.extname(file.path), '').replace(Path.sep, '/' + (options.prefix || ''));
				file.contents = new Buffer(compile(contents, moduleId));
				this.push(file);
				return callback();
			}
			catch (exception) {
				this.emit('error', new Util.PluginError(PLUGIN_NAME, exception));
			}
		}.bind(this);

		file.path = Util.replaceExtension(file.path, '.js');

		if (file.isBuffer()) {
			complete(null, file.contents.toString());
		} else if (file.isStream()) {
			readStream(file.contents, complete);
		}
	});
	return stream;
};;
