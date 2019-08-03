const utils = require('../lib/utils.js');
const globals=utils.globals;
const rootPath =  utils.getResolvePath( __dirname );
const path = require("path");
const fs = require("fs");

/**
 * 在特定的版本下需要加载的库文件
 */
const library={
    'ie-9':{'Element':'Sizzle.js'}
};

/**
 * 已经构建的系统模块
 */
const makedSystemModules={};

/**
 * 根据指定的版本加载对应的策略文件
 * @type {Array}
 */
function polyfill( config )
{
    var files = utils.getDirectoryFiles( rootPath+'/fix/' );
    var items={};
    for(var i in files )
    {
        var is=true;
        var path = rootPath + '/fix/' + files[i];
        var info = utils.getFilenameByPath(path).split('-', 3);
        if( config.compat_version && typeof config.compat_version === 'object' && config.compat_version.hasOwnProperty( info[1] ) )
        {
            is = parseFloat( info[2] ) >= parseFloat( config.compat_version[ info[1] ] );
        }
        if(is){
            if( !(items[ info[0] ] instanceof Array) )items[ info[0] ]=[];
            items[ info[0] ].push(path);
        }
    }
    return items;
}


/**
 * 获取指定的文件模块
 * @param filepath
 */
function include(contents, name , filepath, fix, libs, config )
{
    name = utils.getGlobalTypeMap(name)
    if( makedSystemModules[ name ] )
    {
        contents[ name ] = makedSystemModules[ name ];
        return;
    }

    if( utils.excludeLoadSystemFile( name ) || ( config.globals.hasOwnProperty(name) && config.globals[name].notLoadFile===true ) )
    {
        return;
    }

    makedSystemModules[ name ] = {};

    if( !filepath )
    {
        filepath = rootPath + '/system/' + name + '.js';
    }

    var str = '';

    //加载的模块有依赖的第三方库
    if( libs && libs[name] )
    {
        str+= utils.getContents( rootPath+'/vendor/'+libs[name] ) +"\n";
    }

    if( utils.isFileExists(filepath) )
    {     
        var dependencies = [];
        str += utils.getContents( filepath );
        str = str.replace(/\=\s*require\s*\(\s*([\"\'])(.*?)\1\s*\)/g,function(a,b,c){

             var info = path.parse(c);
             include(contents, info.name , null, fix, libs, config );
             dependencies.push( info.name );
             return '=require("'+utils.getRequireIdentifier( config, config.globals[ info.name ] || {type:info.name}, '.es' )+'")';
        });

        //加载对应模块的兼容策略文件
        if( fix && fix[name] )
        {
            for( var f in fix[name] )
            {
                str+='\n'+utils.getContents( fix[name][f] );
            }
        }

        makedSystemModules[ name ].content = str;
        makedSystemModules[ name ].deps = dependencies;
        contents[ name ]=makedSystemModules[ name ];
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        return true;
    }

    throw new Error(name+' does exists ('+filepath+')');
}


/**
 * 加载系统模板所有需要的类
 * @param config
 * @returns {string}
 */
function loadRequireSystemModuleContents(config,requirements)
{
    var contents = {};
    var fix = polyfill( config );

    /**
     * 需要支持的第三方库文件
     */
    var libs={};
    for(var prop in library)
    {
        var is=config.compat_version==='*' || prop==='*';
        var info = prop.split('-', 2);
        if( !is && config.compat_version && typeof config.compat_version === 'object' && config.compat_version.hasOwnProperty( info[0] ) )
        {
            is = parseFloat( info[1] ) > parseFloat( config.compat_version[ info[0] ] );
        }
        if(is)utils.merge(libs, library[prop]);
    }

    for(var prop in requirements)
    {
        include(contents, requirements[prop], null, fix, libs, config );
    }
    return contents;

}

/**
 * 加载系统模块内容
 * @param {*} config 
 * @param {*} name 
 */
function loadSystemModuleContentByName(config,name)
{
   name =  utils.getGlobalTypeMap( name );
   if( !makedSystemModules[name] )
   {
       loadRequireSystemModuleContents(config,[name]);
   }
   return makedSystemModules[name];
}


/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(config ,  replacements)
{
    //系统引导器
    var bootstrap = config.build_mode ==="app" ? rootPath+'/bootstrap.js' : rootPath+'/boot.js';
    bootstrap = utils.getContents( bootstrap );
    bootstrap = replaceContent(bootstrap, replacements, config);
    return bootstrap;
}

/**
 * 构建单个块的内容
 * @param {*} config 
 * @param {*} replacements 
 */
function chunk(config,replacements)
{
    var bootstrap = utils.getContents( rootPath+'/chunk.js' );
    bootstrap = replaceContent(bootstrap, replacements, config);
    return bootstrap;
}


/**
 * 生成入口视图
 * @param content
 * @param requirements
 * @return {*|string}
 */
function getBootstrapView( config, replacements )
{
    return replaceContent( utils.getContents( config.view_template_path || (rootPath+'/index.html') ), replacements, config);
}


/**
 * 替换入口模板内容
 * @param {*} content 
 * @param {*} data 
 * @param {*} config 
 */
function replaceContent(content, data, config)
{
    data = data||{};
    content = content.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {

        var requireex = b.match(/^REQUIRE_IDENTIFIER\((.*?)\)$/i);
        if( requireex  )
        {
            return utils.getRequireIdentifier(config, config.globals[ requireex[1] ] || {type:requireex[1]} , '.es' )
        }

        switch ( b )
        {
            case "SERVICE_ROUTE_LIST" :
                return makeServiceRouteList( data["SERVICE_ROUTE_LIST"]||{});
            break;
        }
        return typeof data[b] !== "undefined" ? data[b] : "null";
    });
    return content;
}

/**
 * 生成服务路由清单
 * @param {*} serviceRouteList 
 */
function makeServiceRouteList( serviceRouteList )
{
    var items = {};
    utils.forEach(serviceRouteList,function (item) {
        var obj = items[ item.method ] || (items[ item.method ] = []);
        obj.push("\t\t\""+item.alias+"\":\""+item.provider+"\"");
    });

    var bind=[];
    utils.forEach(items,function (item,method) {
        bind.push( "\n\t\""+method+"\":{\n"+item.join(",\n")+'\n\t}' );
    });
    return '{' + bind.join(",") +'\n}';
}

/**
 * 判断系统文件是否存在
 * @param {*} name 
 */
function isSystemFileExists( name )
{
   return utils.isFileExists( rootPath + '/system/' + name + '.js' )
}

/**
 * 构建模板内容为json数据格式
 * @param {*} modules 
 * @param {*} config 
 */
function buildModuleToJsonString(config, modules)
{
    const loaded = {};
    const loadSystemModuleFactory = function(name)
    {
        return loadSystemModuleContentByName(config, name);
    }
    const getModuleIdentifier=function( module )
    {
        return utils.getRequireIdentifier(config, module, '.es');
    }
    const make = function( modules )
    {
        return modules.map(function (e) 
        {
            var name = getModuleIdentifier(e);
            if( loaded[ name ] ){
                return null;
            }
            loaded[ name ] = true;

            if( e.nonglobal )
            {
                return '\n\n/***** Class '+name+' *****/\n\n"'+name+"\": function(module,require){\n"+e.makeContent['javascript']+"\n}";

            }else if( e.type )
            {
                var data = loadSystemModuleFactory( e.type )
                if( data )
                {
                    var deps = [];
                    data.deps.forEach(function(name){
                        if( !loaded[name] ){
                            deps.push( {type:name} );
                        }
                    });

                    var content = [];
                    if( deps.length > 0 )
                    {
                        content = make(deps);
                    }

                    content.push( '\n\n/***** System '+name+' *****/\n\n"'+name+"\": function(module,require){\n"+data.content+"\n}" );
                    return content.join(",");
                }
                return null;
            }
            return '\n\n/***** Not found '+name+' *****/\n\n"'+name+"\": function(module,require){\nthrow new Error('Not found "+name+"');\n}";
        }).filter(function(content){ return !!content; });
    }

    return "{"+make(modules).join(",")+"}";
}

/**
 * 生成文件内容
 * @param {*} config 
 * @param {*} classModules 
 * @param {*} loadSystemModuleFactory 
 * @param {*} suffix 
 */
function outputFiles(config, classModules, suffix )
{
    const loadSystemModuleFactory = function(name)
    {
        return loadSystemModuleContentByName(config, name);
    }

    var bulid_path = utils.getBuildPath(config, 'build.js');
    const corename = config.system_lib_path_name+'.';
    const core_path = utils.getBuildPath(config, 'core');
    const system_path = utils.getBuildPath(config, 'system');
    const base = path.relative( bulid_path, config.workspace ).replace(/\\/g,'/').replace(/\.\.\//g,'');
    const hash = {};
    bulid_path = path.resolve( bulid_path, base);

    const emitFile = function(file, content )
    {
        if( !hash[file] )
        {
            hash[file] = true;
            if( content )
            {
                utils.setContents(file, content);
            }
        }
    }
    const emitSystemFile = function( name )
    {
        name = utils.getGlobalTypeMap( name );
        var file = path.join(system_path,name+suffix);
        if( !hash[file] )
        {
            var data = loadSystemModuleFactory( name );
            if( data )
            {
                var deps = data.deps;
                emitFile(file, data.content);
                deps.forEach(function(name)
                {
                    emitSystemFile(name);
                });
            }
        }
    }

    for (var m in classModules)
    {
        var localModule = classModules[m];
        if( localModule.nonglobal  )
        {
            var content = localModule.makeContent ? localModule.makeContent[ 'javascript' ] : '';
            if ( content )
            {
                var file = utils.getResolvePath( localModule.fullclassname.slice(0, corename.length )===corename ?  core_path : bulid_path , localModule.fullclassname );
                utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
                emitFile(file+suffix, content);
            }
        }else if( localModule.type )
        {
            emitSystemFile( localModule.type );
        }
    }
}


/**
 * 获取所有的资源路径
 * @param {*} config 
 * @param {*} modules 
 */
function getAssetsFilePath(config, modules)
{
    const map = {};
    const files = [];
    const push = function(file)
    {
        if( map[ file ] !==true )
        {
            map[ file ] = true;
            files.push( file );
        }
    }

    modules.filter(function(m){
       return m.nonglobal;
    }).map(function (m)
    {
        var o = m.ownerFragmentModule || m;
        if( o.moduleContext && o.moduleContext.external_requires instanceof Array && o.moduleContext.external_requires.length > 0  )
        {
            o.moduleContext.external_requires.forEach(function(file){
                push(file);
            }); 
        }

        //是否有指定样式文件
        if( config.skin_style_config && config.skin_style_config.hasOwnProperty(m.fullclassname) )
        {
            var stylefile = config.skin_style_config[ m.fullclassname ];
            if( !path.isAbsolute(stylefile) )
            {
                stylefile = path.resolve( config.project_path, stylefile );
            }
            push(stylefile);
        }
        //模块中的样式内容
        else
        {
            var styles = m.ownerFragmentModule.moduleContext.style;
            if( styles && styles.length > 0 )
            {
                styles.forEach(function(item){
                    push( item.file );
                });
            }
        }

    });

    return getCoreStyleFilePath(config).concat( files );
}


/**
 * 获取默认的样式文件路径
 * @param lessPath
 * @param config
 */
function getCoreStyleFilePath(config)
{
    const lesspath = path.resolve(config.system_style_path, config.system_style_name );
    var loaded = {};
    var files = [
        path.resolve(lesspath,'less',"main.less"),
    ];

    return files.map(function(file)
    {
        file = path.isAbsolute( file ) ? file : path.resolve(lesspath, file);
        if( loaded[file] !==true  )
        {
            loaded[file] = true;
            return file.replace(/\\/g,'/');
        }
        return '';

    }).filter(function(val){
        return !!val;
    });
}

/**
 * 查找指定主题名的样式对象
 * @param styleObject
 * @param name
 * @returns {*}
 */
function findThemeStyleByName(styles, name )
{
    return styles.filter(function (a) {
        var themeName = a.attr.theme || "default";
        return themeName === name;
    });
}

/**
 * 合并样式对象
 * @param styles
 * @param styleObjectAll
 * @returns {string}
 */
function combineThemeStyle( themes, styles, config )
{
    return themes.map(function (a) {
        var content = a.content;
        if( a.attr.combine )
        {
           var results = findThemeStyleByName( styles, a.attr.combine ).map(function (a) {
               return combineThemeStyle( [a], styles, config );
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
function getThemeConfig( config )
{
    const theme = config.theme;
    const lesspath = path.resolve(config.system_style_path, config.system_style_name );
    var base = theme_base_config;
    if( base===null )
    {
        base = path.resolve(lesspath, './less/variables.less');
        if( !utils.isFileExists(base) )
        {
            throw new ReferenceError("Missing less theme file for '"+base+"'");
        }
        base = parseConfigFile( utils.getContents( base ) );
        base.theme = theme;
        theme_base_config = base;
    }

    //如果有指定主题
    if( theme )
    {
         var file = config.theme_file_path;
         if( file && !path.isAbsolute(file) )
         {
             file = path.resolve( config.project_path, file);
         }

         if( utils.isFileExists(file) )
         {
             var stat = fs.statSync( file );
             if( stat.isDirectory() )
             {
                 //以文件名来区分
                 file = path.resolve( file, theme+".less");
                 if( utils.isFileExists(file)  )
                 {
                    Object.assign( base, parseConfigFile( utils.getContents( file ) ) );
                 }else{
                    utils.warn( " Not found theme file for '"+ file +"'" );
                 }

             }else
             {
                 Object.assign( base, parseConfigFile( utils.getContents( file ) ) )
             }

         }else
         {
             utils.warn( " Not found theme file for '"+ file +"'" );
         }
     }
     return base;
}



function importCssPath( name , project_path, less_path )
{
    var file = name;
    //如果不是指定的绝对路径
    if( !path.isAbsolute( name ) )
    {
        file = path.resolve( project_path, name );
    }

    //如果文件不存在,则指向到默认目录
    if( less_path && !utils.isFileExists( file ) )
    {
        file = path.resolve(less_path, name);
        if( !utils.isFileExists( file ) )
        {
            throw new Error( "'"+file +"' is not exists." );
        }
    }
    return file;
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
    var root = file ? path.dirname(file) : "";
    if( root )
    {
        root = root.replace(/\\/g, '/').replace(/\/$/,'')+"/";
    }

    //修正图片地址
    e = e.replace(/url\s*\(\s*[^@](.*?)\)/ig, function (a, b) 
    {
        b = root+b.replace(/^["']|["']$/g,"");
        if( b.substr(0,5) === "http:" || b.substr(0,6) === "https:" )return a;
        var dest = utils.copyfileToBuildDir( b, utils.getBuildPath(config, 'build.img'), config );
        var url = '"./' + path.relative(utils.getBuildPath(config, 'build.css'), dest).replace(/\\/g, '/') + '"';
        return "url("+url+")";
    });

    //加载需要嵌入的文件
    e = e.replace(/@Embed\(.*?\)/ig, function (a, b)
    {
        var metatype = utils.executeMetaType(a.substr(1));
        var dest = utils.parseMetaEmbed(metatype, config, root);
        return '"./' + path.relative(utils.getBuildPath(config, 'build.css'), dest).replace(/\\/g, '/') + '"';
    });

    //导入样式或者less
    e = e.replace(/\B@import\s+([\'\"])(.*?)\1[;\B]?/gi, function (a,b,c)
    {
        c = root+ utils.trim(c);

        //获取样式的绝对路径
        var file = importCssPath( c , config.project_path, lessPath );

        //如果没有加载过指定的文件
        if( loadedStyle[file] !== true )
        {
            loadedStyle[file] = true;
            if (c.slice(-4) === ".css")
            {
                return utils.getContents( file );
            } else {
                importStyle.push( file );
            }
        }
        return '';
    });

    //合并样式
    e = e.replace(/\B@include\s+([\'\"])(.*?)\1[;\B]?/gi, function (a,b,c)
    {
        c = root+ utils.trim(c);
        if( included[c] !==true  )
        {
            included[c] = true;
            //获取样式的绝对路径
            var file = importCssPath(c, config.project_path );
            return utils.getContents( file );
        }
        return "";
    });
    return e;
}


/**
 * 获取指定皮肤模块的所有样式内容
 * @param modules
 * @param config
 * @returns {*|{type, id, param}|{}|Array}
 */
function makeAllModuleStyleContent(config,modules)
{
    var style = modules.map(function (m)
    {
        var e = "";
        //是否有指定样式文件
        if( config.skin_style_config && config.skin_style_config.hasOwnProperty(m.fullclassname) )
        {
            var stylefile = config.skin_style_config[ m.fullclassname ];
            if( !path.isAbsolute(stylefile) )
            {
                stylefile = path.resolve( config.project_path, stylefile );
            }
            e = utils.getContents(stylefile);
        }
        //模块中的样式内容
        else if( m.ownerFragmentModule )
        {
            var styles = m.ownerFragmentModule.moduleContext.style;
            var themes = findThemeStyleByName(styles, config.theme);
            if( themes.length === 0  ){
                themes = findThemeStyleByName(styles, "default" );
            }
            e = combineThemeStyle(themes, styles ,config );
        }
        if( !e )return "";
        //设置每一个样式表的作用域
        var scope = "#"+m.fullclassname.replace(/\./g,"_");
        return [scope,"(){\n",e,"\n}\n",scope,";\n"].join("");
    });
    return style;
}



/**
 * 构建样式
 * @param modules
 * @param config
 */
function makeLessStyleContent(config, modules)
{
    //需要处理样内容
    const content = makeAllModuleStyleContent(config, modules).join("\n");
    const imports = getCoreStyleFilePath( config ).join( `";\n@import "` );
    return `\n@import "${imports}";\n${content}`;
}


builder.outputFiles = outputFiles;
builder.makeLessStyleContent = makeLessStyleContent;
builder.makeAllModuleStyleContent = makeAllModuleStyleContent;
builder.buildModuleToJsonString = buildModuleToJsonString;
builder.getAssetsFilePath = getAssetsFilePath;
builder.getCoreStyleFilePath = getCoreStyleFilePath;
builder.chunk=chunk;
builder.getThemeConfig=getThemeConfig;
builder.getBootstrapView = getBootstrapView;
builder.isSystemFileExists = isSystemFileExists;
builder.makeServiceRouteList = makeServiceRouteList;
builder.loadRequireSystemModuleContents = loadRequireSystemModuleContents;
builder.loadSystemModuleContentByName = loadSystemModuleContentByName;
module.exports = builder;