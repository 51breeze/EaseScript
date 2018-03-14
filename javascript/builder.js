const utils = require('../lib/utils.js');
const globals=['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','SyntaxError','JSON','Reflect','Symbol','console'];
var contents=[];
const rootPath =  utils.getResolvePath( __dirname );
/**
 *  已加载的模块
 */
const loaded = {'HTMLElement':true,'Node':true};

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

/**
 * 合并代码
 * @param config
 * @returns {string}
 */
function builder(config , code, requirements , replacements )
{
    var fix = polyfill( config );
    
    /**
     * 需要支持的第三方库文件
     */
    var libs={};
    for(var prop in library)
    {
        var is=config.compat_version==='*' || prop==='*';
        var info = prop.split('-', 1);
        if( !is && config.compat_version && typeof config.compat_version === 'object' && config.compat_version.hasOwnProperty( info[0] ) )
        {
            is = parseFloat( info[1] ) > parseFloat( config.compat_version[ info[0] ] );
        }
        if(is)utils.merge(libs, library[prop] );
    }

    /**
     * 引用全局对象模块
     */
    var requires = ['System','Class','Namespace','Interface','Iterator','EventDispatcher','Event'].concat( globals.slice(0) );
    if( requirements )
    {
        for ( var p in requirements )
        {
            if( requirements[p]===true && requires.indexOf( p ) < 0 && ( globals.hasOwnProperty( p ) || config.globals.hasOwnProperty(p) ) )
            {
                if( p !== "arguments" )
                {
                    requires.push( p );
                }
            }
        }
    }

    for(var prop in requires)
    {
        include(contents, requires[prop], null, fix, libs, replacements[ requires[prop].toLowerCase()] );
    }

    //模块定义器
    include(contents, 'define' , rootPath+'/define.js', fix , libs);

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

    var index = requires.indexOf('console');
    if( index > 0 )requires.splice(index,1);
    index = requires.indexOf('Symbol');
    if( index > 0 )requires.splice(index,1);

    var internal = [];
    for (var scc in  config.system_core_class )
    {
        internal.push("Internal."+scc+"='"+config.system_core_class[scc]+"';" );
    }
    if( config.mode==1  )
    {
        internal.push( utils.getContents( rootPath+'/internal.js' ) );
    }
    if( internal.length > 0 )
    {
        internal='(function(System,Internal,environment){\n'+ internal.join('\n') + '\n}(System,Internal,'+config.mode+'));'
    }

    var run='';
    if( config.mode==1 ){
        run = '(function(System,Internal,Object,Class,Reflect){\n'+ utils.getContents( rootPath+'/run-dev.js' )+'\n}(System,Internal,System.Object,System.Class,System.Reflect));';
    }

    //系统引导器
    var bootstrap = utils.getContents( rootPath+'/bootstrap.js' );

    //开发业务代码
    var business = ['(function(define,'+requires.join(',')+'){',
        code,
        bootstrap.replace("{config.main}", config.main ),
        '})(Internal.define,'+requires.map(function (a){
            a = mapname[a] || a;
            if(a==='System')return a;
            return 'System.'+a;
        }).join(',')+');'];

    //框架代码
    var framework = [
        '(function(System,Internal,undefined){',
            '"use strict";',
            //系统全局模块域
            '(function(System,$'+globals.join(',$')+'){',
                internal,
                contents,
                run,
            '}(System,' + g.join(',') + '));',
            business.join('\n'),
        '}({},{}));'
    ];
    return framework.join('\n');
}
module.exports = builder;