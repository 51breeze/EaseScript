const fs = require("fs");
const complier = require("./index.js");
const path = require("path");

function getLoader(loaders)
{
   for( var i in loaders)
   {
      if( loaders[i].path === __filename )
      {
         return loaders[i];
      }
   }
   return null;
}

function getClassName( config )
{
    var suffix  = path.extname( this.resourcePath );
    var resource = this.resourcePath.replace(/\\/g,'/')
    var lib_core = config.system_lib_path;
    var lib_system = config.system_lib_path;
  
    if( resource.indexOf( config.workspace+'/' )===0 )
    {
        resource = path.relative( config.workspace, resource )
    }else if( resource.indexOf( lib_core+'es/' )===0 )
    {
        resource = path.relative( lib_core, resource )
    }else if( resource.indexOf( lib_system+'javascript/' )===0 )
    {
        resource = path.relative( lib_system+'javascript/system', resource )
    }
    return resource.replace(/\\/g,'.').slice(0, -suffix.length );
}

function getConfig( loader )
{
    if( config )
    {
        return config;
    }

    if( loader.options && loader.options.config )
    {
        if( typeof loader.options.config === "string" && fs.existsSync(loader.options.config)  )
        {
            config = JSON.parse( fs.readFileSync(loader.options.config).toString() );
        }

    }else
    {
        config = complier.getConfigure({module_exports:true,project_path:"./test",clean:false});
    }
    return config;
}


var config = null;
var modules = {};

module.exports=function(content, map, meta)
{
   var callback = this.async();
   var loader = getLoader( this.loaders );
   var config = getConfig( loader );
   config.bootstrap = this.resourcePath;
   config.serverEnable = false;
   config.watching = false;
   config.clean = false;
   config.mode = 3;

   var classname =  getClassName.call(this, config );


  if( modules[classname] )
  {
      //console.log(  classname )
      callback(null, modules[classname] );

  }else
  {
      
      try{
        complier( config, function( results ){

            Object.assign(modules,results);

            // console.log( modules.IndexApplication );

           // callback(null, modules );

            //console.log( modules.System  );
            // process.exit();

            callback(null, modules[classname] );
        });

    }catch(e){
        console.log(e)
    }
 }

   
}


module.exports.pitch = function(remainingRequest, precedingRequest, data) 
{
    var loader = getLoader( this.loaders );
    var config = getConfig( loader );
    var classname =  getClassName.call(this, config );

    console.log( classname )

    if( modules.hasOwnProperty(classname) )
    {

      //  console.log( classname, !!modules[ classname ] );
       
        return modules[ classname ];
    }

    // console.log( remainingRequest, precedingRequest, data, "====pitch==" );
  
    // return "module.exports = require(" + JSON.stringify("-!" + remainingRequest) + ");";
   
 };