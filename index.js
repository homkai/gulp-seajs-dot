var Through = require('through2');
var Util = require('gulp-util');
var Dot = require('dot');
var Path = require('path');
var HtmlMinifier = require('html-minifier');

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

function compile(contents, options){

	// 先删掉注释
	contents = contents.replace(/<!--[\w\W\r\n]*?-->/gmi, '');

	var regStart = /(<script.*?export=["'](.*?)["'].*?type=["']text\/template["'].*?>|<script.*?type=["']text\/template["'].*?export=["'](.*?)["'].*?>)/i;
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
		var htmlMinifierOption = options.htmlMinifier || {};
		htmlMinifierOption.collapseWhitespace = true;
		output.push("  module.exports = '" + HtmlMinifier.minify(getChildCode(contents), htmlMinifierOption).replace(/[']/g, "\\'") + "'");
	}else{
		var input = contents.replace(regRepAll, '|###|$1').split('|###|').slice(1);
		input.forEach(function(item){
			var childId = getChildId(item);
			if(!childId) return;
			output.push('  exports.' + childId + ' = ' + Dot.template(getChildCode(item)).toString() + ';');
		});
	}

	return "define(function(require, exports, module){\r\n" +
		output.join('\r\n') +
		"\r\n});";
}

module.exports = function (options) {

	options = options || {};

	var stream = Through.obj(function (file, enc, callback) {
		var complete = function (error, contents) {
			if (error) {
				this.emit('error', new Util.PluginError(PLUGIN_NAME, error));
			}
			try {
				file.contents = new Buffer(compile(contents, options));
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
