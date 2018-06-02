const fs = require('fs');
const PATH = require('path');
const Utils = require('./lib/utils.js');
const uglify = require('uglify-js');
const Compile = require('./lib/compile.js');
const Maker = require('./lib/maker.js');

globals = Maker.globalDescriptions;
Utils.merge( Compile, Maker );

//全局配置
const defaultConfig = {
    'suffix': '.es',  //需要编译文件的后缀
    'debug':'on', //是否需要开启调式
    'blockScope':'enable',     //是否启用块级域
    'reserved':['let', 'of','System',"Context"],
    'minify':'off', //是否需要压缩
    'compat_version':'*',      //要兼容的平台 {'ie':8,'chrome':32.5}
    'build_path':'./build',
    'project_path':'./',
    'skin_file_suffix': '.html',
    'project_file_suffix':'.es',
    'browser':'enable',
    'baseSkinClass':'es.core.Skin',
    'config_file':'./configure.js',
    'bootstrap':'Index',
    'context':{
        "public":"_public",
        "protected":"_protected",
        "private":"_private",
        "internal":"_internal",
        "defineModuleMethod":"define",
        "package":"Context",
    },
    'mode': 1, //1 标准模式（开发时使用） 2 性能模式（生产环境使用）
};

var  requirements={};
var syntaxMap={
    'js':'javascript',
    'php':'php'
}
var globalConfig = defaultConfig;
var systemMainClassModules = [];

/**
 * 返回文件的路径
 * @param file
 * @param lib
 * @returns {*}
 */
function filepath(file, base )
{
    return PATH.resolve( base, file.replace(/\./g,'/') ).replace(/\\/g,'/');
}

function getModuleWeight( modules )
{
     var weight = {};
     for(var m in modules )
     {
         var _module =  modules[m];
         var proto = fetchAllParent( _module );
        fetchAllImplements( _module, proto );
         for( var i in proto )
         {
             fetchAllImplements(proto[i], proto);
         }

         for( var p in proto )
         {
             var _m = proto[p];
             if (_m.nonglobal === true) 
             {
                 weight[_m.fullclassname] = (parseInt(weight[_m.fullclassname]) || 0) + 1;
             }
         }
     }
     return weight;
}

function fetchAllParent( module , results )
{
    results = results || [];
    if( !module.inherit )return results;
    do {
        var classname = module.inherit;
        if( module.nonglobal===true && module.import[ classname ] )
        {
            classname = module.import[ classname ]
        }
        module = Maker.getLoaclAndGlobalModuleDescription( classname );
        if( results.indexOf(module)<0 )
        {
            results.push(module);
        }
    }while( module.inherit );
    return results;
}


function fetchAllImplements( module, results )
{
    results = results || [];
    if ( module.nonglobal !== true )
    {
        return results;
    }

    for(var i in module.implements )
    {
        var classname = module.implements[i];
        if ( module.nonglobal === true && module.import[classname] )
        {
            classname = module.import[classname];
        }
        module = Maker.getLoaclAndGlobalModuleDescription(classname);
        if( results.indexOf(module) < 0 )
        {
            results.push(module);
        }
        fetchAllParent( module, results );
    }
    return results;
}


/**
 * 获取所以依赖的皮肤模块
 * @param module
 * @returns {Array}
 */
function getRequirementsAllSkinModules( modules )
{
    return modules.filter(function (e) {
        var m = Maker.getLoaclAndGlobalModuleDescription(e.fullclassname||e.type);
        return m.nonglobal===true && m.ownerFragmentModule && m.ownerFragmentModule.isSkin;
    });
}

function getRequirementsAllUsedModules( module , results, syntax, hash )
{
    results = results || [];
    hash    = hash || {};
    var name = module.fullclassname || module.type;
    if ( hash[name] === true )
    {
        return [];
    }
    hash[name] = true;
    if( module.nonglobal===true )
    {
        var isNs = module.id==="namespace";
        var hasUsed = isNs ? module.namespaces[ module.classname ].hasUsed || module.hasUsed : module.hasUsed;
        if( hasUsed && results.indexOf(module)<0 )
        {
           results.push(module);
        }
        if( module.useExternalClassModules )
        {
            var datalist = module.useExternalClassModules;
            var i = 0;
            var len = datalist.length;
            for (; i < len; i++)
            {
                var classname = datalist[i];
                var classmodule = Maker.getLoaclAndGlobalModuleDescription( classname );
                if( classmodule ) {
                    getRequirementsAllUsedModules(classmodule, results, syntax, hash);
                }
            }
        }

    }else if( results.indexOf(module)<0  )
    {
        results.push( module );
    }
    return results;
}

