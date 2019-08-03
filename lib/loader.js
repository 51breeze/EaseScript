const fs = require("fs");
const complier = require("./index.js");
const path = require("path");

var config = null;
var modules = {};
var systemPath = null;
var corePath = null;
var workspacePath = null;

function getClassIdentifier( request )
{
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

function getConfig(request, loader)
{
    if( config ===null )
    {
        config = (loader.options && loader.options.config) || findConfigPathByRequest( request );
        if( !config )
        {
            throw new TypeError("config file is not found.");
        }

        if( typeof config === "string"  )
        {
            config = JSON.parse( fs.readFileSync(config).toString() );
        }
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


module.exports=function(content, map, meta)
{
    try
    {
        var callback = this.async();
        var loader = this._module.getCurrentLoader( this );
        var config = getConfig( loader );
        var resource = this.resourcePath.replace(/\\/g,'/');

        config.bootstrap = resource;
        config.serverEnable = false;
        config.watching = false;
        config.clean = false;
        config.mode = 3;
        config.module_exports = true;

        var classname =  getClassIdentifier( resource );
        var isSystem = resource.indexOf( systemPath )===0;

        console.log(  this.resourcePath,"++++++++++++" )


       // this.addDependency("system1239999999999999999.js.es");

        // this.loadModule("@system1239999999999999999.js.es",function(){

        //       console.log(  arguments )

        // });



        if( isSystem || path.extname( resource ) !== config.suffix )
        {
            callback(null, content);

        }else
        {
            if( modules[classname] )
            {
                callback(null, modules[classname] );
    
            }else
            {
                complier( config, function( results , assets )
                {
                    Object.assign(modules,results);

                    var content = modules[classname];
                    if( assets instanceof Array )
                    {
                        assets.map( function(item)
                        {
                            let file = item.name+"."+item.type;
                            modules[ file ] = item.content;
                            content+="\nrequire('"+resource+"?include=index.css');";
                        });
                    }

                  //  console.log( content );

                    callback(null, content );

                });
            }
        }

    }catch(e)
    {
        callback( e );
    }
}


module.exports.pitch = function(remainingRequest, precedingRequest, data) 
{

    var loader = this._module.getCurrentLoader( this );
    var config = getConfig( remainingRequest, loader );
    var resource = remainingRequest.replace(/\\/g,'/');
    var classname = getClassIdentifier( resource );
    if( modules.hasOwnProperty(classname) )
    {
        
        return modules[ classname ];
    }
   
 };