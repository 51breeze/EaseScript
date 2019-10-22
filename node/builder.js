const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils.js');
const globals=utils.globals;
const rootPath =  utils.getResolvePath( __dirname );

/**
 * 已经构建的系统模块
 */
const makedSystemModules={};

const excludeMap={
    "arguments":true,
    "Function":true,
    "Object":true,
    "Symbol":true,
    "Error":true,
};

/**
 * 获取指定的文件模块
 * @param filepath
 */
function include(contents, name , filepath, config )
{
    name = utils.getGlobalTypeMap(name)
    if( makedSystemModules[ name ] )
    {
        contents[ name ] = makedSystemModules[ name ];
        return;
    }

    makedSystemModules[ name ] = {};

    if( excludeMap[ name ] ||  utils.excludeLoadSystemFile( name ) || ( config.globals.hasOwnProperty(name) && config.globals[name].notLoadFile===true ) )
    {
        return;
    }

    if( !filepath )
    {
        filepath = rootPath + '/system/' + name + '.js';
    }

    var str = '';

    if( fs.existsSync( filepath ) )
    {     
        var dependencies = [];
        str += utils.getContents( filepath );
        str = str.replace(/\=\s*require\s*\(\s*([\"\'])(.*?)\1\s*\)/g,function(a,b,c){

             var info = path.parse(c);
             include(contents, info.name , null, config );
             dependencies.push( info.name );
             return '=require("'+utils.getRequireIdentifier( config, config.globals[ info.name ] || {type:info.name}, '.js' )+'")';
        });

        if( name ==="Internal" )
        {
            str = str.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {
                switch(b){
                    case "ITERATOR_INTERFACE" :
                        return config.iterator_interface;
                }
                return '';
            });
        }

        makedSystemModules[ name ].content = str;
        makedSystemModules[ name ].path = filepath;
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
function loadRequireSystemModuleContents(config,requirements,flag)
{
    var contents = {};
    for(var prop in requirements)
    {
        if( flag === true )
        {
            makedSystemModules[ requirements[prop] ] = undefined;
        }
        include(contents, requirements[prop], null, config );
    }
    return contents;

}

/**
 * 加载系统模块内容
 * @param {*} config 
 * @param {*} name 
 */
function loadSystemModuleContentByName(config,name,flag)
{
   name =  utils.getGlobalTypeMap( name );
   if( !makedSystemModules[name] || flag===true )
   {
       loadRequireSystemModuleContents(config,[name], flag );
   }
   return makedSystemModules[name];
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
   
    const app_path = utils.getBuildPath(config,"build.application");
    const app_system_path = utils.mkdir( utils.getResolvePath( app_path,  config.build_system_path ) );
    const hash = {};
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
        var file = path.join(app_system_path,name+suffix);
        if( !hash[file] )
        {
            var data = loadSystemModuleFactory( name );
            if( data && data.content )
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
            var content = localModule.makeContent ? localModule.makeContent[ 'node' ] : '';
            if ( content )
            {
                var file = utils.getResolvePath( app_path  , localModule.fullclassname );
                utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
                emitFile( path.join(file+suffix), content);
            }

        }else if( localModule.type )
        {
            if( localModule.isImportMetatype )
            {
                if( localModule.path )
                {
                    if( localModule.path.replace(/\\/g,'/').indexOf(config.project.path.replace(/\\/g,'/') )===0 )
                    {
                        var file = path.join(app_path,path.relative(config.project.path, localModule.path));
                        utils.mkdir( path.dirname(file) );
                        utils.copyfile( localModule.path, file );
                    }else{
                        var info = path.parse(localModule.path);
                        utils.copyfile( localModule.path, path.join(app_path,info.name+info.ext));
                    }
                }

            }else
            {
               emitSystemFile( localModule.type );
            }
        }
    }
}

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(config, localModules,  replacements )
{
    
    outputFiles( config,  localModules , ".js");

    const bootstrap_dir = utils.getBuildPath(config,"build.bootstrap");
    const webroot_dir = utils.getBuildPath(config,"build.webroot");

    //生成引导文件
    var content = utils.getContents( path.join(rootPath,"bootstrap.js") );
    content = replaceContent(content, replacements, config);
    utils.setContents( bootstrap_dir+'/bootstrap.js',  content );

    //生成入口文件
    content = utils.getContents( path.join(rootPath,"index.js") );
    content = replaceContent(content, replacements, config);
    utils.setContents( webroot_dir+"/index.js",  content );
}

function replaceContent(content, data, config)
{
    data = data||{};
    content = content.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {

        var requireex = b.match(/^REQUIRE_IDENTIFIER\((.*?)\)$/i);
        if( requireex  )
        {
            var m = config.globals[ requireex[1] ];
            if( !m && requireex[1] ==="Internal" ){
                m = {
                    type:requireex[1]
                };
            }
            return utils.getRequireIdentifier(config, m || {type:requireex[1]} , m ? '.js' : '.es' )
        }

        switch ( b )
        {
            case "SERVICE_ROUTE_LIST" :
                return makeServiceRouteList( data["SERVICE_ROUTE_LIST"]||{});
            break;
        }
        return typeof data[ b ] !== "undefined" ? data[ b ] : "null";
    });
    return content;
}

function makeServiceRouteList( serviceRouteList )
{
    var items = {};
    utils.forEach(serviceRouteList,function (item) {
        var obj = items[ item.method ] || (items[ item.method ] = []);
        obj.push("\t\t'"+item.alias+"':'"+item.provider+"'");
    });

    var bind=[];
    utils.forEach(items,function (item,method) {
        bind.push( "\n\t'"+method+"':{\n"+item.join(",\n")+'\n\t}' );
    });
    return '{' + bind.join(",") +'\n}';
}

module.exports = builder;