function getRequirementsAllGlobalClass( modules )
{
    modules = modules.filter(function (e) {
         var m = Maker.getLoaclAndGlobalModuleDescription(e.fullclassname||e.type);
         return m && !m.nonglobal;
    });
    return modules.map(function (e) {
        return e.type;
    });
}

function getModuleScriptContent( modules )
{
    modules = modules.filter(function (e) {
        return e.nonglobal ===true && e.makeContent;
    });
    var weightMap = getModuleWeight( modules );
    modules = modules.sort(function (a,b) {
        var a1 = weightMap[ a.fullclassname ] || 0;
        var b1 = weightMap[ b.fullclassname ] || 0;
        if( a1==b1 )return 0;
        return b1 < a1 ? -1 : 1;
     });
    modules = systemMainClassModules.concat( modules );
    return modules.map(function (e) {
         return e.makeContent['javascript'];
    });
}

function getSkinModuleStyles( modules )
{
    return modules.filter(function(e){
        return e.ownerFragmentModule ? !!e.ownerFragmentModule.styleContent : false;
    });
}

function outputFiles( bulid_path, fileSuffix, classModules ,callback , syntax )
{
    for (var m in classModules)
    {
        var localModule = classModules[m];
        var isUsed = localModule.hasUsed;
        var content = localModule.makeContent ? localModule.makeContent[ syntax ] : '';
        if( callback )
        {
            content = callback( localModule );
        }
        if ( isUsed === true && content )
        {
            var file = Utils.getResolvePath( bulid_path , localModule.fullclassname );
            Utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
            Utils.setContents(file + fileSuffix, content);
        }
    }
}


function doCompileFragmentScript( classItems , requirements , syntax , config )
{
    Utils.forEach( classItems , function ( classname )
    {
        if( requirements.indexOf( classname ) < 0 )
        {
            requirements.push( classname );
            var module = Maker.getLoaclAndGlobalModuleDescription( classname );
            if (module.nonglobal === true)
            {
                var stack = Maker.makeModuleByName( classname );
                Compile(syntax, stack, stack.description, config);
                if( stack.description.useExternalClassModules && stack.description.useExternalClassModules.length > 0 )
                {
                    doCompileFragmentScript( stack.description.useExternalClassModules, requirements ,  syntax , config);
                }
            }
        }
    });
}

function compileFragmentScript(script, fullclassname, syntax, config, requirements )
{
    var fragment = {};
    fragment.fullclassname = fullclassname;
    fragment.script = script;
    var stack = Maker.loadFragmentModuleDescription(syntax, fragment, config, true);
    Compile(syntax, stack, stack.description, config);
    if( stack.description.useExternalClassModules && stack.description.useExternalClassModules.length > 0 )
    {
        doCompileFragmentScript( stack.description.useExternalClassModules , requirements , syntax, config);
    }
    return stack.description.rootContent[syntax].join("");
}

function createServerView(rootpath, module, syntax, config )
{
    var requirements=[];
    var file = Utils.getResolvePath( rootpath, module.fullclassname.replace(/\./g,"/") );
    Utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
    var suffix = syntax ==="php" ? ".php" : ".html";
    var callback =  module.ownerFragmentModule.viewMaker || module.ownerFragmentModule.skinMaker;
    Utils.setContents( (file + suffix).toLowerCase(), callback(function (script)
    {
        return compileFragmentScript(script,  module.ownerFragmentModule.fullclassname+syntax, syntax, config, requirements );
    }));
    return requirements;
}

function mergeModules(targetModules, newModules )
{
    for (var r in newModules)
    {
        var m = Maker.getLoaclAndGlobalModuleDescription( newModules[r] );
        if( targetModules.indexOf(m) < 0 )
        {
            targetModules.push( m );
        }
    }
}

