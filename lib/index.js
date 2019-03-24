const fs = require('fs');
const PATH = require('path');
const Utils = require('./utils.js');
const uglify = require('uglify-js');
const Maker = require('./maker.js');
const MakeSkin = require('./skin.js');
const Compile = Maker.Compile;
//需要保护的关键字
const reserved=['let', 'of','System',"Context"];
//编译器的上下文对象
const compileContext={
    "public":"_public",
    "protected":"_protected",
    "private":"_private",
    "internal":"_internal",
    "defineModuleMethod":"define",
    "package":"Context",
};

var globals = Maker.globalDescriptions;

//全局配置
const defaultConfig = {
    //需要编译文件的后缀
    'suffix': '.es', 
    //是否需要开启调式
    'debug':'enable', 
    //是否启用块级域
    'blockScope':'disabled',
    //指定编译器需要保护的关键字
    'reserved':[],
    //是否需要压缩
    'minify':'enable',
    //是否需要打包动画库
    'animate':true,
    //是否需要打包字体库
    'font':true,
    //指定主题文件名
    'theme':null,
    //需要使用的主题文件路径
    'theme_file_path':null,
    //是否需要输出编译后的原文件
    'source_file':"enable",
    //需要兼容浏览器的版本
    'compat_version':{ie:9},//要兼容的平台 {'ie':8,'chrome':32.5}
    //默认构建后输入的目录名
    'build_path':'./build',
    //默认的工程目录名
    'project_path':'./project',
    //工作根目录
    'workspace':'./src',
    //皮肤文件的后缀名
    'skin_file_suffix':'.html',
    //皮肤样式配置文件, 为每一个组件指定默认的皮肤类. 格式为 {"component.classname":"skin.path"}
    'skin_style_config':null,
    //工程文件的后缀，编译器只会编译指定这个后缀的文件
    'project_file_suffix':'.es',
    //是否支持浏览器
    'browser':'enable',
    //指定皮肤基类
    'baseSkinClass':'es.core.Skin',
    //指定一个生成构建代码目录的配置
    'config_file':null,
    //指定需要编译的文件名（文件目录），多个传递数组
    'bootstrap':null,
    //指定默认加载的应用页面，通常为 类的全名称比如：test.Index 默认为 index 应用名（如果存在）， 否则为第一个应用类
    'default_bootstrap_class':null,
    //需要引用外部库的名称 , [jQuery,...]
    'library':null,
    //是否启用严格类型， true 在每个声明的后面必须指定类型， false 可以不指定
    'strictType':true,
    //服务提供者的运行语法
    'service_provider_syntax':"php",
    //在静态文件后面指定path 来切换页面的参数名称
    'static_url_path_name':"PATH",
    //是否在构建目录的 webroot 里面运行
    'enable_webroot':false,
    //针对编译器的切换指令
    'command_switch':0,
     //是否把每个应用页分开加载
    'script_part_load':true,
     //系统库路径名
    'system_lib_path_name':'es',
     //系统库路径
    'system_lib_path':PATH.join(__dirname,"../"),
    //系统样式路径名
    'system_style_name':'style',
    //系统样式路径
    'system_style_path':PATH.join(__dirname,"../"),
    //主库目录名
    'build_libaray_name':"es",
     //生成系统类目录
    'build_system_path':"es.system",
    //需要重新生成工程的配置文件
    'clean':false,
    //1 标准模式（开发时使用） 2 性能模式（生产环境使用）
    'mode': 1, 
    //是否只构建application应用入口的文件
    'build_mode':"app",
};

//构建目录配置
const buildConfig = {
    "build": {
        "path": "",
        "name": "",
        "child": {
            "js": {
                "path": "@webroot",
                "name": "js",
            },
            "img": {
                "path": "@webroot",
                "name": "img",
            },
            "css": {
                "path": "@webroot",
                "name": "css",
            },
            "font": {
                "path": "@webroot",
                "name": "fonts",
            },
            "view": {
                "path": "@application",
                "name": "view",
            },
            "html":{
                "path":"@webroot",
                "name":"html",
            },
            "webroot":{
                "path":"./",
                "name":"webroot",
            },
            "bootstrap":{
                "path":"@application",
                "name":"bootstrap",
            },
            "application":{
                "path":"./",
                "name":"easescript",
            }
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
        "child": {
            "src": {
                "path": "./",
                "name": "src",
            },
            "image":{
                "path": "@src",
                "name": "image",
            },
            "style":{
                "path": "@src",
                "name": "style",
            },
            "theme":{
                "path": "@src",
                "name": "theme",
            },
            "app":{
                "path": "@src",
                "name": "app",
            },
            "view":{
                "path": "@src",
                "name": "view",
            },
            "component":{
                "path": "@src",
                "name": "component",
            },
            "skin":{
                "path": "@src",
                "name": "skin",
            },
        },
    },
};


const package={
    "name": "test",
    "version": "0.0.0",
    "description": "test",
    "devDependencies":{
      "uglify-js": "^3.1.1",
      "commander": "^2.11.0",
      "less": "^2.7.2",
      "colors": "^1.1.2",
      "libxmljs": "~0.18.6"
    }
}

var requirements={};
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
    var old = module;
    module.inherit.split(",").forEach(function(classname)
    {
        if( module.nonglobal===true && module.import[ classname ] )
        {
            classname = module.import[ classname ];
        }
        var m = Maker.getLoaclAndGlobalModuleDescription( classname );
        if( results.indexOf(m)<0 )
        {
            results.push(m);
        }
        fetchAllParent( m , results ); 
    });
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
        var m = Maker.getLoaclAndGlobalModuleDescription(classname);
        if( results.indexOf(m) < 0 )
        {
            results.push(m);
        }
        fetchAllParent( m, results );
    }
    return results;
}

/**
 * 获取不同策略的模块
 * @param modules
 * @param mode  global core local
 * @return array
 */
