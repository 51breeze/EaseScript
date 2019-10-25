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
    utils.mkdir( PATH.dirname(filepath) );
    return fs.writeFileSync(filepath, contents );
}
utils.setContents=setContents;

/**
 * 获取目录下的所有文件
 * @param path
 * @returns {Array}
 */
function getDirectoryFiles( path, flag )
{
    var files = fs.readdirSync( path );
    files = files.filter(function(a){
        return !(a==='.' || a==='..');
    });
    if( flag )
    {
        return files.map(function(name){
            return PATH.join(path,name);
        })
    }
    return files;
}
utils.getDirectoryFiles=getDirectoryFiles;

/**
 * 判断是否为一个目录
 * @param path
 * @returns {boolean}
 */
function isDir( path ) {

    var fileStat = isFileExists(path) ? fs.statSync(path) : null;
    return fileStat ? fileStat.isDirectory() : false;
}
utils.isDir = isDir;

/**
 * 返回一个完整的绝对路径
 * @param dir
 * @param path
 * @returns {*}
 */
function getResolvePath( dir, path )
{
    return PATH.resolve( dir, (path || '').replace(/\./g,PATH.sep) ).replace(/\\/g,'/');
}
utils.getResolvePath=getResolvePath;

/**
 * 返回一个指定路径到另一个路径的相对目录
 * @param from
 * @param to
 * @returns {*}
 */
function getRelativePath( from, to )
{
    return PATH.relative( from, (to || '').replace(/\./g,PATH.sep) ).replace(/\\/g,'/');
}
utils.getRelativePath=getRelativePath;


function getBuildPath(config, path, prop)
{
    prop = prop===null ? '': ( prop ? '.'+prop : '.path');
    if( path.substr(0,7)==='config.' )path = path.substr(8);
    if( path.substr(0,6)==='build.' )path = path.substr(6);
    if( path==='build' )path ='';
    if( path ) {
        path = path.split('.');
        path.unshift('build');
        path = 'config.' + path.join('.child.') + prop;
    }else{
        path = 'config.build'+ prop;
    }
    return eval("("+path+")");
}
utils.getBuildPath=getBuildPath;

utils.copyfile=function(src, to)
{
    if( PATH.resolve(src) !== PATH.resolve(to) )
    {
        if( typeof fs.copyFileSync === "function" ){
            return fs.copyFileSync( src,  to );
        }else{
            return fs.createReadStream(src).pipe( fs.createWriteStream(to) );
        }
    }
    return false;
}

function mkdir( dirpath )
{
    if( fs.existsSync( base ) )
    {
          return dirpath;
    }

    dirpath = dirpath.replace(/\./g,"/").replace(/^\/|\/$/g,'');
    var dirpath = PATH.isAbsolute(dirpath) ? dirpath : PATH.resolve( dirpath );
    dirpath = dirpath.replace(/\\/g,'/');
    dirpath = dirpath.split("/");
    var i = 0;
    var base='';
    if( /\w+\:/.test( dirpath[0] ) )
    {
        i=1;
        base = dirpath[0];
    }

    for( ;i<dirpath.length; i++)
    {
        base+='/'+dirpath[i];
        if( !fs.existsSync( base ) )
        {
            fs.mkdirSync( base );
        }
    }
    return base;
}
utils.mkdir = mkdir;

var __uid__=10;

/**
 * 全局唯一值
 * @returns {string}
 */
