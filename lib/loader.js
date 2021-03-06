const fs = require("fs");
const complier = require("./index.js");
const Maker = require("./maker.js");
const builder = require("../javascript/builder.js");
const utils = require("./utils.js");
const watch = require("./watch.js");
const path = require("path");
const loaderUtils = require('loader-utils');
const lessLoader = require('less-loader');
const taskQueues = [];
const hotUpdated = {};

var watching = false;
var config = null;
var modules = {};
var server_modules = {};
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
        config = options.es_project_config || findConfigPathByRequest( request );
        if( !config )
        {
            throw new TypeError("config file is not found.");
        }

        if( typeof config === "string"  )
        {
            config = JSON.parse( fs.readFileSync(config).toString() );
        }
        
        config = complier.createConfigure( config );
        config.serverEnable = false;
        config.watching = false;
        config.clean = false;
        config.mode = 3;
        config.module_exports = true;
        config.build_pack = false;
        config.module_suffix = null;
        config.minify = false;
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
        var file = path.resolve( dir,'.esconfig');
        if( fs.existsSync( file ) )
        {
            return file;
        }
        dir = path.dirname( dir );
    }
    return null;
}

var compileServer = ()=>{};
module.exports=function(content, map, meta)
{
    try
    {
        var options =  loaderUtils.getOptions(this);
        var callback = this.async();
        var resource = this.resourcePath.replace(/\\/g,'/');
        var config = getConfig( resource, options );
        var classname =  getClassIdentifier( resource );
        var isSystem = resource.indexOf( systemPath )===0;
        if( isSystem )
        {
            var data = builder.getSystemModule(config, classname,  hotUpdated[ classname ] );
            hotUpdated[ classname ] = false;
            if( data && data.makeContent.javascript )
            {
                callback(null, getModuleContent(this,data) );
            }else{
                callback( new ReferenceError("Not found "+resource ) );
            }

        }else
        {
            if( modules.hasOwnProperty( classname ) && modules[classname].makeContent )
            {
                callback(null, getModuleContent(this,modules[classname]) );
    
            }else
            {
                if( watching === false && options.mode ==="development" )
                {
                    watching = true;
                    this._compiler.hooks.invalid.tap('es-loader',(filename,time)=>{

                        var classname = getClassIdentifier( filename )
                        hotUpdated[ classname ] = true;
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

                    compileServer =( (config,syntax,modules,options)=> (filename)=>{
                        var classname =  getClassIdentifier( filename );
                        complier.single(config,filename, syntax,true,( result )=>{
                            modules[ classname ] = result.module;
                            result.dependencies.forEach(function(module)
                            {
                                if( module.filename )
                                {
                                    watch.start( module.filename, compileServer );
                                }
                            });
                        });
                    } )(config,config.service_provider_syntax,server_modules,options );
                }

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
    if( hotUpdated[ classname ]===true )
    {
        config.bootstrap = resource;
        complier.rebuild(config, resource ,function(results, error)
        {
            hotUpdated[ classname ] = false;
            if( error )
            {
                callback( error );
               
            }else
            {
                results.client.forEach( result=>{
                    const module = result.module;
                    modules[ module.fullclassname ] = module;
                    if( typeof options.bootstrap === "function" )
                    {
                        const mainModule =  dependencies[ module.fullclassname ]
                        if( mainModule )
                        {
                            const newRoutes = builder.getServiceRoutes( [module] );
                            const oldRoutes = mainModule.routes;
                            dependencies[ module.fullclassname ] = result;
                            for(var p in newRoutes )
                            {
                                if( !oldRoutes[p] )
                                {
                                    options.bootstrap(config, Object.entries(dependencies).map( item=>item[1].module ) );
                                    break;
                                }
                            }
                        }
                    }

                    result.dependencies.forEach(function(module)
                    {
                        if( module.filename )
                        {
                            context.addDependency( path.resolve( module.filename ) );
                        }
                    });
    
                    result.assets.forEach(function(filename)
                    {
                        if( filename )
                        {
                            context.addDependency( path.resolve(filename) );
                        }
                    });
                });

                if( options.mode ==="development" )
                {
                    results.server.forEach( result=>{
                        result.dependencies.forEach(function(module)
                        {
                            if( module.filename )
                            {
                                watch.start( module.filename, compileServer );
                            }
                        });
                    });
                }

                callback( null, getModuleContent(context, modules[ classname ], true) );
            }
            progress.processing = false;
            if( taskQueues.length > 0 )
            {
                progress.apply(context, taskQueues.shift() );
            }

        });
        return;
    }

    config.bootstrap = resource;
    complier.build( config, function( results,error )
    {
        if( error )
        {
            callback( error );

        }else
        {
            results.client.forEach(result=>{

                const classname = result.module.fullclassname;
                dependencies[ classname ]=result;
                result.dependencies.forEach(function(module)
                {
                    modules[ module.type ] = module;
                    if( module.filename )
                    {
                        context.addDependency( path.resolve( module.filename ) );
                    }
                });

                result.assets.forEach(function(filename)
                {
                    if( filename )
                    {
                        context.addDependency( path.resolve(filename) );
                    }
                });

                modules[ classname ] = result.module;
                
            });

            if( options.mode ==="development" )
            {
                results.server.forEach( result=>{
                    result.dependencies.concat( result.module ).forEach(function(module)
                    {
                        if( module.filename )
                        {
                            watch.start( module.filename, compileServer );
                        }
                    });
                });
            }

            var content = getModuleContent(context, modules[ classname ] );
            callback(null, content);
        }

        progress.processing = false;
        if( taskQueues.length > 0 )
        {
            progress.apply(context, taskQueues.shift() );
        }
    });
}

const styleImportRegexp = /@import\s+([\'\"])([^\1]+?)\1\s*;?/ig;
function splitStyleContentWithFile( content )
{
    const data={
        content:"",
        files:[]
    };
    if( content )
    {
        data.content = content.replace( styleImportRegexp, (a,b,c)=>{
            c = c.replace(/\\/g,"/");
            if( data.files.indexOf(c) < 0 )
            {
                data.files.push( c ); 
            }
            return '';
        });
    }
    return data;
}

function getModuleContent(context, module, flag )
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

        const styleLoader = options.styleLoader instanceof Array ? options.styleLoader : ["style-loader","css-loader"];
        const styleContent = builder.makeModuleStyleContentExcludeFile(config, module);
        const styleData = splitStyleContentWithFile( styleContent );
        styles = builder.makeModuleStyleExcludeContent( config, module ).map(function(file){
            return file.replace(/\\/g,'/');
        }).concat( styleData.files );

        if( styleData.content )
        {
            var filename = `${styleLoader.join("!")}!${path.resolve(file).replace(/\\/g,'\\\\')}?less=${module.fullclassname}`;
            styles.push( filename );
        }

        //当前模块的所有使用的依赖文件
        if( context.hot )
        {
            if( module.dependentModules && module.dependentModules["javascript"] )
            {
                deps = Object.entries( module.dependentModules["javascript"] ).map( value=> {
                    hash[ value[1] ] =  value[0];
                    return value[0];
                });
            }
        }

    }else
    {
        module = builder.getSystemModule(config,module,flag);
        if( context.hot && module.deps )
        {
            deps = module.deps.map(function(name){
                var m = Maker.getLoaclAndGlobalModuleDescription(name);
                if( m ){
                    hash[ name ] = utils.getRequireIdentifier(config, m);
                    return hash[ name ];
                }
            });
        }
        content = module && module.makeContent["javascript"] || '';
    }

    if( styles.length > 0 )
    {
        content+=`\nrequire("`+styles.join(`")\nrequire("`)+'");';
    }

    deps = deps.filter(function(name){return !!name});
    if( deps.length > 0 )
    {
        var updateModule = [];
        for(var key in hash )
        {
           updateModule.push( `${key} = require("${hash[key]}");` );
        }

        var relaod = '';
        if( module.isApplication )
        {
            relaod = `if( !e.defaultPrevented && location ){
               location.reload();
            }`;
        }

        content+=`\nif(module.hot){
            module.hot.accept([\n"${deps.join('",\n"')}"\n], function( __$deps ){
                var _System = require("system/System.js");
                var _Event = require("system/Event.js");
                if( _System.getGlobalEvent().hasEventListener("DEVELOPMENT_HOT_UPDATE") )
                {
                    ${updateModule.join("\n")}\n
                    var e = new _Event( "DEVELOPMENT_HOT_UPDATE" );
                    e.hotUpdateModule= __webpack_require__( __$deps[0] );
                    _System.getGlobalEvent().dispatchEvent( e );
                    ${relaod}
                }else
                {
                    console.log("'DEVELOPMENT_HOT_UPDATE' is not binding.");
                }
            });
        }`;
    }

    return content;
}

module.exports.pitch = function(remainingRequest, precedingRequest, data) 
{
    var options = loaderUtils.getOptions(this);
    var config = getConfig(this.resourcePath,options);
    var resource = this.resourcePath.replace(/\\/g,'/');
    var classname = getClassIdentifier( resource );
    if( hotUpdated[ classname ] === true )
    {
        return;
    }

    this.addDependency( this.resourcePath );

    //处理在皮肤中的内容样式
    if( this.resourceQuery )
    {
        var query = this.resourceQuery.substr(1).split('=');
        if( query[0] ==='less')
        {
            var style='';
            if( modules.hasOwnProperty( query[1] ) )
            {
                style = builder.makeModuleStyleContentExcludeFile( config, modules[ query[1] ] );
            }
            const styleData = splitStyleContentWithFile( style );
            return styleData.content ? lessLoader.call(this, styleData.content) : '';
        }
    }
   
    if( modules.hasOwnProperty( classname ) && modules[classname].makeContent )
    {
        return getModuleContent(this, modules[classname] );
    }

 };