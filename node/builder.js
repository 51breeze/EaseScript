const utils = require('../lib/utils.js');
const globals=['Object','Function','Array','String','Number','EventDispatcher','Event','Boolean','Math',
    'Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','Symbol','console','Request'];

const cg = ['non-writable','non-enumerable','non-configurable'];

/**
 * 获取内置模块的描述信息
 * @param str
 * @param name
 * @returns {{import: Array, describe: {static: {}, proto: {}}}}
 */
function describe( str, name )
{
   // var result = str.match(/@(require|public|private|protected|internal)\s+([^\r\n\;]*)/ig );
    var result = str.match(/@(require)\s+([^\r\n\;]*)/ig );
    var desc={"requirements":[],'describe':{"static":{},"proto":{}}};
    for( var i in result )
    {
        var val = utils.trim(result[i]).replace(/\s+/g,' ');
        var index = val.indexOf(' ');
        var prefix = val.substr(1, index-1).toLowerCase();
        val = val.substr(index+1);
        switch ( prefix )
        {
            case 'require' :
                desc.requirements = desc.requirements.concat( val.replace(/\s+/g,'').split(',') );
            break;
            case 'internal' :
            case 'public' :
            case 'private' :
            case 'protected' :
                val = val.split(' ');
                var prop = val[0];
                var lastIndex = prop.lastIndexOf('.');
                var proto = true;
                if( lastIndex > 0 )
                {
                    proto = prop.indexOf( name+'.prototype.' )===0;
                    prop = prop.substr( lastIndex+1 );
                }
                var obj = proto ? desc.describe.proto : desc.describe.static;
                var info=[];
                if( prefix !== 'public' )info.push('"qualifier":"'+prefix+'"');
                for(var i in cg)
                {
                    if( val.indexOf(cg[i]) > 0 )
                    {
                        switch ( cg[i] )
                        {
                            case 'non-writable' : info.push('"writable":false'); break;
                            case 'non-enumerable' : info.push('"enumerable":false'); break;
                            case 'non-configurable' : info.push('"configurable":false'); break;
                        }
                        break;
                    }
                }
                if( info.length > 0 && prop )obj[ prop ]=JSON.parse('{'+info.join(',')+'}');
            break;
        }
    }
    utils.unique(desc.requirements);
    return desc;
}


var classMap = {
    "document":"Document",
    "window":"Window",
    "Console":"console",
}

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(path , config , localModules, requirements , replacements )
{
    var app_path = utils.getBuildPath(config,"build.application");
    var dir = utils.mkdir( utils.getResolvePath( utils.getResolvePath(path, app_path), config.build_system_path ) );
    var o;
    var namespaceMapValue=[];
    utils.forEach(replacements.NAMESPACE_HASH_MAP,function (value,name) {
        namespaceMapValue.push( "'"+name+"':'"+value+"'" );
    });

    var requires = ['System','Namespace','document','HTMLElement','Node','Element','RouteEvent'].concat( globals.slice(0), requirements );
    var loaded = {"console":true};
    var name;
    while ( name= requires.pop() )
    {
        name = classMap[ name ] || name;
        if( loaded[ name ] === true )
        {
            continue;
        }

        loaded[ name ] = true;
        if( utils.isFileExists(config.root_path+'/node/system/'+name+'.js') )
        {
            var content = utils.getContents( config.root_path+'/node/system/'+name+'.js' );
            if( name==="Namespaces" && namespaceMapValue.length>0 )
            {
                content = content.replace(/var\s+codeMap\s*=\s*\{\.*\}\s*;/,function (a) {
                    return 'var codeMap = {'+namespaceMapValue.join(",\n")+'};';
                });
            }

            //替换系统类的动态常量
            if( name === "System" )
            {
                var regexp = new RegExp("\\{@("+[
                    "ES_BUILD_APPLICATION_NAME",
                    "ES_BUILD_LIBARAY_NAME",
                    "ES_BUILD_SYSTEM_PATH",
                ].join("|")+")\\}","g");
                content = content.replace(regexp,function (a,b) {
                    switch ( b )
                    {
                        case "ES_BUILD_APPLICATION_NAME" :
                            return config.build_application_name;
                            break;
                        case "ES_BUILD_LIBARAY_NAME" :
                            return config.build_libaray_name;
                            break;
                        case "ES_BUILD_SYSTEM_PATH" :
                            return config.build_system_path.replace(/\./g,"\\");
                        break;
                    }
                    return "";
                });
            }

            content = utils.trim( content );
            utils.setContents( dir+"/"+name+'.js', content );
        }
    }

    //生成本地模块
    for (var n in localModules )
    {
        o = localModules[n];
        var file = utils.getResolvePath( app_path , o.fullclassname );
        utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
        utils.setContents( file+'.js', o.makeContent['node'] );
    }

    var bootstrap_dir = utils.getBuildPath(config,"build.bootstrap");
    var webroot_dir = utils.getBuildPath(config,"build.webroot");

    //生成引导文件
    var content = utils.getContents( config.root_path+"/node/bootstrap.js");
    content = replaceContent(content, replacements,config);
    utils.setContents( bootstrap_dir+'/'+replacements["BOOTSTRAP_CLASS_FILE_NAME"],  content );

    //生成入口文件
    content = utils.getContents( config.root_path+"/node/index.js");
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