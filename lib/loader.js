const fs = require("fs");
const complier = require("./index.js");
const utils = require("./utils.js");
const path = require("path");
const loaderUtils = require('loader-utils');
const lessLoader = require('less-loader');
const less = require('less');

var config = null;
var modules = {};
var dependencies = {};
var systemPath = null;
var corePath = null;
var workspacePath = null;

function getClassIdentifier( request )
{
    request = request.replace(/\\/g,'/');
    var suffix  = path.extname( request );
    if( request.indexOf( workspacePath )===0 )
    {
        request = path.relative( workspacePath, request );
    }else if( request.indexOf( corePath )===0 )
    {
        request = path.relative( path.dirname(corePath), request );
    }else if( request.indexOf( systemPath )===0 )
    {
        request = path.relative( systemPath, request )
    }
    return request.replace(/\\/g,'/').replace(/\//g,'.').slice(0, -suffix.length );
}

function getConfig(request, options)
{
    if( config ===null )
    {
        config = options.config || findConfigPathByRequest( request );
        if( !config )
        {
            throw new TypeError("config file is not found.");
        }

        if( typeof config === "string"  )
        {
            config = JSON.parse( fs.readFileSync(config).toString() );
        }

        config = complier.getConfigure( config );
        config.serverEnable = false;
        config.watching = false;
        config.clean = false;
        config.mode = 3;
        config.module_exports = true;

        systemPath = path.resolve( config.system_lib_path,'javascript','system').replace(/\\/g,'/')+'/';
        corePath = path.resolve( config.system_lib_path,'es').replace(/\\/g,'/')+'/';
        workspacePath =config.workspace.replace(/\\/g,'/')+'/';
    }
    return config;
}

function findConfigPathByRequest( request )
{
    var dir = path.dirname( request );
    while( fs.lstatSync( dir ).isDirectory() )
    {
        var file = path.resolve( path,'.esconfig');
        if( fs.existsSync( file ) )
        {
            return file;
        }
        dir = path.dirname( path );
    }
    return null;
}


const taskQueues = [];
const updateMaps = {};

module.exports=function(content, map, meta)
{
    try
    {
        var options =  loaderUtils.getOptions(this);
        var callback = this.async();
        var resource = this.resourcePath.replace(/\\/g,'/');
        var config = getConfig( resource, options );
        config.bootstrap = resource;

        var classname =  getClassIdentifier( resource );
        var isSystem = resource.indexOf( systemPath )===0;
        if( isSystem )
        {
            var data = complier.builder.loadSystemModuleContentByName(config, classname,  updateMaps[ classname ] );
            updateMaps[ classname ] = false;
            if( data && data.content )
            {
                callback(null, getModuleContent(this,data) );
            }
            callback( new ReferenceError("Not found "+resource ) );

        }else
        {
            if( modules.hasOwnProperty( classname ) )
            {
                callback(null, getModuleContent(this,modules[classname]) );
    
            }else
            {
                this._compiler.hooks.invalid.tap('es-loader',function(filename,time)
                {
                    var classname = getClassIdentifier( filename )
                    updateMaps[ classname ] = true;
                    if( modules.hasOwnProperty(classname) )
                    {
                        var module = modules[classname];
                        if( time !== module.uid )
                        {
                            if( modules[classname].nonglobal )
                            {
                                delete modules[ module.fullclassname ];
                            }
                        }
                    }
                });

                taskQueues.push( [config,classname,resource, options, callback, this] );
                if( !progress.processing )
                {
                    progress.apply(this, taskQueues.shift() );
                }
            }
        }

    }catch(e)
    {
        callback( e );
    }
}

function progress(config, classname, resource, options, callback, context )
{
    progress.processing = true;

    //重新构建
    if( updateMaps[ classname ]===true )
    {
        complier.rebuild(config, resource ,function(module)
        {
            modules[ module.fullclassname ] = module;
            updateMaps[ classname ] = false;
            progress.processing = false;
            var content = getModuleContent(context,module);
            callback( null, content );
        });
        return;
    }

    complier( config, function( results )
    {
        var module = results[classname];
        dependencies[ classname ]=module.dependencies;

        module.dependencies.forEach(function(module){
            modules[ module.type ] = module;
            if( module.filename ){
                context.addDependency( path.resolve( module.filename ) );
            }
        });

        module.assets.forEach(function(filename){
            if( filename )
            {
                context.addDependency( path.resolve(filename) );
            }
        });

        modules[ classname ] = module.bootstrap;
        var content = getModuleContent(context, module.bootstrap);
        progress.processing = false;
        callback(null, content);
        if( taskQueues.length > 0 )
        {
            progress.apply(context, taskQueues.shift() );
        }
    });
}

function getModuleContent(context, module)
{
    var options = loaderUtils.getOptions(context);
    var config = getConfig(context.resourcePath,options);
    var content = '';
    var file = module.filename || module.path;
    var styles = [];
    var deps = [];
    var hash = {};
    if( module.nonglobal )
    {
        content = module.makeContent["javascript"];

        var styleLoader = options.styleLoader instanceof Array ? options.styleLoader : ["style-loader","css-loader"];

        //将模块中需要的样式文件打包在一起
        if( complier.builder.makeModuleStyleContentExcludeFile(config, module) )
        {
            var filename = `${styleLoader.join("!")}!${path.resolve(file).replace(/\\/g,'\\\\')}?less=${module.fullclassname}`;
            styles.push( filename );
        }

        styles = complier.builder.makeModuleStyleExcludeContent( config, module ).map(function(file){
           return file.replace(/\\/g,'/');
        }).concat( styles );

        //当前模块的所有使用的依赖文件
        if( context.hot )
        {
            hash = complier.Compile.getUseDependentModules(module,'javascript');
            deps = Object.values( hash );
            deps = deps.map(function(m){
                return utils.getRequireIdentifier(config, m);
            });
        }

    }else
    {
        var identifier = getClassIdentifier( file );
        var data = complier.builder.loadSystemModuleContentByName(config, identifier);
        if( context.hot )
        {
            deps = data.deps.map(function(name){
                var m = complier.Maker.getLoaclAndGlobalModuleDescription(name);
                if( m ){
                    hash[ name ] = m;
                    return utils.getRequireIdentifier(config, m);
                }
            })
        }
        content = data ? data.content : '';
    }

    if( styles.length > 0 )
    {
        content+=`\nrequire("`+styles.join(`")\nrequire("`)+'");';
    }

    deps = deps.filter(function(name){return !!name});
    if( deps.length > 0 )
    {
        var hot = path.join(__dirname, "development.hot.js").replace(/\\/g,'/');
        var updateModule = [];
        for(var key in hash )
        {
           var ident = utils.getRequireIdentifier(config, hash[key] )
           updateModule.push( `${key} = require("${ident}");` );
        }

        content+=`\nif(module.hot){
            var hotUpdate = require("${hot}");
            var __reload__ = function(){
                ${updateModule.join("\n")}
            };
            module.hot.accept([\n"${deps.join('",\n"')}"\n], function( name ){
                var m = __webpack_require__(name[0]);
                __reload__();
                hotUpdate( m );
            });
        }`;
    }

    
    return content;
}

module.exports.pitch = function(remainingRequest, precedingRequest, data) 
{
    var resource = this.resourcePath.replace(/\\/g,'/');
    var classname = getClassIdentifier( resource );
    if( updateMaps[ classname ] === true )
    {
        return;
    }

    var options = loaderUtils.getOptions(this);
    var config = getConfig(this.resourcePath,options);
    this.addDependency( this.resourcePath );

    //处理样式内容
    if( this.resourceQuery )
    {
        var query = this.resourceQuery.substr(1).split('=');
        if( query[0] ==='less')
        {
            var style='';
            if( modules.hasOwnProperty( query[1] ) )
            {
                style = complier.builder.makeModuleStyleContentExcludeFile( config, modules[ query[1] ] );
            }else if( dependencies.hasOwnProperty( query[1] ) )
            {
                style = complier.builder.makeLessStyleContent(config, dependencies[ query[1] ] );
            }
            return lessLoader.call(this, style);
        }
    }
   
    if( this.resourcePath.slice(-3) === ".js")
    {
        return getModuleContent(this, complier.builder.loadSystemModuleContentByName(config, classname ) );
    }

    if( modules.hasOwnProperty( classname ) )
    {
        return getModuleContent(this, modules[classname] );
    }

 };