const MODULE_POLICY_GLOBAL = 1;
const MODULE_POLICY_CORE = 2;
const MODULE_POLICY_LOCAL = 4;
const MODULE_POLICY_ALL = 7;
function getModulesWithPolicy( modules, mode )
{
    if( (mode & MODULE_POLICY_ALL) === MODULE_POLICY_ALL )
    {
        return modules;
    }
    return modules.filter(function (e)
    {
        for(var i = 0, n = 0; i <= mode; n++)
        {
            i = 1 * Math.pow(2, n);
            var v = i & mode;
            if ( v === MODULE_POLICY_GLOBAL && e.nonglobal !== true) {
                return true
            } else if ( v === MODULE_POLICY_CORE && e.nonglobal === true && e.fullclassname.indexOf("es.") === 0) {
                return true
            } else if ( v === MODULE_POLICY_LOCAL && e.nonglobal === true && e.fullclassname.indexOf("es.") !== 0) {
                return true
            }
        }
    });
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

/**
 * 获取所有引用的模块
 * @param module
 * @param results
 * @param syntax
 * @param hash
 * @returns {*}
 */
function getRequirementsAllModules( module , results, hash )
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
        var hasUsed = Compile.hasUsedModuleOf( module );
        if( isNs && !hasUsed ){
            hasUsed = Compile.hasUsedModuleOf( module.namespaces[ module.classname ] );
        }

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
                    getRequirementsAllModules(classmodule, results,  hash);
                }
            }
        }

    }else if( results.indexOf(module)<0  )
    {
        results.push( module );
    }
    return results;
}

/**
 * 获取所有使用的模块,根据当前的语法来区分
 * @param modules
 * @param syntax
 */
function getRequirementsAllUsedModules( modules,syntax )
{
    return modules.filter(function (module) {
        if( module.nonglobal===true )
        {
            var isNs = module.id === "namespace";
            var hasUsed = Compile.hasUsedModuleOf(module, syntax);
            if (isNs && !hasUsed)
            {
                hasUsed = Compile.hasUsedModuleOf(module.namespaces[module.classname], syntax);
            }
            return hasUsed && module["has_syntax_remove_" + syntax] !== true;
        }
        return Compile.hasUsedModuleOf(module);
    });
}

function getRequirementsAllGlobalClass( modules)
{
    modules = modules.filter(function (e) {
         var m = Maker.getLoaclAndGlobalModuleDescription(e.fullclassname||e.type);
         return m && !m.nonglobal;
    });
    return modules.map(function (e) {
        return e.type;
    });
}

function getModuleScriptContent( modules)
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
    return modules.map(function (e) {
         return e.makeContent['javascript'];
    });
}

