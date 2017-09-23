const utils={};
const fs = require('fs');
const PATH = require('path');
const Colors = require('colors');
Colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'red',
    info: 'green',
    data: 'blue',
    help: 'cyan',
    warn: 'yellow',
    debug: 'magenta',
    error: 'red'
});

function info( msg ){console.log( msg.info );}
utils.info = info;
function silly( msg ){console.log( msg.silly );}
utils.silly = silly;
function input( msg ){console.log( msg.input );}
utils.input = input;
function verbose( msg ){console.log( msg.verbose );}
utils.verbose = verbose;
function prompt( msg ){console.log( msg.prompt );}
utils.prompt = prompt;
function data( msg ){console.log( msg.data );}
utils.data = data;
function help( msg ){console.log( msg.help );}
utils.help = help;
function warn( msg ){console.log( msg.warn );}
utils.warn = warn;
function debug( msg ){console.log( msg.debug );}
utils.debug = debug;
function error( msg ){console.log( msg.error );}
utils.error = error;

/**
 * 获取文件内容
 * @param filepath
 * @returns {*}
 */
function getContents( filepath )
{
    return fs.readFileSync( filepath , 'utf-8');
}
utils.getContents=getContents;

/**
 * 设置文件的内容
 * @param filepath
 * @returns {*}
 */
function setContents( filepath, contents )
{
    return fs.writeFileSync(filepath, contents );
}
utils.setContents=setContents;

/**
 * 获取目录下的所有文件
 * @param path
 * @returns {Array}
 */
function getDirectoryFiles( path )
{
    var files = fs.readdirSync( path );
    return files.filter(function(a){
        return !(a==='.' || a==='..');
    });
}
utils.getDirectoryFiles=getDirectoryFiles;

/**
 * 返回一个完整的绝对路径
 * @param dir
 * @param path
 * @returns {*}
 */
function getResolvePath( dir, path )
{
    return PATH.resolve( dir, (path || '').replace('.',PATH.sep) ).replace(/\\/g,'/');
}
utils.getResolvePath=getResolvePath;

function getBuildPath(config, path, prop)
{
    prop = prop===null ? '': ( prop ? '.'+prop : '.path');
    if( path.substr(0,7)==='config.' )path = path.substr(8);
    if( path.substr(0,6)==='build.' )path = path.substr(6);
    if( path==='build' )path ='';
    path = path.split('.');
    path.unshift('build');
    path = 'config.'+path.join('.child.')+prop;
    return eval("("+path+")");
}
utils.getBuildPath=getBuildPath;


function getProjectPath(config, path, prop)
{
    prop = prop===null ? '': ( prop ? '.'+prop : '.path');
    if( path.substr(0,7)==='config.' )path = path.substr(8);
    if( path.substr(0,8)==='project.' )path = path.substr(8);
    if( path==='project' )path ='';
    path = path.split('.');
    path.unshift('project');
    path = 'config.'+path.join('.child.')+prop;
    return eval("("+path+")");
}
utils.getProjectPath=getProjectPath;


var __uid__=1;

/**
 * 全局唯一值
 * @returns {string}
 */
function uid()
{
    return (__uid__++)+'0'+( Math.random() * 100000 >>>0 )+''+( Math.random() * 100000 >>>0 );
}
utils.uid=uid;

function isEmpty( obj )
{
    if( !obj )return true;
    var ret=true;
    for( var i in obj){
        ret=false;
        break;
    }
    return ret;
}
utils.isEmpty=isEmpty;

/**
 * 获取一个完整文件路径的文件名
 * @param path
 * @returns {*}
 */
function getFilenameByPath( path )
{
    return PATH.basename(path, PATH.extname(path) )
}
utils.getFilenameByPath=getFilenameByPath;

/**
 * 判断文件是否存在
 * @param filepath
 * @returns {*}
 */
function isFileExists( filepath ) {
    return fs.existsSync( filepath );
}
utils.isFileExists = isFileExists;

/**
 * 判断是否为一个有效的运算符
 * @param o
 * @returns {boolean}
 */
function isOperator( o )
{
    switch (o) {
        case ';' :
        case '.' :
        case ',' :
        case ':' :
        case '::' :
        case '?' :
        case 'as' :
            return true;
    }
    return isBoolOperator(o) || isLogicOperator(o) || isCombinationOperator(o) || isLeftOperator(o) || isMathAssignOperator(o) || isBitOperator(o);
}
utils.isOperator = isOperator;

/**
 * 是否为一个可以组合的运算符
 * @param o
 * @returns {boolean}
 */
function isCombinationOperator( o )
{
    switch (o) {
        case ':' :
        case '=' :
        case '&' :
        case '|' :
        case '<' :
        case '>' :
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '!' :
        case '^' :
        case '~' :
            return true;
    }
    return false;
}
utils.isCombinationOperator = isCombinationOperator;

/**
 * 赋值运算符
 * @param o
 * @returns {boolean}
 */