function importCss( name , project_path, less_path )
{
    var file = name;
    //如果不是指定的绝对路径
    if( !PATH.isAbsolute( name ) )
    {
        file = PATH.resolve( project_path, name );
    }
    //如果文件不存在,则指向到默认目录
    if( !Utils.isFileExists( file ) )
    {
        file = PATH.resolve(less_path, name);
        if( !Utils.isFileExists( file ) )
        {
            throw new Error( "'"+file +"' is not exists." );
        }
    }
    return Utils.getContents( file );
}

function importCssPath( name , project_path, less_path )
{
    var file = name;
    //如果不是指定的绝对路径
    if( !PATH.isAbsolute( name ) )
    {
        file = PATH.resolve( project_path, name );
    }
    //如果文件不存在,则指向到默认目录
    if( !Utils.isFileExists( file ) )
    {
        file = PATH.resolve(less_path, name);
        if( !Utils.isFileExists( file ) )
        {
            throw new Error( "'"+file +"' is not exists." );
        }
    }
    return file;
}

//所有动画库
const animate_name_all = [
"bounce","flash","pulse","rubberBand","shake","headShake","swing","tada","wobble","jello","bounceIn","bounceInDown","bounceInLeft",
"bounceInRight","bounceInUp","bounceOut","bounceOutDown","bounceOutLeft","bounceOutRight","bounceOutUp","fadeIn","fadeInDown","fadeInDownBig",
"fadeInLeft","fadeInLeftBig","fadeInRight","fadeInRightBig","fadeInUp","fadeInUpBig","fadeOut","fadeOutDown","fadeOutDownBig","fadeOutLeft",
"fadeOutLeftBig","fadeOutRight","fadeOutRightBig","fadeOutUp","fadeOutUpBig","flipInX","flipInY","flipOutX","flipOutY","lightSpeedIn","lightSpeedOut",
"rotateIn","rotateInDownLeft","rotateInDownRight","rotateInUpLeft","rotateInUpRight","rotateOut","rotateOutDownLeft","rotateOutDownRight","rotateOutUpLeft",
"rotateOutUpRight","hinge","jackInTheBox","rollIn","rollOut","zoomIn","zoomInDown","zoomInLeft","zoomInRight","zoomInUp","zoomOut","zoomOutDown","zoomOutLeft",
"zoomOutRight","zoomOutUp","slideInDown","slideInLeft","slideInRight","slideInUp","slideOutDown","slideOutLeft","slideOutRight","slideOutUp"
];



//目前支持的语法
const syntax_supported={
    'php':true,
    'javascript':true
};

