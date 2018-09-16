const utils = require('../lib/utils.js');
const globals=['Object','Function','Array','String','Number','EventDispatcher','Event','Boolean','Math',
    'Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','Symbol','console','Request'];
var contents=[];
const rootPath =  utils.getResolvePath( __dirname );

/**
 *  已加载的模块
 */
const loaded = {};

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
        var info = utils.getFilenameByPath(path).split('-', 2);
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

const descriptions={};
const mapname={'window':'Window','document':'Document','console':'Console'};
const vendorContents=[];

/**
 * 获取指定的文件模块
 * @param filepath
 */
function include(requires, name , rootpath , config )
{
    var file = rootpath+'/php/system/'+name+'.php'
    if( utils.isFileExists(file) )
    {
        var content = utils.getContents( file );
        var desc = describe( content, "" );
        desc.requirements.forEach(function (name) {
            if( requires.indexOf( name )<0 )
            {
                requires.push( name );
                include(requires, name , rootpath , config );
            }
        });

        /*var usename = content.match( /\buse\s+([\\\w\s]+)\b/ig );
        if( usename )
        {
            for ( var u in usename)
            {
                var _n = usename[u].replace(/^use\s+/i,'');
                _n = _n.substr( _n.lastIndexOf('\\')+1 );
                if( requires.indexOf( _n )<0 )
                {
                    requires.push( _n );
                    include(requires, _n , rootpath , config );
                }
            }
        }*/
    }
}

/**
 * 解析内部属性
 * @param str
 * @param descriptions
 */
function parseInternal( str , descriptions )
{
    for( var m  in descriptions )
    {
        var desc = descriptions[m];
        str = parse(str, desc.static, m );
        str = parse(str, desc.proto, m+'.prototype' );
    }
    return str;
}

function parse( str, desc , prefix )
{
    if(desc)for( var p in desc )
    {
        if( desc[p].qualifier === 'internal' )
        {
            str = str.replace(new RegExp('([^$])\\b'+prefix + '\\.' + p+'\\b', 'g'), function (a,b,c)
            {
                return b+'Internal["' + prefix + '.' + p + '"]';
            });
        }
    }
    str = str.replace('System.Internal[','Internal[');
    return str;
}

/**
 * 是否为空对象
 * @param obj
 * @returns {boolean}
 */
function isEmpty( obj ) {
    for(var i in obj )return false;
    return true;
}

/**
 * 在特定的版本下需要加载的库文件
 */
const library={
    'ie-9':{'Element':'Sizzle.js'}
};

/**
 * 执行上下文
 * @returns {Function}
 */
function Context( name )
{
    var current = function(name){
        var c = current.children.hasOwnProperty(name) ? current.children : null;
        if( !c )
        {
            c= current.children[name] = Context(name);
            c.parent = current;
            c.root = current.root || current;
        }
        return c;
    };
    current.label = name;
    current.parent = null;
    current.scope = {};
    current.children={};
    current.get=function( className , refContext )
    {
        refContext = refContext || current;
        if( refContext.scope.hasOwnProperty(className) )
        {
            return refContext.scope[className];
        }
        return refContext.scope[className] = new Class();
    };
    return current;
}

function createSystemClass()
{
    
}

var classMap = {
    "Namespace":"Namespaces",
    "document":"Document",
    "window":"Window",
    "console":"Console",
    "Object":"BaseObject",
}

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(path , config , localModules, requirements , namespaceMap, replaces )
{
    var app_path = utils.getBuildPath(config,"build.application");
    var dir = utils.mkdir( utils.getResolvePath( utils.getResolvePath(path, app_path), "system" ) );
    var o;
    var namespaceMapValue=[];
    for ( var n in namespaceMap )
    {
        namespaceMapValue.push( "'"+n+"'=>'"+namespaceMap[n]+"'" );
    }

    var exclude = {
        'Function':true,
        'Array':true,
        'Boolean':true,
        'Number':true,
        'Math':true,
        'int':true,
        'uint':true,
        'Integer':true,
        'Float':true,
        'float':true,
        'double':true,
        'Double':true,
        'arguments':true,
    };

    var requires = ['System','Namespace','document','window','HTMLElement','Node','Element'].concat( globals.slice(0), requirements );
    var loaded = {};
    var name;
    while ( name= requires.pop() )
    {
        name = classMap[ name ] || name;
        if( loaded[ name ] === true )
        {
            continue;
        }
        loaded[ name ] = true;
        if( utils.isFileExists(config.root_path+'/php/system/'+name+'.php') )
        {
            var content = utils.getContents( config.root_path+'/php/system/'+name+'.php' );
            if( name==="Namespaces" && namespaceMapValue.length>0 )
            {
                content = content.replace(/private\s+static\s+\$map\s*=\s*array\(\.*\)\s*;/,function (a) {
                    return 'private static $map = array('+namespaceMapValue.join(",\n")+');';
                });
            }

            var _require = describe(content,"");
            _require = _require.requirements.filter(function (name) {
                 return !exclude[ name ];
            });

            _require.forEach(function (name) {
                if( !loaded[ name ] ){
                    requires.push( name );
                }
            });
            content = utils.trim( content );
            utils.setContents( dir+"/"+name+'.php', content );
        }
    }

    //生成本地模块
    for (var n in localModules )
    {
        o = localModules[n];
        var file = utils.getResolvePath( app_path , o.fullclassname );
        utils.mkdir( file.substr(0, file.lastIndexOf("/") ) );
        utils.setContents( file+'.php', o.makeContent['php'] );
    }

    //生成引导文件
    dir = utils.mkdir( utils.getResolvePath(app_path,"bootstrap") );
    var content = utils.getContents( config.root_path+"/php/bootstrap.php");
    if( replaces )
    {
        content = content.replace(/([\s\t]+)?\[CODE\[(.*?)\]\];/ig, function (a, b, c) {
              switch (c.toLowerCase())
              {
                  case "service.bind" :
                      return serviceRegister( replaces["service.bind"]||{} , b );
                  break;
              }
              return "";
        });
    }
    utils.setContents( dir+"/index.php",  content );
}

function serviceRegister( serviceProvider, tab )
{
    var items = [];
    utils.forEach(serviceProvider,function (item) {
        items.push( '\\es\\core\\Service::bind("'+item.bind+'","'+item.provider+'","'+item.method+'");' );
    });
    return tab+items.join("\n"+tab.replace(/\r\n/g,"") );
}


module.exports = builder;