function isMathAssignOperator( o )
{
    switch (o) {
        case '=' :
        case '+=' :
        case '-=' :
        case '*=' :
        case '/=' :
        case '%=' :
        case '^=' :
        case '&=' :
        case '|=' :
        case '<<=' :
        case '>>=' :
        case '>>>=' :
            return true;
    }
    return false;
}
utils.isMathAssignOperator = isMathAssignOperator;

/**
 * 二进制位运算
 * @param o
 * @returns {boolean}
 */
function isBitOperator( o )
{
    switch (o) {
        case '&' :
        case '|' :
        case '^' :
        case '>>' :
        case '<<' :
        case '>>>' :
            return true;
    }
    return false;
}
utils.isBitOperator = isBitOperator;

/**
 * 前置运算符
 * @param o
 * @returns {boolean}
 */
function isLeftOperator(o)
{
    switch (o) {
        case '~' :
        case '-' :
        case '+' :
        case '!' :
        case '!!' :
            return true;
    }
    return isIncreaseAndDecreaseOperator(o) || isKeywordLeftOperator(o);
}
utils.isLeftOperator = isLeftOperator;

/**
 * 关键字运算符
 * @param o
 * @returns {boolean}
 */
function isKeywordLeftOperator(o)
{
    switch (o) {
        case 'new' :
        case 'delete' :
        case 'typeof' :
        case 'throw' :
            return true;
    }
    return false;
}
utils.isKeywordLeftOperator = isKeywordLeftOperator;

/**
 * 后置运算符
 * @param o
 * @returns {boolean}
 */
function isIncreaseAndDecreaseOperator(o)
{
    switch (o) {
        case '--' :
        case '++' :
            return true;
    }
    return false;
}
utils.isIncreaseAndDecreaseOperator = isIncreaseAndDecreaseOperator;

/**
 * 在左右两边都需要标识符的运算符
 * @param o
 * @returns {boolean}
 */
function isLeftAndRightOperator(o)
{
    switch (o) {
        case '&&' :
        case '||' :
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '^' :
            return true;
    }
    return isBoolOperator(o) || isMathAssignOperator(o) || isBitOperator(o);
}
utils.isLeftAndRightOperator = isLeftAndRightOperator;


/**
 * 一个数学运算符
 * @returns {boolean}
 */
function isMathOperator( o )
{
    switch (o) {
        case '-' :
        case '+' :
        case '*' :
        case '/' :
        case '%' :
        case '^' :
        case '+=' :
        case '-=' :
        case '*=' :
        case '/=' :
        case '%=' :
        case '^=' :
        case '&=' :
        case '|=' :
        case '<<=' :
        case '>>=' :
        case '>>>=' :
        case '&' :
        case '|' :
        case '^' :
        case '>>' :
        case '<<' :
        case '>>>' :
            return true;
    }
}
utils.isMathOperator = isMathOperator;

/**
 * 是否为结束表达式的操作符
 * @param o
 * @returns {boolean}
 */
function isEndOperator(o)
{
    switch (o) {
        case ';' :
        case ',' :
        case ':' :
        case '?' :
        case ']' :
        case ')' :
        case '}' :
            return true;
    }
    return false;
}
utils.isEndOperator = isEndOperator;

/**
 * 布尔运算符
 * @param o
 * @returns {boolean}
 */
function isBoolOperator(o)
{
    switch (o) {
        case '<' :
        case '>' :
        case '<=' :
        case '>=' :
        case '==' :
        case '!=' :
        case '===' :
        case '!==' :
        case 'instanceof' :
        case 'is' :
        case 'in' :
        case 'of' :
            return true;
    }
    return false;
}
utils.isBoolOperator = isBoolOperator;


function isTypeConvertOperator( o )
{
    return o==='as';
}
utils.isTypeConvertOperator = isTypeConvertOperator;

/**
 * 关系运算符
 * @param o
 * @returns {boolean}
 */
function isKeywordOperator(o)
{
    switch (o) {
        case 'instanceof' :
        case 'is' :
        case 'in' :
        case 'of' :
        case 'as' :
            return true;
    }
    return isKeywordLeftOperator(o);
}
utils.isKeywordOperator = isKeywordOperator;

/**
 * 逻辑运算符
 * @param o
 * @returns {boolean}
 */
function isLogicOperator(o)
{
    switch (o) {
        case '&&' :
        case '||' :
        case '!!' :
        case '!' :
            return true;
    }
    return false;
}
utils.isLogicOperator = isLogicOperator;

/**
 * 判断是否为一个标识符
 * @param s
 * @returns {boolean}
 */
function isIdentifier( o )
{
    return o.id === '(keyword)' || o.type==='(identifier)' || isLiteralObject(o.type);
}
utils.isIdentifier = isIdentifier;

/**
 * 是否为一个字面量对象
 * @param val
 * @returns {boolean}
 */
function isLiteralObject( val )
{
    return val==='(string)' || val==='(template)' || val==='(regexp)' || val==='(number)';
}
utils.isLiteralObject = isLiteralObject;

/**
 * 判断是否为一个定界符
 * @param s
 * @returns {boolean}
 */