//构建器
const builder={

    'javascript':function(config, descriptions, client )
    {
        Utils.info("building javascript start...");

        var less = require('less');
        var themes = require('./style/themes.js');
        var lessPath = PATH.resolve(config.root_path, './style/');
        var options = {
            paths: [lessPath],
            globalVars: themes[config.themes] || themes.default,
            compress: config.minify === 'enable',
        };
        var len = descriptions.length;
        var index = 0;
        var view_path = Utils.getBuildPath(config, 'build.html');

        for( ;index<len;index++ )
        {
            var bootstrap = descriptions[ index ];
            var usedModules = [];
            var outputname = bootstrap.fullclassname.toLowerCase();
            var hashMap = Compile("javascript", Maker.makeModuleByName( bootstrap.fullclassname ) , bootstrap, config);
            var usedModules = getRequirementsAllUsedModules( bootstrap, usedModules, "javascript" );

            if( !client )
            {
                usedModules.filter(function (e)
                {
                    var o = e.ownerFragmentModule || e;
                    if( o.isMakeView===true )
                    {
                        mergeModules(usedModules, createServerView(  view_path , e, ".html", config ) );
                    }
                    return e.nonglobal === true;
                });
            }


            var skinModules = getRequirementsAllSkinModules( usedModules );
            var _styleContent = getSkinModuleStyles( skinModules );
            var _scriptContent =  getModuleScriptContent( usedModules );
            var requirements = getRequirementsAllGlobalClass( usedModules );

            if( config.source_file ==="enable" )
            {
                outputFiles(  Utils.getBuildPath(config, 'build.js')+"/src", ".js",  usedModules , null, "javascript");
            }

            var builder = require( './javascript/builder.js');
            _scriptContent = builder(bootstrap.fullclassname, config, _scriptContent.join(""), requirements, {namespace:function(content) {
                return content.replace(/var\s+codeMap=\{\};/,"var codeMap="+JSON.stringify(hashMap)+";");
            }});

            var style = [];
            var importStyle = ["main.less"];
            const loadedStyle= {};

            //需要处理样式表
            if (_styleContent.length > 0)
            {
                //获取样式内容
                style = _styleContent.map(function (e, i)
                {
                    var ownerModule = Maker.descriptionByName(e.fullclassname);
                    if (ownerModule.hasUsed !== true)return '';
                    e = e.ownerFragmentModule.styleContent;

                    //加载需要嵌入的文件
                    e = e.replace(/@Embed\(.*?\)/g, function (a, b) {
                        var metatype = Utils.executeMetaType(a.substr(1));
                        var dest = Utils.parseMetaEmbed(metatype, config);
                        return '"./' + PATH.relative(Utils.getBuildPath(config, 'build.css'), dest).replace(/\\/g, '/') + '"';
                    });

                    //导入样式或者less
                    e = e.replace(/\B@import\s+([\'\"])(.*?)\1[;\B]?/gi, function (a,b,c)
                    {
                        c = Utils.trim(c);

                        //获取样式的绝对路径
                        var file = importCssPath( c , config.project_path, lessPath );

                        //如果没有加载过指定的文件
                        if( loadedStyle[file] !== true )
                        {
                            loadedStyle[file] = true;
                            if (c.slice(-4) === ".css")
                            {
                                return Utils.getContents( file );
                            } else {
                                importStyle.push(c);
                            }
                        }
                        return '';
                    });

                    //把样式变量转换成唯一的
                    e.replace(/\B@(\w+)\s*:/gi, function (a, b, c) {
                        e = e.replace(new RegExp('@' + b, "gi"), function (a) {
                            return '@' + b + i;
                        });
                    });
                    return e;
                });
            }

            //需要加载字体样式
            if (config.font)
            {
                importStyle.push('./less/glyphicons.less');
            }

            //需要加载的动画样式
            var animatefiles = ["fadeIn.css","fadeOut.css"];
            var animatepath = PATH.resolve(lessPath, "animate");

            //需要加载所有的动画样式
            if (config.animate)
            {
                animatefiles = Utils.getDirectoryFiles( animatepath );
            }

            //加载动画样式
            animatefiles.forEach(function (a) {
                a = PATH.resolve(animatepath, a);
                if( loadedStyle[a] !== true )
                {
                    loadedStyle[a] = true;
                    style.unshift( Utils.getContents( a ) );
                }
            });

            //合并导入的样式
            style.unshift( "\n@import '"+ importStyle.join("';\n@import '") +"';\n" );

            //使用less处理样式文件
            (function (style, options, outputname, config) {
                less.render(style.join("\n"), options, function (err, output) {
                    if (err) {
                        Utils.error(err.message);
                        Utils.error(err.extract.join('\n'));
                    } else {
                        var filename = filename = PATH.resolve(Utils.getBuildPath(config, 'build.css'), outputname + '.css');
                        fs.writeFileSync(filename, output.css);
                    }
                });
            })(style, options, outputname, config);

            var fontPath = Utils.getBuildPath(config, 'build.font');
            var fontfiles = Utils.getDirectoryFiles(lessPath + '/fonts');
            for (var i = 0; i < fontfiles.length; i++) {
                var source = fs.createReadStream(lessPath + '/fonts/' + fontfiles[i]);
                var tocopy = fs.createWriteStream(fontPath + "/" + fontfiles[i]);
                source.pipe(tocopy);
            }

            if (_scriptContent && config.minify === 'enable')
            {
                var script = uglify.minify(_scriptContent, {ie8: true});
                if (script.error)throw script.error;
                _scriptContent = script.code;
            }

            var filename = PATH.resolve(Utils.getBuildPath(config, 'build.js'), outputname + '.js');
            Utils.mkdir(PATH.dirname(filename));
            fs.writeFileSync(filename, _scriptContent );

        }
    },

    'php':function(config, descriptions )
    {
        Utils.info("building php start...");

        var usedModules = systemMainClassModules.slice(0);
        var hash = {};
        var view_path = Utils.getBuildPath(config, 'build.view');
        var app_path = Utils.getBuildPath(config, 'build.application');
        var hashMap=[];

        //编译普通模块
        Utils.forEach(descriptions, function (module)
        {
            hashMap = Compile("php", Maker.makeModuleByName(module.fullclassname), module, config);
            getRequirementsAllUsedModules( module, usedModules , "php", hash );
        });

        //需要生成的本地模块
        usedModules.filter(function (e)
        {
             var o = e.ownerFragmentModule || e;
             if( o.isMakeView===true /*|| o.isSkin === true*/ )
             {
                // var require = createServerView( o.isMakeView ? view_path : app_path , e, "php", config );
                // mergeModules(usedModules, require);
             }
             return e.nonglobal === true;
        });

        usedModules.filter(function (e)
        {
            var o = e.ownerFragmentModule || e;
            if( o.skinMaker && o.isMakeView ===true && o.isSkin === true )
            {
                var callback = o.skinMaker;
                var require = [];
                var content = callback(function (script) {
                    return compileFragmentScript(script,  o.fullclassname+"php", "php", config, require );
                });
                mergeModules(usedModules, require);
                var file = Utils.getResolvePath( app_path , o.fullclassname );
                Utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
                Utils.setContents(file+".php", content);
            }
            return e.nonglobal === true;
        });

        var localModules = usedModules.filter(function (e)
        {
            return e.nonglobal === true;
        });

        //输出模块文件
        outputFiles( app_path, ".php", localModules , function (module) {

            var o = module.ownerFragmentModule || module;
            if( o.isMakeView ===true ){
               // return "";
            }

            if( Maker.checkInstanceOf(module,"es.core.View") )
            {
                var code=["<?php\n"]
                if( module.package ){
                    code.push( "namespace "+module.package.replace(/\./g,'\\') +";\n" );
                }
                code.push( "use es\\core\\Application;\n" );
                var rootpath =  PATH.relative( app_path, view_path ).replace(/\\/,'/');
                var filepath =  rootpath+'/'+module.fullclassname.replace(/\./g,'/');
                code.push( "class "+module.classname+"\n{\n" );
                code.push( "\tprivate $_context;\n" );
                code.push( "\tpublic function __construct(Application $context)\n\t{\n" );
                code.push( "\t\t$this->_context = $context;\n" );
                code.push( "\t}\n" );
                code.push( "\tpublic function display()\n\t{\n" );
                code.push( "\t\tob_start();\n" );
                code.push( "\t\t$assignments = (array)$this->_context->getAssignments();\n" );
                code.push( "\t\textract( $assignments , EXTR_IF_EXISTS );\n" );
                code.push( "\t\tinclude '"+filepath+".php';\n" );
                code.push( "\t\t$content = ob_get_contents();\n" );
                code.push( "\t\tob_end_clean();\n" );
                code.push( "\t\techo $content;\n" );
                code.push( "\t}\n}" );
                //return code.join("");
            }
            return module.makeContent['php'];
        });

        var phpBuilder = require( './php/builder.js');
        var requirements = usedModules.filter(function (a) {
             return !(a.nonglobal === true);
        });
        requirements= requirements.map(function (a) {
              return a.type;
        });
        phpBuilder( config.build_path, config, [], requirements, hashMap);
        builder.javascript(config, descriptions, true);
    }
};

function getViewDisplay()
{
    var code = [];
    code.push( "\tpublic function display($filename)\n\t{\n" );
    code.push( "\t\tob_start();\n" );
    code.push( "\t\t$assignments = (array)$this->getAssignments();\n" );
    code.push( "\t\textract( $assignments , EXTR_IF_EXISTS );\n" );
    code.push( "\t\tinclude $filename.'.php';\n" );
    code.push( "\t\t$content = ob_get_contents();\n" );
    code.push( "\t\tob_end_clean();\n" );
    code.push( "\t\techo $content;\n" );
    code.push( "\t}" );
    return code.join("");
}


/**
 * 构建工程结构
 * @param dir
 * @param base
 */
function buildProject(dir, base)
{
    var dirpath = base;
    if( dir.__build !== true )
    {
        var dirpath = PATH.isAbsolute(dir.path) ? PATH.resolve(dir.path, dir.name) : PATH.resolve(base, dir.path, dir.name);
        if (!fs.existsSync(dirpath)) {
            dirpath = Utils.mkdir(dirpath);
            if (typeof dir.bootstrap === "string" && dir.syntax) {
                //引用一个模板
                var file = PATH.resolve(config.root_path, dir.syntax, dir.bootstrap + dir.suffix);
                if (Utils.isFileExists(file)) {
                    fs.linkSync(file, PATH.resolve(dirpath, dir.bootstrap + dir.suffix));
                }
            }
        }
        dir.path = dirpath.replace(/\\/g, '/');
        dir.name = PATH.basename(dirpath);
        dir.__build = true;
    }

    if (dir.child)
    {
        for (var i in dir.child)
        {
            if( dir.child[i].path.charAt(0) === "@" )
            {
                var refName = dir.child[i].path.substr(1);
                if( !dir.child.hasOwnProperty( refName ) ){
                    throw new ReferenceError("Invalid reference path name for '"+refName+"'");
                }
                buildProject(dir.child[ refName ], dirpath);
                dir.child[i].path = dir.child[ refName ].path;
            }
            buildProject(dir.child[i], dirpath);
        }
    }
}

function configToJson( config , depth )
{
    var tab = new Array( depth );
    tab = tab.join("\t");
    var type = config instanceof Array ? 'array' : typeof config;
    if( type ==="string" )return tab+config;
    var item = [];
    for( var p in config )
    {
        if( config[p]+""=="[object Object]" || config[p] instanceof Array )
        {
            item.push( tab+'"'+p+'":'+configToJson( config[p] , depth+1 ) );

        }else
        {
            var val = typeof config[p] === "string" ? config[p].replace(/\\/g, '/') : config[p];
            if (type === 'array') {
                item.push('"' + val + '"');
            } else {
                item.push(tab + '"' + p + '":"'+val + '"');
            }
        }
    }

    tab = new Array( depth-1 );
    tab = tab.join("\t");
    if( type ==='array' )
    {
        return '['+item.join(",")+']';
    }
    return '{\n'+item.join(",\n")+'\n'+tab+'}';
}

/**
 * 获取配置信息
 * @param config
 * @returns {*}
 */
function getConfigure(config)
{
    root_path = config.root_path || process.cwd();
    //生产环境模式启用压缩文件
    if( config.mode===3 && config.minify == null )
    {
        config.minify = 'enable';
    }

    config.debug = config.debug==='enable' ? 'on' : 'off';

    //工程目录
    var project_path = PATH.resolve( config.project_path );
    if( !fs.existsSync(project_path) )
    {
        fs.mkdirSync( project_path );
    }

    //默认配置文件
    var makefile = PATH.resolve(project_path,'project.conf');
    if( !Utils.isFileExists( makefile ) || config.clean===true )
    {
        //程序的路径
        config.root_path = root_path;

        //合并默认配置文件
        Utils.merge(config, require( config.config_file ) );

        //当前工程项目路径
        config.project_path = project_path;
        config.project.path = project_path;
        config.project.name = PATH.basename(project_path);

        //构建项目路径
        if( config.has_output_path )
        {
            config.build_path = PATH.resolve(config.build_path);
            config.build.path = config.build_path;
            config.build.name = '';
        }

        //构建输出目录
        buildProject(config.build, config.project_path );
        config.build_path = config.build.path;

        //构建工程目录
        //buildProject(config.project, config.project_path);

        //生成一个默认的配置文件
        Utils.setContents(makefile, configToJson( config , 1 ) );

    }else
    {
        config = JSON.parse( Utils.getContents(makefile) );
    }

    /*  var bootstrap_file = PATH.resolve( config.project.path , config.bootstrap.replace(/\./g,"/")+config.suffix );
     Utils.mkdir( PATH.dirname( bootstrap_file ) );
     if( !Utils.isFileExists(bootstrap_file) )
     {
     var defaultFile = [
     'package\n{\n',
     '\tpublic class '+config.bootstrap,
     ' extends EventDispatcher\n\t{\n',
     '\t\tpublic function '+config.bootstrap,
     '()\n',
     '\t\t{\n',
     '\t\t\tsuper(document);\n',
     '\t\t\t\tvar body = new Element("body");\n',
     '\t\t\t\tbody.addChild( Element.createElement("<h1>Hello world!</h1>") );\n',
     '\t\t}\n',
     '\t}\n',
     '}',
     ];
     Utils.setContents(bootstrap_file, defaultFile.join("") );
     }*/

    //将上下文中引用的变量设为受保护的关键字
    for (var c in config.context )
    {
        if( c !=='defineModuleMethod' && config.reserved.indexOf( config.context[c] )<0 )
        {
            config.reserved.push( config.context[c] );
        }
    }
    if( config.reserved.indexOf('System')<0 )config.reserved.push('System');
    if( config.reserved.indexOf('Context')<0 )config.reserved.push('Context');
    if( config.reserved.indexOf('Reflect')<0 )config.reserved.push('Reflect');

    //系统类库路径名
    //在加载类文件时发现是此路径名打头的都转到系统库路径中查找文件。
    config.system_lib_path_name = 'es';
    config.system_lib_path = config.root_path;
    config.system_core_class={
        "iteratorClass":"es.interfaces.IListIterator",
    };

    var system_main_class = [];
    for( var scc in config.system_core_class ){
        system_main_class.push( config.system_core_class[scc] );
    }
    config.system_require_main_class = system_main_class;
    return config;
}

/**
 * 开始生成代码片段
 */
function make( config, isGlobalConfig )
{
    try
    {
        config = getConfigure( Utils.merge(globalConfig, config || {}) );
        if( isGlobalConfig===true )
        {
            globalConfig  = config;
        }

        requirements = config.requirements || (config.requirements = {});
        config.syntax = syntaxMap[ config.syntax ] || 'javascript';

        //浏览器中的全局模块
        if( config.browser === 'enable' )
        {
            var browser = require('./lib/browser.js');
            Utils.merge(globals,browser);
        }
        config.globals=globals;

        if( config.library )
        {
            Utils.forEach(config.library, function (name)
            {
                config.globals[ name ] = {
                    "id":"class",
                    "type":name,
                    "notCheckType":true,
                    "notLoadFile":true
                }
            });
        }

        var project_path = config.project_path;
        var makedir = project_path;
        var makefiles = [];
        var file = PATH.resolve( project_path ,  config.bootstrap || "./" ).replace(/\\/g,'/');

        if( syntax_supported[ config.syntax ] !== true )
        {
            Utils.error("Syntax "+config.syntax +" is not supported.");
        }

        //如果定要编译的目录下的文件
        if( !Utils.isFileExists( file+config.suffix ) )
        {
            if( Utils.isDir( file ) )
            {
                makedir = file;
                makefiles = Utils.getDirectoryFiles( file );
                makefiles = makefiles.filter(function (a) {
                    return PATH.extname(a) === config.suffix;
                });
            }
        }
        //指定的编译文件
        else
        {
            makefiles = [ file ];
        }

        var i = 0;
        var len = makefiles.length;
        var descriptions=[];
        var inheritClass=[];
        for(;i<len;i++)
        {
            var classfile =PATH.basename( makefiles[i] , config.suffix );
            var _filepath = filepath(classfile, makedir );
            var classname = PATH.relative(project_path, _filepath ).replace(/\\/g,'/');
            if( inheritClass.indexOf(classname) < 0 )
            {
                var desc = Maker.loadModuleDescription(config.syntax, classname, config, _filepath);
                descriptions.push(desc);
                if (desc.inherit)
                {
                    inheritClass.push(desc.import.hasOwnProperty(desc.inherit) ? desc.import[desc.inherit] : desc.inherit);
                }
            }
        }

        //继承的类不属于入口文件
        descriptions = descriptions.filter(function (a) {
            return inheritClass.indexOf( a.fullclassname ) < 0;
        })

        //开始构建
        Utils.info('Making starting ...');
        builder[ config.syntax ]( config , descriptions );
        Utils.info('Making done ...');
        Utils.info('\r\nCompleted !!!');
        Utils.info('Make path : '+config.build_path );

    }catch (e)
    {
        Utils.error(e.message);
        if( config.debug=='on')console.log( e );
    }
}

module.exports = make;