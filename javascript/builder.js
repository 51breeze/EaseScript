const utils = require('../lib/utils.js');
const globals=utils.globals;
const rootPath =  utils.getResolvePath( __dirname );
const path = require("path");

/**
 *  已加载的模块
 */
var loaded = {'HTMLElement':true,'Node':true};

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

const cg = ['non-writable','non-enumerable','non-configurable'];

/**
 * 获取内置模块的描述信息
 * @param str
 * @param name
 * @returns {{import: Array, describe: {static: {}, proto: {}}}}
 */
function describe( str, name )
{
    var result = str.match(/@(require|public|private|protected|internal)\s+([^\r\n\;]*)/ig );
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
function include(contents, name , filepath, fix, libs, callback )
{
    name = mapname[name] || name;
    if( loaded[name] === true )return;
    loaded[name]=true;
    if( !filepath )
    {
        filepath = rootPath + '/system/' + name + '.js';
        //if( !utils.isFileExists(filepath) )filepath = rootPath + '/components/' + name + '.js';
    }

    //加载的模块有依赖的第三方库
    if( libs && libs[name] )
    {
        vendorContents.push( utils.getContents( rootPath+'/vendor/'+libs[name]) );
    }

    if( utils.isFileExists(filepath) )
    {
        var str = utils.getContents( filepath );
        if( callback && typeof callback === "function" )
        {
            str = callback( str );
        }

        var desc = describe( str, name);
        if( desc.requirements.indexOf('System') < 0 )desc.requirements.unshift('System');
        var map = desc.requirements.map(function (val) {
            if( val === 'System' )return 'System';
            if( val==='Internal' )return 'Internal';
            if( val.substr(0,9) === 'Internal.')return val;
            if(val.charAt(0)!=='$')include(contents,val, null, fix,libs);
            return 'System.'+val;
        });

        var module=[];
        module.push('(function('+desc.requirements.map(function(a){return a.substr(a.lastIndexOf('.')+1);}).join(',')+'){\n');
        module.push( str );
        module.push('\n');
        //加载对应模块的兼容策略文件
        if( fix && fix[name] )for( var f in fix[name] )
        {
            module.push( utils.getContents( fix[name][f] ) );
        }
        module.push('\n}('+map.join(',')+'));\n');
        str = module.join('');

        if( !isEmpty( desc.describe.static ) ){
            if( !descriptions[name] )descriptions[name]={};
            if(!descriptions[name].static)descriptions[name].static={};
            utils.merge( descriptions[name].static, desc.describe.static);
        }
        if( !isEmpty( desc.describe.proto ) )
        {
            if( !descriptions[name] )descriptions[name]={};
            if(!descriptions[name].proto)descriptions[name].proto={};
            utils.merge( descriptions[name].proto, desc.describe.proto);
        }

        contents.push( str );
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        contents.push('System.' + name + '=$' + name + ';\n');
        return true;
    }
    throw new Error(name+' does exists ('+filepath+')');
}



/**
 * 获取指定的文件模块
 * @param filepath
 */
function include_module(contents, name , filepath, fix, libs, callback )
{
    var orign = name;
    name = mapname[name] || name;
    if( loaded[name] === true )return;
    loaded[name]=true;
    if( !filepath )
    {
        filepath = rootPath + '/system/' + name + '.js';
        //if( !utils.isFileExists(filepath) )filepath = rootPath + '/components/' + name + '.js';
    }

    //加载的模块有依赖的第三方库
    if( libs && libs[name] )
    {
        contents[ name ]= utils.getContents( rootPath+'/vendor/'+libs[name] ) +"\nmodule.exports = "+name+";\n";
    }

    if( utils.isFileExists(filepath) )
    {
        var str = utils.getContents( filepath );
        if( callback && typeof callback === "function" )
        {
            str = callback( str );
        }

        str = str.replace(/\=\s*require\s*\(\s*([\"\'])(.*?)\1\s*\)/g,function(a,b,c){
             var info = path.parse(c);
             var filepath = path.resolve(rootPath,'system', c).replace(/\\/g,'/');
             include_module(contents, info.name , filepath, fix, libs, callback )
             return '=require("'+filepath+'")';
        });

        //加载对应模块的兼容策略文件
        if( fix && fix[name] )
        {
            str+='\n';
            for( var f in fix[name] )
            {
                str+= utils.getContents( fix[name][f] );
            }
        }
       
        if( globals.indexOf( orign ) >=0 )
        {
            str = "(function($"+orign+"){\n"+str+"\nreturn "+name+";\n}("+orign+"));";
        }
        contents[ name ]=str;
        return true;

    }else if( globals.indexOf(name) >=0 )
    {
        //contents.push('System.' + name + '=' + name + ';\n');
        return true;
    }
    throw new Error(name+' does exists ('+filepath+')');
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

const exclude = {
    'int':true,
    'uint':true,
    'Integer':true,
    'float':true,
    'Float':true,
    'double':true,
    'Double':true,
    'arguments':true,
    "NodeList":true,
    'Class':true,
    'Interface':true,
};

/**
 * 加载系统模板所有需要的类
 * @param config
 * @returns {string}
 */
function loadRequireSystemModuleContents(config,requirements)
{
    loaded = {'HTMLElement':true,'Node':true};
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
        if(is)utils.merge(libs, library[prop] );
    }

    /**
     * 引用全局对象模块
     */
    var requires = ['System','Class','Namespace','Interface','ListIterator','EventDispatcher','Event','Locator'].concat( globals.slice(0) );
    if( requirements )
    {
        for ( var p in requirements )
        {
            var name = requirements[p];
            if( requires.indexOf( name ) < 0 && ( globals.hasOwnProperty( name ) || config.globals.hasOwnProperty(name) ) )
            {
                if( exclude[p] !==true )
                {
                    requires.push( name );
                }
            }
        }
    }

    requires = requires.filter(function (a) {
        if( config.globals.hasOwnProperty(a) && config.globals[a].notLoadFile===true)
        {
            return false;
        }
        return exclude[a] !== true;
    });

    for(var prop in requires)
    {
        include_module(contents, requires[prop], null, fix, libs );
    }

    return contents;

}




/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(main, config , code, requirements , replacements)
{
    loaded = {'HTMLElement':true,'Node':true};
    var contents = [];
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
        if(is)utils.merge(libs, library[prop] );
    }

    /**
     * 引用全局对象模块
     */
    var requires = ['System','Class','Namespace','Interface','ListIterator','EventDispatcher','Event','Locator'].concat( globals.slice(0) );
    if( requirements )
    {
        for ( var p in requirements )
        {
            var name = requirements[p];
            if( requires.indexOf( name ) < 0 && ( globals.hasOwnProperty( name ) || config.globals.hasOwnProperty(name) ) )
            {
                if( exclude[p] !==true )
                {
                    requires.push( name );
                }
            }
        }
    }

    requires = requires.filter(function (a) {
        if( config.globals.hasOwnProperty(a) && config.globals[a].notLoadFile===true)
        {
            return false;
        }
        return exclude[a] !== true;
    });

    for(var prop in requires)
    {
        include(contents, requires[prop], null, fix, libs, replacements[ requires[prop].toLowerCase() ] );
    }

    //模块定义器
    //include(contents, 'define' , rootPath+'/define.js', fix , libs);

     //模块描述
    //contents.unshift('var descriptions = '+JSON.stringify(descriptions)+';\n');

    //解析内部访问权限
    contents=parseInternal( contents.join(''), descriptions );

    //合并依赖库
    contents=vendorContents.join(';\n')+contents;

    /**
     * 内置系统对象
     */
    var g = globals.map(function(val) {
         if( val==='JSON' || val==='Reflect' || val==='console' || val==='Symbol')return 'typeof '+val+'==="undefined"?null:'+val;
         return val;
    });

    var index = requires.indexOf('Symbol');
    if( index > 0 )requires.splice(index,1);

    var internal = [
        'Internal.environment='+config.mode+';',
        'Internal.ORIGIN_SYNTAX = "[CODE[ORIGIN_SYNTAX]]";',
        'Internal.URL_PATH_NAME = "[CODE[STATIC_URL_PATH_NAME]]";',
    ];
    for (var scc in  config.system_core_class )
    {
        internal.push("Internal."+scc+'="'+config.system_core_class[scc]+'";' );
    }
   
    internal.push( utils.getContents( rootPath+'/internal.js' ) );
    
    internal = replaceContent(internal.join("\n"), replacements, config);

    var run='';
    if( config.mode==1 ){
        run = '(function(System,Internal,Object,Class,Reflect){\n'+ utils.getContents( rootPath+'/run-dev.js' )+'\n}(System,Internal,System.Object,System.Class,System.Reflect));';
    }

    //系统引导器
    var bootstrap = config.build_mode ==="app" ? rootPath+'/bootstrap.js' : rootPath+'/boot.js';
    bootstrap = utils.getContents( bootstrap );
    bootstrap = replaceContent(bootstrap, replacements, config);

    //开发业务代码
    var business = ['(function('+requires.join(',')+'){',
        'Internal.initiator('+code+');',
        bootstrap,
        '})('+requires.map(function (a){
            a = mapname[a] || a;
            if(a==='System')return a;
            return 'System.'+a;
        }).join(',')+');\n'];

    //框架代码
    var framework = [
        '(function(System,Internal,undefined){',
            '"use strict";',
            internal,
            //系统全局模块域
            '(function(System,$'+globals.join(',$')+'){',
            contents,
            run,
            '}(System,' + g.join(',') + '));',
            business.join('\n'),
        '}({},{}));'
    ];
    return framework.join('\n');
}

/**
 * 组合单个应用文件
 * @param content
 * @param requirements
 * @return {*|string}
 */
function segment( config,content, requirements, handle, classname )
{
    var requires = ['System','Class','Namespace','Interface','ListIterator','EventDispatcher','Event'].concat( globals.slice(0) );
    for (var p in requirements )
    {
        if( requires.indexOf( requirements[p] ) < 0 )
        {
            requires.push( requirements[p] );
        }
    }

    requires = requires.filter(function (a) 
    {
        if( config.globals.hasOwnProperty(a) && config.globals[a].notLoadFile===true)
        {
            return false;
        }
        return exclude[a] !== true;
    });

    return [
        '(function(installer,undefined){',
        '"use strict";',
        'installer("'+classname+'",function(Internal,System){',
        '(function('+requires.join(',')+'){',
        '"use strict";',
        'Internal.register('+content+');',
        '})('+requires.map(function (a){
            a = mapname[a] || a;
            if(a==='System')return a;
            return 'System.'+a;
        }).join(',')+');',
        '});',
        '}( window["'+handle+'"]["installer"] ));',
     ].join('\n');
}
builder.segment = segment;


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
builder.getBootstrapView = getBootstrapView;

function replaceContent(content, data, config)
{
    data = data||{};
    content = content.replace(/\[CODE\[(.*?)\]\]/ig, function (a, b) {
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

builder.makeServiceRouteList = makeServiceRouteList;
builder.loadRequireSystemModuleContents = loadRequireSystemModuleContents;
module.exports = builder;