function isDelimiter( s )
{
    return isLeftDelimiter(s) || isRightDelimiter(s);
}
utils.isDelimiter = isDelimiter;

/**
 * 判断是否为一个左定界符
 * @param s
 * @returns {boolean}
 */
function isLeftDelimiter(s)
{
    switch( s )
    {
        case '{' :
        case '(' :
        case '[' :
            return true;
    }
    return false;
}
utils.isLeftDelimiter = isLeftDelimiter;

/**
 * 判断是否为一个右定界符
 * @param s
 * @returns {boolean}
 */
function isRightDelimiter(s)
{
    switch( s )
    {
        case '}' :
        case ')' :
        case ']' :
            return true;
    }
    return false;
}
utils.isRightDelimiter = isRightDelimiter;

/**
 * 是否为一个有效的属性名
 * @param s
 * @returns {boolean}
 */
function isPropertyName(s)
{
    return /^([a-z_$]+[\w+]?)/i.test( s );
}
utils.isPropertyName = isPropertyName;

/**
 * 判断是否为一个恒定的值
 * @param val
 * @returns {boolean}
 */
function isConstant(val)
{
    switch ( val )
    {
        case 'null' :
        case 'undefined' :
        case 'true' :
        case 'false' :
        case 'NaN' :
        case 'Infinity' :
        case 'this' :
            return true;
            break;
    }
    return false;
}
utils.isConstant = isConstant;

/**
 * 去掉两边的空白
 * @param str
 * @returns {string|void|XML}
 */
function trim( str )
{
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,'') : '';
}
utils.trim = trim;

/**
 * 合并对象到指定的第一个参数
 * @returns {*}
 */
function merge()
{
    var target = arguments[0];
    var len = arguments.length;
    var i = 1;
    var flag = true;
    if( typeof target === "boolean" )
    {
        flag = target;
        target = arguments[1];
        i=2;
    }
    for( ; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( item[p]===target[p] )continue;
            if( flag && typeof item[p] ==="object" && typeof target[p] === "object" && target[p] )
            {
                target[p] = merge(flag, target[p],  item[p] );
            }else
            {
                if( target instanceof Array )
                {
                    target = target.concat( item[p] );
                }else
                {
                    target[p] = item[p];
                }
            }
        }
    }
    return target;
}
utils.merge = merge;

function unique( arr )
{
    if (arr==null || !(arr instanceof Array) ) return [];
    var i=0;
    var b;
    var len = arr.length >> 0;
    for(;i<len;i++)
    {
        b = i+1;
        for (;b<len;b++)if(arr[i]===arr[b])arr.splice(b, 1);
    }
    return arr;
}
utils.unique=unique;


/**
 * 判断是否为一个恒定的值
 * @param val
 * @returns {boolean}
 */
function getConstantType(val)
{
    switch ( val )
    {
        case 'null' :
        case 'undefined' :
            return 'Object';
        case 'true' :
        case 'false' :
            return 'Boolean';
        case 'NaN' :
        case 'Infinity' :
            return 'Number';
    }
    return null;
}
utils.getConstantType = getConstantType;

const metaType = ['Bindable','Embed','Style','Event','Deprecated','Syntax','Skin'];
function executeMetaType( metatype )
{
    var index = metatype.indexOf('(');
    var name = index>0 ? metatype.substr(0,index) : metatype;
    if( metaType.indexOf(name) < 0 )return null;

    var data={
        'type':name,
        'param':{}
    };

    if( index < 0 )
    {
        return data;
    }

    metatype = metatype.slice(index+1,-1);
    metatype = metatype.split(',');

    for(var i in metatype)
    {
        var item = metatype[i].split('=');
        if( metatype.length ===1 && item.length===1){
            data.param['source'] = trim(item[0]).replace(/^[\'\"]|[\'\"]$/g,'');
        }else{
            data.param[ trim(item[0]) ] = trim(item[1]).replace(/^[\'\"]|[\'\"]$/g,'');
        }
    }
    return data;
}
utils.executeMetaType = executeMetaType;

/**
 * 返回可以通过 typeof 运算符返回的类型
 * @param type 一个字面量表示的类型
 * @returns {*}
 */
function getValueTypeof( type )
{
    switch ( type )
    {
        case '(string)' :
            return 'String';
        case '(regexp)' :
            return 'RegExp';
        case '(number)' :
            return 'Number';
        case '(boolean)' :
            return 'Boolean';
        default :
            return null;
    }
}
utils.getValueTypeof = getValueTypeof;


/**
 * 格式化字节
 * @param bytes
 * @returns {string}
 */
function byteFormat(bytes)
{
    return (bytes/1024/1024).toFixed(2)+'MB';
}

/**
 * 获取占用的内存信息
 */
function showMem()
{
    var mem = process.memoryUsage();
    console.log('Process: heapTotal '+byteFormat(mem.heapTotal) + ' heapUsed ' + byteFormat(mem.heapUsed) + ' rss ' + byteFormat(mem.rss));
}
utils.showMem = showMem;
module.exports = utils;