function outputFiles( bulid_path, fileSuffix, classModules ,callback , syntax )
{
    for (var m in classModules)
    {
        var localModule = classModules[m];
        var isUsed =  Compile.hasUsedModuleOf( localModule , syntax );
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

function createServerView(rootpath, module, syntax, config , bootstrap )
{
    var requirements=[];
    var file = Utils.getResolvePath( rootpath, module.fullclassname.replace(/\./g,"/") );
    Utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
    var suffix = syntax ==="php" ? ".php" : ".html";
    var callback =  module.viewMaker || module.skinMaker;
    Utils.setContents( (file + suffix).toLowerCase(), callback(function (script)
    {
        return compileFragmentScript(script,  module.fullclassname+syntax, syntax, config, requirements );
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

function importCssPath( name , project_path, less_path )
{
    var file = name;
    //如果不是指定的绝对路径
    if( !PATH.isAbsolute( name ) )
    {
        file = PATH.resolve( project_path, name );
    }

    //如果文件不存在,则指向到默认目录
    if( less_path && !Utils.isFileExists( file ) )
    {
        file = PATH.resolve(less_path, name);
        if( !Utils.isFileExists( file ) )
        {
            throw new Error( "'"+file +"' is not exists." );
        }
    }
    return file;
}


function toHex(v)
{
    return '#' + v.map(function (c) {
            c = Math.round(c);
            return (c < 16 ? '0' : '') + c.toString(16);
    }).join('');
}

function superposition(baseColor, mixeColor)
{
    var Color = this.context.pluginManager.less.tree.Color;
    baseColor = baseColor.rgb;
    mixeColor = mixeColor.rgb;
    var r = Math.round( baseColor[0] <= 128 ? mixeColor[0] * baseColor[0] / 128 : 255 - (255-mixeColor[0]) * (255-baseColor[0]) / 128 ) ;
    var g = Math.round( baseColor[1] <= 128 ? mixeColor[1] * baseColor[1] / 128 : 255 - (255-mixeColor[1]) * (255-baseColor[1]) / 128  );
    var b = Math.round( baseColor[2] <= 128 ? mixeColor[2] * baseColor[2] / 128 : 255 - (255-mixeColor[2]) * (255-baseColor[2]) / 128  );
    var rgb = [r,g,b];
    console.log( rgb , mixeColor, baseColor );
    return new Color(rgb, 1 , toHex(rgb)  );
}

function themeColor(color , base , name)
{
    if( base )
    {
         return base;
    }
    return color;
}

/**
 * 查找指定主题名的样式对象
 * @param styleObject
 * @param name
 * @returns {*}
 */
function findThemeStyleByName(styleObject, name )
{
    return styleObject.filter(function (a) {
        var themeName = a.attr.theme || "default";
        return themeName === name;
    });
}

/**
 * 合并样式对象
 * @param styleObject
 * @param styleObjectAll
 * @returns {string}
 */
function combineThemeStyle( styleObject, styleObjectAll, importStyle, loadedStyle, included, config, lessPath )
{
    return styleObject.map(function (a) {
        var content = a.content;
        content = correction(a.file, content, importStyle, loadedStyle, included, config, lessPath);
        if( a.attr.combine )
        {
           var results = findThemeStyleByName( styleObjectAll, a.attr.combine ).map(function (a) {
               return combineThemeStyle( [a], styleObjectAll, importStyle, loadedStyle, included, config, lessPath );
           });
           return content +"\n"+ results.join("\n");
        }else{
            return content;
        }
    }).join("\n");
}

const itemRegExp = /@([\w\-]+)\s*:\s*([^;]+)\s*;/;

/**
 * 解析主题配置文件
 * @param content
 * @returns {{}}
 */
function parseConfigFile( content )
{
    var items = {};
    var result;
    while ( result = itemRegExp.exec(content) )
    {
        items[ result[1] ] = result[2];
        content = content.substr( result.index + result[2].length );
    }
    return items;
}

//主题基本配置文件
var theme_base_config = null;

/**
 * 合并主题配置文件
 * @param lesspath
 * @param file
 * @param config
 * @returns {*}
 */
function mergeThemeConfig( lesspath, theme_name, config )
{
    var base = theme_base_config;
    if( base===null )
    {
        base = PATH.resolve(lesspath, './less/variables.less');
        if( !Utils.isFileExists(base) )
        {
            throw new ReferenceError("Missing less theme file for '"+base+"'");
        }
        base = parseConfigFile( Utils.getContents( base ) );
        theme_base_config = base;
    }

    //如果有指定主题
    if( theme_name )
    {
         var file = config.theme_file_path;
         if( file && !PATH.isAbsolute(file) )
         {
             file = PATH.resolve(config.project_path, file);
         }

         if( Utils.isFileExists(file) )
         {
             var stat = fs.statSync( file );
             if( stat.isDirectory() )
             {
                 //以文件名来区分
                 file = PATH.resolve( file, theme_name+".less");
                 if( Utils.isFileExists(file)  )
                 {
                     base = Utils.merge(base, parseConfigFile( Utils.getContents( file ) ) );
                 }

             }else{

                 //以对象键名来区分
                 var object = parseConfigFile( Utils.getContents( file ) );
                 Utils.merge(base,  object[ theme_name ] || object );
             }

         }else
         {
             Utils.warn( " Not found theme file for '"+ file +"'" );
         }
     }
     return base;
}

/**
 * 修正内容路径
 * @param file
 * @param content
 * @param importStyle
 * @param loadedStyle
 * @param included
 * @param config
 * @param lessPath
 * @returns {*}
 */
function correction( file, content, importStyle, loadedStyle, included, config, lessPath )
{
    var e = content;
    var root = file ? PATH.dirname(file) : "";
    if( root ){
        root = root.replace(/\\/g, '/').replace(/\/$/,'')+"/";
    }

    //修正图片地址
    e = e.replace(/url\s*\(\s*[^@](.*?)\)/ig, function (a, b) {
        b = root+b.replace(/^["']|["']$/g,"");
        if( b.substr(0,5) === "http:" || b.substr(0,6) === "https:" )return a;
        var dest = Utils.copyfileToBuildDir( b, Utils.getBuildPath(config, 'build.img'), config );
        var url = '"./' + PATH.relative(Utils.getBuildPath(config, 'build.css'), dest).replace(/\\/g, '/') + '"';
        return "url("+url+")";
    });

    //加载需要嵌入的文件
    e = e.replace(/@Embed\(.*?\)/ig, function (a, b) {
        var metatype = Utils.executeMetaType(a.substr(1));
        var dest = Utils.parseMetaEmbed(metatype, config, root);
        return '"./' + PATH.relative(Utils.getBuildPath(config, 'build.css'), dest).replace(/\\/g, '/') + '"';
    });

    //导入样式或者less
    e = e.replace(/\B@import\s+([\'\"])(.*?)\1[;\B]?/gi, function (a,b,c)
    {
        c = root+ Utils.trim(c);

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
                importStyle.push( file );
            }
        }
        return '';
    });

    //合并样式
    e = e.replace(/\B@include\s+([\'\"])(.*?)\1[;\B]?/gi, function (a,b,c)
    {
        c = root+ Utils.trim(c);
        if( included[c] !==true  )
        {
            included[c] = true;
            //获取样式的绝对路径
            var file = importCssPath(c, config.project_path );
            return Utils.getContents( file );
        }
        return "";
    });
    return e;
}

/**
 * 获取指定皮肤模块的所有样式内容
 * @param skinModules
 * @param importStyle
 * @param loadedStyle
 * @param lessPath
 * @param config
 * @returns {*|{type, id, param}|{}|Array}
 */
function getAllStyleContent(skinModules, importStyle, loadedStyle, lessPath, config)
{
    var style = skinModules.map(function (m, i)
    {
        var ownerModule = Maker.descriptionByName(m.fullclassname);
        if( !Compile.hasUsedModuleOf( ownerModule ) )return '';

        //已经加载的样式
        var included = {};
        var e = "";

        //是否有指定样式文件
        if( config.skin_style_config && config.skin_style_config.hasOwnProperty(m.fullclassname) )
        {
            var stylefile = config.skin_style_config[ m.fullclassname ];
            if( !PATH.isAbsolute(stylefile) )
            {
                stylefile = PATH.resolve( config.project_path, stylefile );
            }
            e = Utils.getContents(stylefile);
            e = correction( stylefile, e, importStyle, loadedStyle, included, config, lessPath);
        }
        //模块中的样式内容
        else
        {
            var styleObjectAll = m.ownerFragmentModule.moduleContext.style;
            var defaultTheme = findThemeStyleByName(styleObjectAll, config.theme );
            if( defaultTheme.length === 0  ){
                defaultTheme = findThemeStyleByName(styleObjectAll, "default" );
            }
            e = combineThemeStyle( defaultTheme , styleObjectAll , importStyle, loadedStyle, included, config, lessPath );
        }
        if( !e )return "";
        //设置每一个样式表的作用域
        var scope = "#"+ownerModule.fullclassname.replace(/\./g,"_");
        return [scope,"(){\n",e,"\n}\n",scope,";\n"].join("");
    });
    return style;
}

//处理样式
const less = require('less');

/**
 * 构建样式
 * @param skinModules
 * @param lessPath
 * @param config
 */
function buildStyle(skinModules, lessPath, options, outputname, config, callback )
{
    //需要处理样内容
    var importStyle = ["main.less"];
    var loadedStyle = {};
    var style = getAllStyleContent(skinModules, importStyle, loadedStyle,lessPath, config)

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

    if( !font_builded )
    {
        font_builded = true;
        var fontPath = Utils.getBuildPath(config, 'build.font');
        var fontfiles = Utils.getDirectoryFiles(lessPath + '/fonts');
        for (var i = 0; i < fontfiles.length; i++)
        {
            Utils.copyfile(lessPath + '/fonts/' + fontfiles[i], fontPath + "/" + fontfiles[i])
        }
    }

    //使用less处理样式文件
    less.render(style.join("\n"), options, callback);
}
var font_builded = false;

/**
 * 获取指定文件相对于webroot的目录
 * @param config
 * @param file
 * @return {string}
 */
function getLoadFileRelativePath(config, file, type)
{
    var root = Utils.getBuildPath(config,"build.webroot");
    var prefix = config.originMakeSyntax !=="javascript" || config.enable_webroot ? "/" : "";
    if( !config.enable_webroot && config.originMakeSyntax !=="javascript" )
    {
        root = Utils.getBuildPath(config,"build");
    }
    return prefix+PATH.relative( root, file ).replace(/\\/g,"/");
}
MakeSkin.getLoadFileRelativePath = getLoadFileRelativePath;

//目前支持的语法
const syntax_supported={
    'php':true,
    'javascript':true
};

//语法构建器
const SyntaxBuilder={

    'javascript':function(config, descriptions, onlyClient, resovle, reject )
    {
        Utils.info("building javascript start...");
        var lessPath = PATH.resolve(config.system_style_path, config.system_style_name );
        var globalVars = mergeThemeConfig( lessPath ,config.theme, config );
        var options ={
            paths: [lessPath],
            globalVars: globalVars,
            compress: config.minify === 'enable',
        };
        globalVars.theme = config.theme;

       /* less.functions.functionRegistry.add("superposition", superposition);
        less.functions.functionRegistry.add("themeColor", function (color) {
            return themeColor(color, options.globalVars.themeColor , options.globalVars.themeName );
        });*/

        var len = descriptions.length;
        var index = 0;
        var view_path = Utils.getBuildPath(config, 'build.html');
        var allHashMap = {};
        var allServerRoutes = {};
        var loadRequiremnets = {};
        //基础模块(es or system)
        var baseModule = systemMainClassModules;
        //服务提供者
        var serviceProviders ={};
        //基础文件与开发文件是否需要分开
        var doPart= config.script_part_load;
        var handle = Utils.MD5( (new Date()).getTime().toString() , 16 );
        //加载js文件的路径
        var js_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.js') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
       //加载css文件的路径
        var css_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.css') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //构建脚本内容
        var builder = require( '../javascript/builder.js');
        var buildBaseScript = function (config, scriptContent, requirements, hashMap , serverRoutes, bootstrap,loadRequirements )
        {
            return builder(config.build_path, config, scriptContent, requirements, {
                "namespace": function (content) {
                    return content.replace(/var\s+codeMap=\{\};/, "var codeMap=" + JSON.stringify(hashMap) + ";");
                },
                "HANDLE":handle,
                "VERSION":config.makeVersion,
                "JS_LOAD_PATH":js_load_path,
                "CSS_LOAD_PATH":css_load_path,
                "NAMESPACE_HASH_MAP": hashMap,
                "SERVICE_ROUTE_LIST": serverRoutes,
                "BOOTSTRAP_CLASS_FILE_NAME": bootstrap.fullclassname,
                "COMMAND_SWITCH":config.command_switch,
                "LOAD_REQUIREMENTS":loadRequirements||"{}",
                "ORIGIN_SYNTAX": config.originMakeSyntax,
                "STATIC_URL_PATH_NAME": config.static_url_path_name,
                "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER": bootstrap && bootstrap.defineMetaTypeList && bootstrap.defineMetaTypeList.Router ? bootstrap.fullclassname + "@" + bootstrap.defineMetaTypeList.Router.param.default : null,
                "BOOTSTRAP_CLASS_PATH": Utils.getRelativePath(
                    Utils.getBuildPath(config, "build.webroot"),
                    Utils.getBuildPath(config, "build.bootstrap")
                )
            });
        }

        //处理每一个入口文件
        var buildEach=function(index, callback, resovle, reject)
        {
            var bootstrap = descriptions[ index ];
            var outputname = bootstrap.fullclassname
            var hashMap = Compile("javascript", Maker.makeModuleByName( bootstrap.fullclassname ) , bootstrap, config);
            var loadHash = {};
            var allModules = getRequirementsAllModules( bootstrap , [],  loadHash );
            var usedModules = getRequirementsAllUsedModules( allModules, "javascript" );
            Utils.merge(allHashMap,hashMap);

            //获取服务提供者
            if( !onlyClient )
            {
                Utils.merge(serviceProviders, getServiceProvider(config,usedModules).providers );
            }

            //获取依赖文件
            var external_requires = [];
            usedModules.filter(function (e)
            {
                var o = e.ownerFragmentModule || e;
                if( o.isMakeView===true )
                {
                    //需要生成视图
                    if( !onlyClient )
                    {
                        mergeModules(usedModules, createServerView(view_path, o, "javascript", config, bootstrap));
                    }
                    if( o.moduleContext.external_requires instanceof Array && o.moduleContext.external_requires.length > 0 )
                    {
                        external_requires = external_requires.concat(o.moduleContext.external_requires);
                    }
                }
            });

            //获取路由配置
            var serverRoutes = getServiceRoutes(config, allModules );
            Utils.merge(allServerRoutes,serverRoutes);

            //准备相应的文件
            var skinModules = getRequirementsAllSkinModules( allModules );
            var scriptContent = "";
            var requirements = [];

            //拆分系统类与本地类
            if( doPart )
            {
                scriptContent = getModuleScriptContent( getModulesWithPolicy(usedModules, MODULE_POLICY_LOCAL) );
                getModulesWithPolicy(usedModules, MODULE_POLICY_GLOBAL | MODULE_POLICY_CORE ).forEach(function (item) {
                    if( !item.nonglobal  )
                    {
                        requirements.push( item.type );
                    }
                    if( baseModule.indexOf( item ) < 0 )
                    {
                        baseModule.push( item );
                    }
                });

            }else
            {
                scriptContent = getModuleScriptContent( usedModules );
                requirements = getRequirementsAllGlobalClass( usedModules );
                scriptContent = scriptContent.concat(systemMainClassModules.map(function (e) {
                    return e.makeContent['javascript'];
                }));
            }

            //生成源文件
            if( config.source_file ==="enable" )
            {
                outputFiles(  Utils.getBuildPath(config, 'build.js')+"/src", ".js",  usedModules , null, "javascript");
            }

            //应用模块需要的依赖文件
            loadRequiremnets[ bootstrap.fullclassname ] = {
                script:getLoadFileRelativePath(config,PATH.resolve(Utils.getBuildPath(config, 'build.js'), outputname + '.js')),
                css:getLoadFileRelativePath(config, PATH.resolve( Utils.getBuildPath(config, 'build.css'), outputname + '.css')  ),
                require:external_requires
            };

            //如果需要把基础类与本地类分开加载
            if( doPart === true )
            {
                scriptContent = builder.segment( config, scriptContent.join("") , requirements, handle,  bootstrap.fullclassname );
            }else{
                //loadRequire.push( scriptFile );
                scriptContent =  buildBaseScript(
                    config,
                    scriptContent.join(""),
                    requirements,
                    hashMap ,
                    serverRoutes,
                    bootstrap,
                    JSON.stringify(({})[ bootstrap.fullclassname ]=loadRequiremnets[ bootstrap.fullclassname ])
                );
            }

            //需要处理样内容
            buildStyle(skinModules, lessPath, options, outputname, config, function(err, output)
            {
                if (err) 
                {
                    Utils.error(err.message);
                    Utils.error(err.extract.join('\n'));
                    //reject();

                } else if(output)
                {
                    var filename = PATH.resolve(Utils.getBuildPath(config, 'build.css'), outputname + '.css');
                    var flag = true;
                    if(typeof config.outputCallback === "function"){
                        flag = config.outputCallback(output.css,filename,'.css');
                    }
                    if( flag !== false ){
                        fs.writeFileSync(filename, output.css);
                    }
                }

                //压缩脚本
                if (scriptContent && config.minify === 'enable')
                {
                    var script = uglify.minify(scriptContent, {ie8: true});
                    if (script.error)throw script.error;
                    scriptContent = script.code;
                }

                var outputflag = true;
                if(typeof config.outputCallback === "function"){
                    outputflag = config.outputCallback(scriptContent,PATH.resolve(Utils.getBuildPath(config, 'build.js'), outputname + '.js'),'.js');
                }

                if( outputflag !== false )
                {
                    //生成文件
                    Utils.setContents(
                        PATH.resolve(Utils.getBuildPath(config, 'build.js'), outputname + '.js'),
                        scriptContent
                    );
                }
                callback(resovle, reject);
            });
        }

        //需要生成系统脚本
        var buildSystem = function(resovle, reject)
        {
            if( doPart === true )
            {
                var default_bootstrap = config.default_bootstrap_class ? Maker.localDescriptions[  config.default_bootstrap_class ] : null;

                //构建脚本内容
                scriptContent = buildBaseScript(
                    config,
                    getModuleScriptContent( baseModule ).join(""),
                    getRequirementsAllGlobalClass( baseModule ),
                    allHashMap ,
                    allServerRoutes,
                    default_bootstrap,
                    JSON.stringify(loadRequiremnets)
                );

                //压缩脚本
                if (scriptContent && config.minify === 'enable')
                {
                    var script = uglify.minify(scriptContent, {ie8: true});
                    if (script.error)throw script.error;
                    scriptContent = script.code;
                }

                //生成文件
                var baseScriptFile =  PATH.resolve( Utils.getBuildPath(config, 'build.js'),'easescript.js' );
                var outputflag = true;
                if(typeof config.outputCallback === "function"){
                    outputflag = config.outputCallback(scriptContent,baseScriptFile,'.js');
                }
                if( outputflag !== false )
                {
                    Utils.setContents(
                        baseScriptFile,
                        scriptContent
                    );
                }

                if( default_bootstrap )
                {
                    var default_bootstrap_name = default_bootstrap.fullclassname;

                    //生成入口视图
                    Utils.setContents(
                        PATH.resolve(Utils.getBuildPath(config, 'build.webroot'),'index.html'),
                        builder.getBootstrapView(config, {
                            META_CHARSET:"UTF-8",
                            META_HTTP_EQUIV:"X-UA-Compatible",
                            META_CONTENT:"IE=edge",
                            META_KEYWORD_HTTP_EQUIV:"es,easescript",
                            BASE_STYLE_FILE:"",
                            COMMAND_SWITCH:config.command_switch,
                            VERSION:config.makeVersion,
                            APP_STYLE_FILE: getLoadFileRelativePath(
                                config,
                                PATH.resolve(
                                    Utils.getBuildPath(config, 'build.css'),
                                    default_bootstrap_name+".css"
                                )
                            ),
                            BASE_SCRIPT_FILE:getLoadFileRelativePath( config, baseScriptFile )+"?v="+config.makeVersion,
                            APP_SCRIPT_FILE:getLoadFileRelativePath(
                                config,
                                PATH.resolve(
                                    Utils.getBuildPath(config, 'build.js'),
                                    default_bootstrap_name+".js"
                                )
                            ),
                            VIEW_TITLE:"Welcome to the EaseScript world!",
                        })
                    );
                }
            }

            //需要构建服务类
            if( onlyClient !== true )
            {
                var providerModuleList = [];

                //如果服务不存在则生成
                createServiceProvider(config, serviceProviders );

                //加载服务类的描述信息
                Utils.forEach(serviceProviders,function (item,fullclassname)
                {
                    var module = Maker.loadModuleDescription(config.service_provider_syntax, fullclassname, config, null, null,true);
                    providerModuleList.push( module );
                });

                //编译服务类
                SyntaxBuilder[config.service_provider_syntax](config,providerModuleList,true, resovle, reject);
            }else{
                resovle();
            }

        };

        //开始构建代码
        if( len > 0 )
        {
            var done=function(resovle,reject)
            {
                if(index < len)
                {
                    resovle(function(resovle, reject)
                    {
                        buildEach(index++, done,resovle,reject);
                    });

                }else
                {
                    resovle( buildSystem );
                }
            }
            buildEach(index++, done, resovle, reject);
        }else
        {
            resovle( buildSystem );
        }
    },

    'php':function(config, descriptions, onlyServer, resovle, reject )
    {
        Utils.info("building php start...");
        //加载js文件的路径
        var js_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.js') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //加载css文件的路径
        var css_load_path = PATH.relative( Utils.getBuildPath(config, 'build.webroot') , Utils.getBuildPath(config, 'build.css') ).replace(/\\/g,"/").replace(/^[\/\.]+/g,'');
        //所有引用模块
        var allModules = systemMainClassModules.slice(0);
        //已经使用的模块
        var usedModules = systemMainClassModules.slice(0);
        //以加载文件的哈希对象
        var hash = {};
        //生成视图的路径
        var view_path = Utils.getBuildPath(config, 'build.view');
        //构建应该路径
        var app_path = Utils.getBuildPath(config, 'build.application');
        //命名空间映射关系
        var hashMap={};
        //编译模块
        Utils.forEach(descriptions, function (module) {
            hashMap = Compile("php", Maker.makeModuleByName(module.fullclassname), module, config);
            getRequirementsAllModules(module, allModules, hash);
        });

        //获取所有使用的模块
        usedModules = usedModules.concat( getRequirementsAllUsedModules( allModules, "php" ) );

        //服务提供者的路由配置
        var routeMapping = onlyServer === true ? getServiceProvider(config, usedModules).routes
            : makeServiceProvider(config, usedModules, hash, "php", hashMap);

        //应用路由配置
        Utils.merge(routeMapping,getServiceRoutes(config, usedModules));

        //需要生成的本地模块
        var localModules = usedModules.filter(function (e)
        {
            return e.nonglobal === true;
        });

        //php构建器
        var phpBuilder = require( '../php/builder.js');

        //使用的全局类模块
        var requirements = usedModules.filter(function (a) {
             return !(a.nonglobal === true);
        });

        //全局类模块名
        requirements= requirements.map(function (a) {
              return a.type;
        });

        //生成php文件
        phpBuilder( config.build_path, config, localModules, requirements,{
            "NAMESPACE_HASH_MAP":hashMap,
            "SERVICE_ROUTE_LIST": routeMapping,
            "BOOTSTRAP_CLASS_FILE_NAME":"Bootstrap.php",
            "VERSION":config.makeVersion,
            "ORIGIN_SYNTAX":config.originMakeSyntax,
            "JS_LOAD_PATH":js_load_path,
            "CSS_LOAD_PATH":css_load_path,
            "COMMAND_SWITCH":config.command_switch,
            "STATIC_URL_PATH_NAME":config.static_url_path_name,
            "DEFAULT_BOOTSTRAP_ROUTER_PROVIDER":config.default_bootstrap_router_provider,
            "BOOTSTRAP_CLASS_PATH":Utils.getRelativePath(
                Utils.getBuildPath(config,"build.webroot"),
                Utils.getBuildPath(config,"build.bootstrap")
            ),
            "EASESCRIPT_ROOT":Utils.getRelativePath(
                Utils.getBuildPath(config,"build.bootstrap"),
                config.build_path
            ),
        });

        //构建需要生成的js文件
        if( onlyServer !==true )
        {
            SyntaxBuilder.javascript(config, descriptions, true, resovle, reject );
        }else{
            resovle();
        }
    }
};

/**
 * 生成服务路由
 * @param config
 * @returns {Array}
 */
function getServiceRoutes(config, allModules )
{
    var routes = {};
    //路由控制列表
    Utils.forEach(allModules.filter(function (e)
    {
        return !!e.controllerRouteList;
    }),function (item) {
        Utils.forEach(item.controllerRouteList,function (item,key) {
            routes[key]=item;
        });
    });
    return routes;
}


/**
 * 获取服务提供者清单
 * @param config
 * @returns {Array}
 */
function getServiceProvider(config, allModules)
{
    var providers = {};
    var routes = {};
    var serviceProviderList = allModules.filter(function (e) {
        return !!e.serviceProviderList;
    }).map(function (e) {
        return e.serviceProviderList;
    });

    Utils.forEach(serviceProviderList, function (provider)
    {
        Utils.forEach(provider, function (item) {
            var key = item.provider;
            var provider = providers[key] || (providers[key] = {});
            var param = item.name.match(/\{(.*?)\}/g);
            if (!provider[item.action]) {
                provider[item.action] = {param: param, method: item.method};
            } else if (param && (!provider[item.action].param || provider[item.action].param.length < param.length)) {
                provider[item.action].param = param;
            }
            routes[item.method + ':' + item.bind] = {
                method: item.method,
                alias: item.bind,
                provider: item.provider + "@" + item.action
            };
           (provider[item.action].routes || (provider[item.action].routes = {}))[ item.method + ':' + item.bind ] = routes[item.method + ':' + item.bind];
        });
    });

    return {
        providers:providers,
        routes:routes
    };
}

/**
 * 生成服务提供者语法
 * @param config
 * @returns {Array}
 */
function makeServiceProvider(config, allModules, hash, syntax, hashMap )
{
    var service = getServiceProvider(config, allModules);

    //如果服务不存在则生成
    createServiceProvider(config, service.providers );

    var _hashMap;
    Utils.forEach(service.providers,function (item,fullclassname)
    {
        var module = Maker.loadModuleDescription(syntax, fullclassname, config, null, null,true);
        _hashMap = Compile( syntax , Maker.makeModuleByName(module.fullclassname), module, config);
        getRequirementsAllModules( module,allModules, hash );
    });

    if( hashMap )
    {
        Utils.merge(hashMap, _hashMap);
    }
    return service.routes;
}

/**
 * 生成服务提供者
 * @param config
 * @param provider
 */
function createServiceProvider(config, provider )
{
    Utils.forEach(provider,function (item,name)
    {
        if( Maker.isClassFileExists(name,config) )
        {
            return;
        }

        var package = name.split(".");
        var className = package.pop();
        package = package.join(".");
        var code = ["package ", package, "{\n"];
        code.push( "\timport es.core.Service;\n" );
        code.push( "\tpublic class ", className, " extends Service{\n");
        for(var p in item)
        {
            var param = item[p].param;
            var paramName = [];
            if( param )
            {
                param = param.map(function (val) {
                    val = val.replace(/^\{|\}$/g,'');
                    if( val.indexOf(":") < 0 ){
                        val = val+":*";
                    }
                    paramName.push( val.substr(0, val.indexOf(":") ) );
                    return val;
                });
            }else{
                param = [];
            }

            Utils.forEach(item[p].routes,function (route) {
                code.push("\t\t[Router(method='"+route.method+"',alias='"+(route.alias||p)+"')]\n");
            });

            code.push("\t\tpublic function ", p, "(",param.join(","),"){\n");
            if( item[p].method ==="get" ){
                if( paramName.length > 0 ){
                    code.push("\t\t\tvar result:* = this.query('select * from "+className.toLowerCase()+"  where "+paramName.join("=? and")+" = ?', ["+paramName.join(",")+"]);\n");
                }else {
                    code.push("\t\t\tvar result:* = this.query('select * from " + className.toLowerCase() + " limit 100');\n");
                }
                code.push("\t\t\treturn this.success(result);\n");
            }else if(item[p].method ==="put" || item[p].method ==="post"){
                code.push("\t\t\tvar result:Boolean = true;\n");
                code.push("\t\t\treturn this.success(result);\n");
            }else if(item[p].method ==="delete" )
            {
                code.push("\t\t\tvar result:Boolean = true;\n");
                code.push("\t\t\treturn this.success(result);\n");
            }
            code.push("\t\t}\n");
        }
        code.push( "\t}\n");
        code.push( "}");

        var dir =  Utils.mkdir( PATH.resolve(config.project_path, package) );
        var filepath = PATH.resolve( dir, className + config.suffix );
        Utils.setContents(filepath, code.join(""));
    });
}

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
    var tab = new Array( depth+1 );
    tab = tab.join("\t");
    var type = config instanceof Array ? 'array' : typeof config;
    if( type ==="string" )return tab+config;
    var item = [];
    for( var p in config )
    {
        if( p==="__build" )continue;
        if( config[p]+""=="[object Object]" || config[p] instanceof Array )
        {
            item.push( tab+'"'+p+'":'+configToJson( config[p] , depth+1 ) );

        }else
        {
            var val = typeof config[p] === "string" ? config[p].replace(/\\/g, '/') : config[p];
            if (type === 'array') {
                item.push('"' + val + '"');
            } else if( typeof val ==="string" ) {
                item.push(tab + '"' + p + '":"'+val + '"');
            } else if(val != null ) {
                item.push(tab + '"' + p + '":'+val);
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

var mergeConfig = false;

/**
 * 获取配置信息
 * @param config
 * @returns {*}
 */
function getConfigure(config)
{
    var root_path = PATH.resolve(__dirname,'../');

     //工程目录
    var project_path = config.project_path || defaultConfig.project_path;
    if( !PATH.isAbsolute( project_path ) )
    {
        project_path = PATH.resolve( config.project_path );
        if( !fs.existsSync(project_path) )
        {
            Utils.mkdir( project_path );
        }
    }

    //构建目录
    var build_path = config.build_path || defaultConfig.build_path;

    //默认配置文件
    var makefile = PATH.resolve(project_path,'.esconfig');
    if( !Utils.isFileExists( makefile ) || config.clean===true )
    {
        mergeConfig = true;

        //合并默认属性
        config = globalConfig = Utils.merge(defaultConfig, config || {});

        //编译器的路径
        config.root_path = root_path;

        //合并默认配置文件
        if( config.config_file )
        {
            Utils.merge(config, buildConfig , require( config.config_file ) );
        }else {
            Utils.merge(config, buildConfig );
        }

        //当前工程项目路径
        config.project_path = project_path;
        config.project.path = project_path;
        config.project.name = PATH.basename(project_path);
        config.project.__build=true;
        buildProject(config.project,project_path);

        //构建输出目录
        config.build.path = build_path;
        config.build.name = "";
        buildProject(config.build, config.project_path );
        config.build_path = config.build.path;

        //工作空间目录
        if( config.workspace )
        {
            if( !PATH.isAbsolute(config.workspace) )
            {
                config.workspace = PATH.join(project_path, config.workspace);
            }
            if( !fs.existsSync( config.workspace ) )
            {
                Utils.mkdir( config.workspace );
            }

        }else
        {
            config.workspace = config.project.child.src.path;
        }

        //主题配置文件路径
        if( config.theme_file_path && !PATH.isAbsolute( config.theme_file_path ) )
        {
            config.theme_file_path = PATH.resolve( config.workspace, config.theme_file_path );
        }

        //指定组件皮肤样式配置文件
        if( config.skin_style_config )
        {
            var dataitem={};
            Utils.forEach(  config.skin_style_config, function (item,key) {
                if( item.slice(-5)===".conf" )
                {
                    if( !PATH.isAbsolute( item ) )
                    {
                        item = PATH.resolve(config.workspace, item);
                    }
                    if( !Utils.isFileExists(item) )
                    {
                        throw new ReferenceError( item+" is not exists.");
                    }
                    var fileconfig = JSON.parse( Utils.getContents(item) );
                    if( fileconfig ){
                        dataitem = Utils.merge(true,dataitem,fileconfig);
                    }
                }else{
                    dataitem[key]=item;
                }
            });
            config.skin_style_config = dataitem;
        }

        //系统类库路径名
        //在加载类文件时发现是此路径名打头的都转到系统库路径中查找文件。
        config.system_core_class={
            "iteratorClass":"es.interfaces.IListIterator",
        };

        //系统必需要加载的类
        var system_main_class = [];
        for( var scc in config.system_core_class )
        {
            system_main_class.push( config.system_core_class[scc] );
        }
        config.system_require_main_class = system_main_class;

        //构建应用的目录名
        config.build_application_name = Utils.getBuildPath(config,"build.application","name");

        //生成一个默认的配置文件
        Utils.setContents(makefile, configToJson( config , 1 ) );

    }else
    {
        config = Utils.merge( mergeConfig ? globalConfig : JSON.parse( Utils.getContents( makefile ) ) , config ||{} );
    }

    //需要引用的全局类
    requirements = config.requirements || (config.requirements = {});

     //浏览器中的全局模块
     if( config.browser === 'enable' )
     {
         var browser = require('./browser.js');
         Utils.merge(globals,browser);
     }

    //默认构建的语法
    config.syntax = syntaxMap[ config.syntax ] || 'javascript';
    config.originMakeSyntax = config.syntax;
     //生产环境模式启用压缩文件
     if( config.mode===3 && config.minify == null )
     {
         config.minify = 'enable';
     }
     config.globals=globals;
     config.debug = config.debug==='enable' ? 'on' : 'off';
     //当前支持构建的语法
     config.syntax_supported = syntax_supported;
      //服务提供者
     config.ServiceProviderList = {};
     //编译版本号
     config.makeVersion = (new Date()).getTime();
     //使用外部的库类
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

    //是否支持指定的语法
    if( syntax_supported[ config.syntax ] !== true )
    {
        Utils.error("Syntax "+config.syntax +" is not supported.");
    }

    config.context = compileContext;
    if( config.reserved )
    {
        config.reserved = reserved.concat( config.reserved );
    }else{
        config.reserved = reserved;
    }

     //将上下文中引用的变量设为受保护的关键字
    for (var c in config.context )
    {
        if( c !=='defineModuleMethod' && config.reserved.indexOf( config.context[c] )<0 )
        {
            if( config.context[c] !== "Context" )
            {
               config.reserved.push( config.context[c] );
            }
        }
    }
    return config;
}

/**
 * 开始生成代码片段
 */
function make( config , callback)
{
    try
    {
        config = getConfigure( config );
        if( typeof callback === "function" )
        {
            config.outputCallback = callback;
        }
        config.project_path = config.workspace;
        var project_path = config.project_path;
        var makefiles = [];
        var bootstrap_files= config.bootstrap ? config.bootstrap : project_path;

        if( typeof bootstrap_files === "string" )
        {
            bootstrap_files=[ bootstrap_files ];
        }

        //获取需要编译的文件,支持目录或者文件路径
        bootstrap_files.forEach(function(file)
        {
            file = (PATH.isAbsolute( file ) ? file : PATH.resolve( project_path , file.replace(".","/") ) ).replace(/\\/g,'/');
            //如果定要编译的目录下的文件
            if( Utils.isDir( file ) )
            {
                makefiles = makefiles.concat( Utils.getDirectoryFiles( file ).filter(function (a) {
                    return PATH.extname(a) === config.suffix;
                }));

            }else
            {
                //如果是指定文件
                if( !Utils.isFileExists( file ) )
                {
                    file+=config.suffix;
                }
                makefiles.push( file );
            }

        });

        var i = 0;
        var len = makefiles.length;
        var descriptions=[];
        var inheritClass=[];

        //入口文件列表,获取源码信息
        var bootstrapClassList = config.bootstrap_class_list = [];
        for(;i<len;i++)
        {
            var classfile =PATH.basename( makefiles[i] , config.suffix );
            var basedir = PATH.dirname(makefiles[i]);
            var _filepath = filepath(classfile, basedir !== "." ? basedir : project_path );
            var classname = PATH.relative(project_path, _filepath ).replace(/\\/g,'/');
            if( inheritClass.indexOf(classname) < 0 )
            {
                bootstrapClassList.push( classname );
                var desc = Maker.loadModuleDescription(config.syntax, classname, config, _filepath);
                descriptions.push(desc);
                if (desc.inherit)
                {
                    inheritClass.push(desc.import.hasOwnProperty(desc.inherit) ? desc.import[desc.inherit] : desc.inherit);
                }
            }
        }

        //默认入口类优先级 ==> 手动指定，类文件名为index, 第一个类
        var bootstrap_class=[null,null,null];

        //继承 es.core.Application 的属于入口文件
        var app_descriptions = descriptions.filter(function (a)
        {
            //如果这个类被子类继承过证明也不是入口文件
            if( inheritClass.indexOf( a.fullclassname ) >=0 )
            {
                return false;
            }
            //是否属性于应用入口类
            var flag = Maker.checkInstanceOf(a,"es.core.Application");
            if( flag )
            {
                //默认指定第一个为入口类
                if( bootstrap_class[2] === null )
                {
                    bootstrap_class[2] = a.fullclassname;
                }

                //默认index为入口类
                if( a.classname.toLowerCase() ==="index" )
                {
                    bootstrap_class[1] = a.fullclassname;
                }

                //否则为指定的入口类
                if( a.fullclassname === config.default_bootstrap_class )
                {
                    bootstrap_class[0] = a.fullclassname;
                }

                //如果没有指定路由
                if( !a.defineMetaTypeList.Router )
                {
                    var defaultMethod = "index";
                    if( !(a.proto.hasOwnProperty("index") && a.proto.index.id === "function" && a.proto.index.privilege==="public")  )
                    {
                        defaultMethod = "";
                        for(var p in a.proto )
                        {
                            var item = a.proto[p];
                            if( item.id ==="function" && item.privilege==="public" )
                            {
                                defaultMethod = p;
                                break;
                            }
                        }
                    }
                    
                    a.defineMetaTypeList.Router={
                        'type':"Router",
                        'param':{
                            default:defaultMethod,
                            method:"get",
                            isModule:true,
                            provider:a.fullclassname + '@' + defaultMethod
                        }
                    };
                    a.moduleRouterProvider = a.defineMetaTypeList.Router.param;
                }

            }
            return flag;
        });

        //至少有一个应用入口
        if( app_descriptions.length > 0  )
        {
            descriptions = app_descriptions;

        }else
        {
            //片段文件代码不能分开加载 
            config.script_part_load = false;
            if( descriptions.length > 1 )
            {
                if( !config.default_bootstrap_class )
                {
                   throw new ReferenceError("Need to specify the default bootstrap class name."); 
                }
                descriptions=[ Maker.localDescriptions[ config.default_bootstrap_class ] ];
            }
        }

        //是否有找到指定的入口类
        if( config.default_bootstrap_class && !bootstrap_class[0] )
        {
            throw new ReferenceError("Not found assign bootstrap class. for '"+config.default_bootstrap_class+"'");
        }

        //默认入口类
        if( !config.default_bootstrap_class )
        {
            config.default_bootstrap_class = bootstrap_class.filter(function (a) {
                return !!a;
            })[0];
        }

        //如果指定默认的入口类
        if( config.default_bootstrap_class && Maker.localDescriptions[  config.default_bootstrap_class ] )
        {
            var bootstrapClassModule = Maker.localDescriptions[  config.default_bootstrap_class ];
            //如果有继承Application就必须定义默认的路由方法
            if( Maker.checkInstanceOf(bootstrapClassModule,"es.core.Application") )
            {
                if( !bootstrapClassModule.defineMetaTypeList.Router || !bootstrapClassModule.defineMetaTypeList.Router.param.default )
                {
                    throw new ReferenceError("Default bootstrap router method is not define '"+ config.default_bootstrap_class+"'");
                }
                config.default_bootstrap_router_provider=config.default_bootstrap_class+"@"+bootstrapClassModule.defineMetaTypeList.Router.param.default;
            }
        }

        //开始构建
        if( descriptions.length > 0 )
        {
            Utils.info('Making starting ...');
            var prom = new Promise(function (resovle, reject)
            {
                SyntaxBuilder[ config.syntax ]( config , descriptions, false, resovle, reject);
            });

            var step = function( callback )
            {
                if( callback )
                {
                   return (new Promise(callback)).then( step );

                }else
                {
                    Utils.info('Making done ...');
                    Utils.info('\r\nCompleted !!!');
                    Utils.info('Make path : '+config.build_path );
                }
            }
            prom.then(step);

        }else
        {
            Utils.warn('Not found bootstrap files.');
        }

    }catch (e)
    {
        Utils.error(e.message);
        console.log( e );
    }
}

module.exports = make;