function uid()
{
    return (__uid__++);
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
    switch ( trim(val) )
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
    var flag = false;
    if( typeof target === "boolean" )
    {
        flag = target;
        target = arguments[1];
        i=2;
    }
    var isArr = target instanceof Array;
    for( ; i<len; i++ )
    {
        var item = arguments[i];
        for( var p in item )
        {
            if( item[p]===target[p] )continue;
            if( isArr )
            {
                target.push( item[p] );

            }else if( flag &&  typeof item[p] ==="object" && typeof target[p] === "object" && target[p] )
            {
                target[p] = merge(flag, target[p],  item[p] );
            }else
            {
                target[p] = item[p];
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

var metaType = ['Bindable','Embed','Import','Style','Event','Syntax','Skin','ArrayElementType','View','HostComponent','Remove','RunPlatform','Injection','Router'];
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
    metatype = trim( metatype );
    data.param.source=metatype;

    metatype = metatype.replace(/([\'\"])(.*?)\1/g,function (a,b,c) {
        return b+c.replace(/\,/g, "&#44;" )+b;
    });

    if( metatype.indexOf(",")<0 && metatype.indexOf("=") < 0 ) {
        metatype = metatype.replace(/^[\'\"]|[\'\"]$/g, '');
        data.param.source=metatype;
    }

    metatype = metatype.split(',');
    for(var i in metatype)
    {
        var item = metatype[i].split('=');
        if( item.length===1 )
        {
            var paramname = 'value';
            switch ( name ){
                case 'Event' :
                case 'Bindable' :
                    paramname = 'eventType';
                break;
                case 'Import' :
                    paramname = 'file';
                break;
            }
            data.param[ paramname ] = trim(item[0]).replace(/^[\'\"]|[\'\"]$/g,'').replace(/&#44;/g,",");
        }else{
            data.param[ trim(item[0]) ] = trim(item[1]).replace(/^[\'\"]|[\'\"]$/g,'').replace(/&#44;/g,",");
        }
    }
    return data;
}
utils.executeMetaType = executeMetaType;
utils.METATYPE_LIST = metaType;

function parseMetaEmbed(metatype, config, context )
{
    var source = metatype.param.source;
    if( context )
    {
        if( !(context instanceof Array) ){
            context = [context];
        }
        source = resolvePath(source,context);
    }
    return makeAssetsFile(config, config.workspace, source );
}
utils.parseMetaEmbed = parseMetaEmbed;



/**
 * 获取文件路径
 * @param {*} file 
 * @param {*} context 
 */
function resolvePath(file,context)
{
    if( PATH.isAbsolute( file ) )
    {
        return file;
    }

    var i = 0;
    var len = context.length;
    var index = file.lastIndexOf("?");
    if( index > 0 )
    {
        file = file.substr(0, index);

    }else if( (index = file.lastIndexOf("#")) > 0 )
    {
        file = file.substr(0, index);
    }

    for(;i<len;i++)
    {
        var f = PATH.resolve(context[i],file);
        if( fs.existsSync( f ) )
        {
            return f;
        }
    }
    throw new ReferenceError( 'file path not resolve the "'+context.join( file+"," )+file+'"');
}
utils.resolvePath = resolvePath;


function copyfileToBuildDir(source, builddir, config)
{
    var filepath = source;
    if( !PATH.isAbsolute(filepath) ){
        filepath = PATH.resolve(config.project_path, source);
    }

    if( fs.existsSync(filepath) )
    {
        var filename = PATH.basename(filepath);
        var directory = PATH.relative(filepath, source);
        var path = builddir;
        if( !directory )
        {
            directory = PATH.dirname(directory).replace(/\\/g, '/').split('/');
            directory = directory.filter(function (a) {
                return a !== '..';
            });
            path = PATH.resolve(builddir, directory.join('/') );

        }
        var dest = PATH.resolve(path, filename).replace(/\\/g, '/');
        mkdir(path);
        utils.copyfile(filepath, dest);
        return dest;

    }else
    {
        throw new ReferenceError("file is not exists '"+source+"'");
    }
}

utils.copyfileToBuildDir=copyfileToBuildDir;

/**
 * 返回可以通过 typeof 运算符返回的类型
 * @param type 一个字面量表示的类型
 * @returns {*}
 */
function getValueTypeof( type , value )
{
    switch ( type )
    {
        case '(string)' :
            return 'String';
        case '(regexp)' :
            return 'RegExp';
        case '(double)' :
            return 'Double';
        case '(float)' :
            return 'Float';
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

utils.MD5 = (function (){
    function RotateLeft(lValue, iShiftBits) { return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits)); }
    function AddUnsigned(lX,lY)
    {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4)
        {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else return (lResult ^ lX8 ^ lY8);
    }
    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }
    function FF(a,b,c,d,x,s,ac)
    {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }
    function GG(a,b,c,d,x,s,ac)
    {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }
    function HH(a,b,c,d,x,s,ac)
    {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }
    function II(a,b,c,d,x,s,ac)
    {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }
    function ConvertToWordArray(sMessage)
    {
        var lWordCount;
        var lMessageLength = sMessage.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength )
        {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (sMessage.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    }
    function WordToHex(lValue)
    {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++)
        {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    }
    return function MD5(sMessage,bit)
    {
        var x=Array();
        var k,AA,BB,CC,DD,a,b,c,d
        var S11=7, S12=12, S13=17, S14=22;
        var S21=5, S22=9 , S23=14, S24=20;
        var S31=4, S32=11, S33=16, S34=23;
        var S41=6, S42=10, S43=15, S44=21;
        // Steps 1 and 2. Append padding bits and length and convert to words
        x = ConvertToWordArray(sMessage);
        // Step 3. Initialise
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
        // Step 4. Process the message in 16-word blocks
        for (k=0;k<x.length;k+=16)
        {
            AA=a; BB=b; CC=c; DD=d;
            a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
            d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
            c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
            b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
            a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
            d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
            c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
            b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
            a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
            d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
            c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
            b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
            a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
            d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
            c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
            b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
            a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
            d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
            c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
            b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
            a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
            d=GG(d,a,b,c,x[k+10],S22,0x2441453);
            c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
            b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
            a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
            d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
            c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
            b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
            a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
            d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
            c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
            b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
            a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
            d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
            c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
            b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
            a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
            d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
            c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
            b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
            a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
            d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
            c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
            b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
            a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
            d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
            c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
            b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
            a=II(a,b,c,d,x[k+0], S41,0xF4292244);
            d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
            c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
            b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
            a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
            d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
            c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
            b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
            a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
            d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
            c=II(c,d,a,b,x[k+6], S43,0xA3014314);
            b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
            a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
            d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
            c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
            b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
            a=AddUnsigned(a,AA); b=AddUnsigned(b,BB); c=AddUnsigned(c,CC); d=AddUnsigned(d,DD);
        }
        if(bit==32)
        {
            return WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
        }
        else
        {
            return WordToHex(b)+WordToHex(c);
        }
    }
}());

utils.hash = function hash(str, len)
{
    var map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var val="";
    len = len || 8;
    str = utils.MD5(str,len);
    for(var i=0; i<len; i++){
        var g = str.charCodeAt(i);
        val+=map[ ( g ^ str.charCodeAt( i ) ) - g & 0x33 ];
    }
    return val;
}

utils.forEach=function forEach(target, callback, thisArg )
{
    if( !target )return;
    thisArg = thisArg||target;
    for( var i in target)
    {
        if( target.hasOwnProperty(i) )
        {
            callback.call(thisArg, target[i], i );
        }
    }
}


function pushInfo(refArr, info, desc, express, classmodule, globalsConfig )
{
    if( classmodule )refArr.unshift( classmodule.classname );
    if( globalsConfig.mode==1 )
    {
        if( !express )
        {
            express = joinProperty( desc.info );
        }
        desc.raw = express.replace(/\"/g,'');
        refArr.unshift( '"'+( desc.raw+':'+info)+'"' );
    }
}
utils.pushInfo = pushInfo;


/**
 * 合并属性链
 * @param props
 * @returns {string|*|{type, id, param}}
 */
function joinProperty( props , operator)
{
    if( !props )return '';
    props = props.reduce(function (accumulator,value) {
        if( value.charAt(0) ==="[" ){
            accumulator[ accumulator.length-1 ]+=value;
        }else{
            accumulator.push( value );
        }
        return accumulator;
    },[]);
    return props.join(  operator||"." );
}
utils.joinProperty = joinProperty;

/**
 * 生成一个运行时的引用属性名
 * @param props
 * @param checkRunning
 * @returns Array
 */
function createReferenceProps(props, checkRunning )
{
    //引用的属性名
    props = props.map(function (item) {
        //动态属性
        if ( item instanceof Array ){
            return checkRunning ? item.join('') : "["+item.join('')+"]";
        }
        return checkRunning ? '"' + item + '"' : item;
    });
    return props;
}
utils.createReferenceProps = createReferenceProps;


/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

var syntax_regexp = /^\s*(if|foreach|for|else|do|switch|case|default|break|var|function|while|{|})(.*)?/,
    call_regexp = /^([\w\.]+)\s*\(/,
    foreach_regexp  = /(\w+)\s+as\s+(\w+)(\s+(\w+))?/i;
function escape( str )
{
    return str.replace(/"/g, '\\"');
}

function foreach( expression)
{
    var result=foreach_regexp.exec( expression );
    if( !result )throw new SyntaxError('Missing expression');
    var data = result[1];
    var key  ='key';
    var item = result[2];
    if( typeof result[3] === 'string' )
    {
        key=result[2];
        item=result[3];
    }
    var code ='var forIndex=0;\n';
    code += 'var forKey;\n';
    code += 'var forItem;\n';
    code += 'var '+item+';\n';
    code += 'if( this.isObject('+data+') )for(var '+key+' in '+data+')if(Object.prototype.hasOwnProperty.call('+data+','+key+')){\n';
    code += item+'='+data+'['+key+'];\n';
    code += 'forKey='+key+';\n';
    code += 'forItem='+item+';\n';
    return code;
}



utils.templateMake= (function () {

    var _options={
        'left':"<\\?",
        'right':"\\?>",
        'shortLeft':"\\{(?!=\\{)",
        'shortRight':"\\}(?!=\\})"
    };

    var split = new RegExp( _options.left+'|'+_options.right,"gi" )
    var shortRegExp = new RegExp( _options.shortLeft+'(.*?)'+_options.shortRight,'gi' );
    var removeShortRegExp = new RegExp('^\\s*('+_options.shortLeft+')|('+_options.shortRight+")\\s*$",'gi' );
    var startTagRegExp = new RegExp( '^\s*'+_options.left+'\s*$' );

    function testQuotes( pos, str , direction )
    {
        var q;
        while ( q=str.charCodeAt( pos ) )
        {
            direction ? --pos : pos++;
            //\'\"
            if( q===34 || q===39 )return true;
            //\s\n\r\t
            if( !(q===10 || q===34 || q===9 || q===13) )return false;
        }
        return false;
    }

    function shortSyntax( str )
    {
        var shortCursor = 0;
        var shortMatch;
        var code = "";
        while ( shortMatch = shortRegExp.exec(str) )
        {
            code +='___code___+="'+ escape( str.slice(shortCursor, shortMatch.index ) )+'";\n';
            shortCursor = shortMatch.index + shortMatch[0].length;
            var shortCode = str.slice(shortMatch.index ,  shortCursor );
            shortCode = shortCode.replace(removeShortRegExp,"").replace(/^\s+|\s+$/g,"");
            shortCode = shortCode.replace(/^(?=[a-zA-Z_])(\w+)$/i,function (a,b){
                return "context.assign('"+b+"')";
            });
            code += '___code___+='+shortCode+';\n';
        }
        code +='___code___+="'+ escape( str.slice(shortCursor, str.length) )+'";\n';
        return code;
    }
    
    function templateMake( template )
    {
        var code = 'var ___code___:String="";\n',
        match,
        cursor = 0;
        template = template.replace(/\t+/g,'');

        var strTemplate = false;
        while( match = split.exec(template) )
        {
            var endPos = match.index;
            if( strTemplate ===true )
            {
                if( !testQuotes( endPos + match[0].length , template ) )continue;
                endPos+=match[0].length;
                strTemplate = false;
            }
            
            if( startTagRegExp.test( match[0] ) )
            {
                if( testQuotes( endPos-1, template, true ) )
                {
                    strTemplate = true;
                    continue;
                }
                code += shortSyntax( template.slice(cursor, endPos ).replace(/[\r\n]+/g,'') );

            }else
            {
                code += template.slice(cursor, endPos );
            }
            cursor = match.index + match[0].length;
        }
        code += shortSyntax( template.slice(cursor, template.length ).replace(/[\r\n]+/g,'') );
        return code;
    };
    return templateMake;
})();


utils.toKeys=function toKeys(object)
{
    var item=[];
    utils.forEach(object,function (val,key) {
        item.push(key);
    })
    return item;
}

var scalar_types=['int','integer','uint','number','double','float','string','boolean']
function isScalar( type )
{
   return scalar_types.indexOf( type.toLowerCase() ) >= 0;
}
utils.isScalar = isScalar;

var attrEventMap={
"onclick":"click",
"onkeyup":"keyup",
"onkeydown":"keydown",
"onkeypress":"keypress",
"onmouseup":"mouseup",
"onmousedown":"mousedown",
"onmousemove":"mousemove",
"onmouseout":"mouseout",
"onmouseover":"mouseover",
"onmousewheel":"mousewheel",
"onmouseoutside":"mouseoutside",
"ondblclick":"dblclick",
"ontouchstart":"touchstart",
"ontouchmove":"touchmove",
"ontouchend":"touchend",
"ontouchcancel":"touchcancel",
"ontouchdragstart":"touchDragStart",
"ontouchdragmove":"touchDragMove",
"ontouchdragend":"touchDragEnd",
"ontouchpinchstart":"touchPinchStart",
"ontouchpinchmove":"touchPinchMove",
"ontouchpinchend":"touchPinchEnd",
"ontouchswipestart":"touchSwipeStart",
"ontouchswipemove":"touchSwipeMove",
"ontouchswipeend":"touchSwipeEnd",
"onsubmit":"submit",
"onresize":"resize",
"onunload":"unload",
"onload":"load",
"onreset":"reset",
"onfocus":"focus",
"onblur":"blur",
"onerror":"error",
"oncopy":"copy",
"onbeforecopy":"beforecut",
"oncut":"cut",
"onbeforecut":"beforecut",
"onpaste":"paste",
"onbeforepaste":"beforepaste",
"onselect":"select",
"onselectstart":"selectstart",
"onscroll":"scroll",
"onanimationStart":"animationstart",
"onanimationEnd":"animationend",
"onanimationIteration":"animationiteration",
"ontransitionEnd":"transitionend",
"onpropertychange":"propertychange"
};

function getEventType(name)
{
    return attrEventMap[ name.toLowerCase() ]||null;
}
utils.getEventType=getEventType;

function getMethodName(name,accessor,ns)
{
    name = accessor ? accessor+name.substr(0,1).toUpperCase()+name.substr(1) : name;
    return ns ? ns+'_'+name : name;
}
utils.getMethodName = getMethodName;

utils.globals = ['Object','Function','Array','String','Number','Boolean','Math','Date','RegExp','Error','ReferenceError','TypeError','RangeError','SyntaxError','JSON','Reflect','Symbol','console'];

const _notLoadSystemFiles={
    "string":true,
    "number":true,
    "boolean":true,
    "math":true,
    "date":true,
    "regexp":true,
    "integer":true,
    "uint":true,
    "int":true,
    "double":true,
    "float":true,
    "class":true,
    "document":true,
    "window":true,
    "node":true,
    "nodelist":true,
    "htmlelement":true,
};

utils.excludeLoadSystemFile=function excludeLoadSystemFile( name , excludeFileMap )
{
    var lower =  name.toLowerCase() ;
    if( excludeFileMap && (excludeFileMap.hasOwnProperty( lower )  || excludeFileMap.hasOwnProperty(name) ) )
    {
         return true;
    }
    return _notLoadSystemFiles.hasOwnProperty(lower) || _notLoadSystemFiles.hasOwnProperty( name );
}

const globalTypeMap={'window':'Window','document':'Document','console':'Console'};

utils.getGlobalTypeMap = function getGlobalTypeMap( name )
{
   return globalTypeMap.hasOwnProperty(name) ? globalTypeMap[ name ] :  name;
}


utils.getRequireIdentifier=function getRequireIdentifier( config, module, suffix , context )
{
    var filepath = (module.fullclassname || utils.getGlobalTypeMap(module.type) ).replace(/\./g,'/');
    if( module.nonglobal )
    {
        if( suffix === "node" )
        {
            suffix = ".js";

        }else
        {
            if( module.isSkinModule )
            {
                suffix=config.skin_file_suffix;
            }else{
                suffix=config.project_file_suffix;  
            }
        }

        const corename = config.system_lib_path_name+'/';
        const base = PATH.relative( config.project.path, config.workspace ).replace(/\\/g,'/').replace(/\.\.\//g,'').replace(/^\/|\/$/g,'');
        if( base && filepath.slice(0, corename.length) !== corename )
        {
            filepath =  base+'/'+filepath;
        }

        filepath = filepath+suffix;
        if( context )
        {
            filepath = PATH.relative( context, PATH.resolve( getBuildPath(config,"build.application") , filepath ) ).replace(/\\/g,'/');
        }

        return filepath;
      
    }else
    {
        if( module.path && module.isImportMetatype )
        {
           if( module.path.replace(/\\/g,'/').indexOf( config.project.path.replace(/\\/g,'/') ) === 0 )
           {
               return PATH.relative( config.project.path, module.path  ).replace(/\\/g,'/')
           }
           return module.path;
        }

        if( context )
        {
           var app_path = getBuildPath(config,"build.application");
           var system_path = getResolvePath( app_path, config.build_system_path )+"/"+filepath+".js";
           return PATH.relative( context, system_path ).replace(/\\/g,'/');
        }
        return 'system/'+filepath+(suffix||".js");
    }
}


/**
 * 获取指定文件相对于webroot的目录
 * @param config
 * @param file
 * @return {string}
 */
function getRequestRelativePath(config, formpath, file )
{
    file = PATH.relative( formpath, file ).replace(/\\/g,'/');
    if( config.originMakeSyntax !=="javascript" || config.enable_webroot )
    {
        return '/'+file.replace(/\.\.\//g,''); 
    }
    return file;
}
utils.getRequestRelativePath = getRequestRelativePath;

/**
 * 构建一个资源文件
 */
function makeAssetsFile(config,formPath,file)
{
    var to = getBuildPath(config, 'build.assets');
    var info = PATH.parse( PATH.relative( formPath, file ) );
    if( info.dir )
    {
        var dir = info.dir.replace(/\\/g,'/').replace(/\.\.\//g,'');
        if( dir )
        {
            to = PATH.join( to, dir );
        }
    }
    return copyfileToBuildDir( file, to, config );
}
utils.makeAssetsFile=makeAssetsFile;


function getLoadFileRelativePath(config, file)
{
    var root = getBuildPath(config,"build.webroot");
    var prefix = config.originMakeSyntax !=="javascript" || config.enable_webroot ? "/" : "";
    if( !config.enable_webroot && config.originMakeSyntax !=="javascript" )
    {
        root = getBuildPath(config,"build");
    }
    return prefix+PATH.relative( root, file ).replace(/\\/g,"/");
}

utils.getLoadFileRelativePath=getLoadFileRelativePath;


module.exports = utils;