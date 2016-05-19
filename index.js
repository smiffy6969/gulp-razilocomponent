var fs = require('fs');
var es = require('event-stream');

module.exports = function(type) {
	var componentImports = [];
	var componentContent = '';
	var scriptImports = {};

	// tweak style before ading to content buffer
	var buildStyle = function(content, compName) {
		if (!content || !content[1]) return;
		content = content[1];

		componentContent += content.replace(/[\s|\r|\n]*[C|c]{1}omponent\s?\{/, compName.html + ' {');
	}

	// tweak template before ading to content buffer
	var buildTemplate = function(content, compName) {
		if (!content || !content[1]) return;
		content = content[1];

		componentContent += '<template id="' + compName.html + '">' + content + '</template>\r\n';
	}

	// tweak script before ading to content buffer
	var buildScript = function(content, compName) {
		if (!content || !content[1]) return;
		content = content[1];

		// remove all script imports
		var matches = content.match(/(import\s\{?[\w,\s]*\}?\sfrom\s['|"]{1}[\w.\/-]*['|"]{1})/g);
		content = content.replace(/(import\s\{?[\w,\s]*\}?\sfrom\s['|"]{1}[\w.\/-]*['|"]{1})/g, '');

		// cache removed imports
		for (var i = 0; i < matches.length; i++) {
			var importNames = matches[i].match(/import\s\{?([\w,\s]*)\}?\sfrom/);
			var importPaths = matches[i].match(/from\s[\'|"]{1}([\w.\/-]*)[\'|"]{1}/);
			if (!importNames[1] || !importPaths[1]) throw 'Cannot parse script imports';

			if (!scriptImports[importPaths[1]]) scriptImports[importPaths[1]] = {'default': matches[i].indexOf('{') >= 0 ? false : true, 'names': []};

			importNames = importNames[1].split(/\r?\n?\s?,\s?\r?\n?/);
			for (var ii = 0; ii < importNames.length; ii++) {
				if (scriptImports[importPaths[1]].names.indexOf(importNames[ii]) >= 0) continue;
				scriptImports[importPaths[1]].names.push(importNames[ii]);
			}
		}

		// change generic class into specific class
		content = content.replace(/class\s[C|c]{1}omponent/, 'class ' + compName.class);

		// ensure we remove export default and have constructor with super call for parent
		if (!content.match(/constructor\s?\(.*\)\s?\{/)) throw 'Component class must have constructor';
		content = content.replace(/export\s*default\s*class/, 'class');
		var hasSuper = content.match(/constructor\s?\(.*\)\s?\{[\r|\n|\s|\t]*super\(.*\)/);
		if (!hasSuper) content = content.replace(/constructor\s?\(.*\)\s?\{/, 'constructor() {\r\nsuper(\'' + compName.html + '\');\r\n');
		else content = content.replace(/constructor\s?\(.*\)\s?\{[\r|\n|\s|\t]*super\(.*\)/, 'constructor() {\r\nsuper(\'' + compName.html + '\')');

		// add self registration
		content += '\r\nnew ' + compName.class + '().register();\r\n';

		componentContent += content;
	}

	// finish writing out imports
	var finishScript = function() {
		var importContent = '';
		for (var imp in scriptImports) {
			if (!scriptImports[imp].default) {
				if (scriptImports[imp].names.length < 1) continue;
				importContent += 'import ';
				importContent += !scriptImports[imp].default ? '{' : '';
				for (var i = 0; i < scriptImports[imp].names.length; i++) importContent += scriptImports[imp].names[i] + ',';
				importContent = importContent.substring(0, importContent.length -1);
				importContent += !scriptImports[imp].default ? '}' : '';
				importContent += ' from \'' + imp + '\'\r\n';
			} else {
				for (var i = 0; i < scriptImports[imp].names.length; i++)
				{
					importContent += 'import ';
					importContent += scriptImports[imp].names[i];
					importContent += ' from \'' + imp + '\'\r\n';
				}
			}
		}

		// write import cache to start of content
		componentContent = importContent + componentContent;
	}

	// stripper parser
	var stripper = function(file, type) {
		// get component
		var component = file.contents.toString().match(/<razilo-component>([\s\S]*)<\/razilo-component>/);
		if (!component || !component[1]) throw 'Cannot find "razilo-component" tag in component file';

		// get match
		var match;
		if (type == 'style') match = component[1].match(/<style[^>]*>([\s\S]*)<\/style>/);
		else if (type == 'template') match = component[1].match(/<template[^>]*>([\s\S]*)<\/template>/);
		else if (type == 'script') match = component[1].match(/<script[^>]*>([\s\S]*)<\/script>/);

		// get details
		var details = component[1].match(/<details[^>]*>([\s\S]*)<\/details>/);
		if (!details[1]) throw 'Cannot find details for component';
		var name = details[1].match(/<name[^>]*>([\s\S]*)<\/name>/);
		if (!name[1]) throw 'Cannot find name for component';
		var compName = {
			'html': name[1].trim(),
			'class': name[1].charAt(0).toUpperCase() + name[1].replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }).slice(1)
		};

		// write contents
		if (type == 'style') buildStyle(match, compName);
		if (type == 'template') buildTemplate(match, compName);
		if (type == 'script') buildScript(match, compName);

		// get imports
		var imports = component[1].match(/<imports[^>]*>([\s\S]*)<\/imports>/);
		if (!!imports && !!imports[1])
		{
			var links = imports[1].match(/[!--]*\s*<link\s*type="text\/razilo-component"\s*rel="import"\s*href=".*">/g);
			if (!!links && links.length > 0)
			{
				for (var i = 0; i < links.length; i++)
				{
					if (links[i].indexOf('!--') >= 0) continue;
					var href = links[i].match(/href=["|']{1}([^"|']*)["|']{1}/);
					if (componentImports.indexOf(href[1]) < 0)
					{
						componentImports.push(href[1]);
						var data = fs.readFileSync(href[1]);
						if (!data) throw 'Cannot read import ' + href[1];
						stripper({path: href[1], contents: data}, type);
					}
				}
			}
		}
	}

	return es.map(function(file, callback) {
		// strip file data
		stripper(file, type);

		// finish builds
		if (type == 'script') finishScript();

		// write starting point for the chain in cache to buffer
		file.contents = new Buffer(componentContent);

		if (type == 'template')
		{
			if (!fs.existsSync('./.razilo-cache')) fs.mkdirSync('./.razilo-cache');
			fs.writeFileSync('./.razilo-cache/template.html', componentContent);
			file.path = './.razilo-cache/template.html';
		}

		// return file contents buffer so browserify can parse it
		callback(null, file);
	});
};
