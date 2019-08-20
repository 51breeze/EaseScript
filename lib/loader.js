const fs = require("fs");
const complier = require("./index.js");
const path = require("path");
const loaderUtils = require('loader-utils');
const lessLoader = require('less-loader');

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

function getContentByIdentifier( config, identifier )
{
    if( modules.hasOwnProperty( identifier ) )
    {
        if( modules[ identifier ].nonglobal )
        {
            return modules[ identifier ].makeContent["javascript"];
        }
    }
    var data = complier.builder.loadSystemModuleContentByName(config, identifier);
    return data ? data.content : '';
}

const taskQueues = [];

module.exports=function(content, map, meta)
{
    try
    {
        var options =  loaderUtils.getOptions(this);
        var callback = this.async();
        var resource = this.resourcePath.replace(/\\/g,'/');
        var config = getConfig( resource, options );

        config.bootstrap = resource;
        config.serverEnable = false;
        config.watching = false;
        config.clean = false;
        config.mode = 3;
        config.module_exports = true;

        var classname =  getClassIdentifier( resource );
        var isSystem = resource.indexOf( systemPath )===0;

        if( isSystem || path.extname( resource ) !== config.suffix )
        {
            callback(null, content);

        }else
        {
           

            if( modules[classname] )
            {
                callback(null, modules[classname].makeContent["javascript"] );
    
            }else
            {
                this._compiler.hooks.invalid.tap('es-loader',function(filename,time)
                {
                    var classname = getClassIdentifier( filename )
                    if( modules.hasOwnProperty(classname) )
                    {
                        var module = modules[classname];
                        if( time !== module.uid )
                        {
                            if( modules[classname].nonglobal )
                            {
                                delete modules[ module.fullclassname ];
                                complier.rebuild(config, filename ,function(module)
                                {
                                    modules[ module.fullclassname ] = module;
                                });
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

const fileStyles = [];

function progress(config, classname, resource, options, callback, context )
{
    progress.processing = true;
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
        var content = module.bootstrap.makeContent["javascript"];

        if( module.bootstrap.isApplication )
        {
            if( options._initialization !== true )
            {
                 options._initialization = true;

                 if( !(options.styleLoader instanceof Array) )
                 {
                     options.styleLoader=[];
                 }

                 if( !options.globalVars ||  typeof options.globalVars !== "object" )
                 {
                     options.globalVars={};
                 }

                 if( !(options.paths instanceof Array) )
                 {
                     options.paths=[ path.resolve( config.system_lib_path,'style'), config.workspace ];
                 }

                 var vars = complier.builder.getThemeConfig( config );
                 Object.assign(options.globalVars, vars );

                 ['css-loader'].forEach(function(loader){

                    if( options.styleLoader.indexOf( loader ) < 0)
                    {
                        options.styleLoader.push( loader );
                    }

                 });
            }

            var cssfile = `${options.styleLoader.join('!')}!${resource}?less=${classname}`;
            if( fileStyles.indexOf(cssfile) < 0  )
            {
                fileStyles.push( cssfile );
            }
            content+=`\nrequire("${cssfile}");`;
        }

        callback(null, content);

        if( taskQueues.length > 0 )
        {
            progress.processing = false;
            progress.apply(context, taskQueues.shift() );
        }
    });
}

module.exports.pitch = function(remainingRequest, precedingRequest, data) 
{
    var options = loaderUtils.getOptions(this);
    var config = getConfig(this.resourcePath,options);
    this.addDependency( this.resourcePath );

    if( this.resourceQuery )
    {
        var query = this.resourceQuery.substr(1).split('=');
        if( query[0] ==='less')
        {
           if( dependencies.hasOwnProperty( query[1] ) )
           {
               var style = complier.builder.makeLessStyleContent(config, dependencies[ query[1] ] );
               lessLoader.call(this, style);
               return '';
           }
        }
    }
   
    var resource = this.resourcePath.replace(/\\/g,'/');
    var classname = getClassIdentifier( resource );

    if( this.resourcePath.slice(-3) === ".js")
    {
        var content = getContentByIdentifier(config, classname );
        if( content )
        {
            return content;
        }
    }

    if( modules.hasOwnProperty( classname ) )
    {
        return modules[classname].makeContent["javascript"];
    }
   
 };