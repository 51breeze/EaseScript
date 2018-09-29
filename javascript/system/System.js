/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require System,Internal;
*/
System.isFinite = isFinite;
System.decodeURI = decodeURI;
System.decodeURIComponent = decodeURIComponent;
System.encodeURI = encodeURI;
System.encodeURIComponent = encodeURIComponent;
System.isNaN = isNaN;
System.Infinity = Infinity;
System.parseFloat = parseFloat;
System.parseInt = parseInt;
System.Math = $Math;
System.String = $String;
System.Number = $Number;
System.Boolean  = $Boolean;
System.RegExp = $RegExp;
System.Date = $Date;
System.RegExp = $RegExp;
System.Error  = $Error;
System.TypeError  = $TypeError;
System.ReferenceError  = $ReferenceError;
System.SyntaxError = $SyntaxError;

;(function(f){
    System.setTimeout =f(setTimeout);
    System.setInterval =f(setInterval);
})(function(f){return function(c,t){
    var a=[].slice.call(arguments,2);
    return f( function(){ c.apply(this,a) }, t ) };
});
System.clearTimeout = function(id){
    return clearTimeout( id );
};
System.clearInterval = function(id){
    return clearInterval( id );
};

/**
 * 环境参数配置
 */
System.env = {
    'BROWSER_IE': 'IE',
    'BROWSER_FIREFOX': 'FIREFOX',
    'BROWSER_CHROME': 'CHROME',
    'BROWSER_OPERA': 'OPERA',
    'BROWSER_SAFARI': 'SAFARI',
    'BROWSER_MOZILLA': 'MOZILLA',
    'NODE_JS': 'NODE_JS',
    'IS_CLIENT': false
};

/**
 * 获取环境变量的参数
 */
(function (env) {

    var _platform = [];
    if (typeof navigator !== "undefined") {
        var ua = navigator.userAgent.toLowerCase();
        var s;
        (s = ua.match(/msie ([\d.]+)/)) ? _platform = [env.BROWSER_IE, System.parseFloat(s[1])] :
        (s = ua.match(/firefox\/([\d.]+)/)) ? _platform = [env.BROWSER_FIREFOX, System.parseFloat(s[1])] :
        (s = ua.match(/chrome\/([\d.]+)/)) ? _platform = [env.BROWSER_CHROME, System.parseFloat(s[1])] :
        (s = ua.match(/opera.([\d.]+)/)) ? _platform = [env.BROWSER_OPERA, System.parseFloat(s[1])] :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? _platform = [env.BROWSER_SAFARI, System.parseFloat(s[1])] :
        (s = ua.match(/^mozilla\/([\d.]+)/)) ? _platform = [env.BROWSER_MOZILLA, System.parseFloat(s[1])] : null;
        env.IS_CLIENT = true;
    } else if (typeof process !== "undefined") {
        _platform = [env.NODE_JS, process.versions.node];
    }

    /**
     * 获取当前运行平台
     * @returns {*}
     */
    env.platform = function platform(name, version)
    {
        if ( typeof name === "string" )
        {
            name = name.toUpperCase();
            if( version > 0 )return name == _platform[0] && env.version( version );
            return name == _platform[0];
        }
        return _platform[0];
    };

    /**
     * 判断是否为指定的浏览器
     * @param type
     * @returns {string|null}
     */
    env.version = function version(value, expre) {
        var result = _platform[1];
        if (value == null)return result;
        value = parseFloat(value);
        switch (expre) {
            case '=' :
                return result == value;
            case '!=' :
                return result != value;
            case '>' :
                return result > value;
            case '>=' :
                return result >= value;
            case '<=' :
                return result <= value;
            case '<' :
                return result < value;
            default:
                return result <= value;
        }
    };

}(System.env));


/**
 * 返回对象类型的字符串表示形式
 * @param instanceObj
 * @returns {*}
 */
System.typeOf = function typeOf(instanceObj)
{
    if (instanceObj == null )
    {
        return instanceObj===null ? 'object' : 'undefined';
    }
    if (instanceObj instanceof System.Class )return 'class';
    if (instanceObj instanceof System.Interface)return 'interface';
    if (instanceObj instanceof System.Namespace)return 'namespace';
    return typeof instanceObj;
};

/**
 * 检查实例对象是否属于指定的类型(不会检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
System.instanceOf = function instanceOf(instanceObj, theClass)
{
    if( instanceObj == null )
    {
        return theClass === System.Object || theClass===$Object  ? true : false;
    }

    if (theClass === System.Class)
    {
        return instanceObj instanceof System.Class;
    }

    if( theClass === System.JSON )
    {
        return System.isObject(instanceObj);
    }

    try {
        if( theClass instanceof System.Class )theClass = theClass.constructor;
        if ( Object(instanceObj) instanceof theClass)return true;
        if ( theClass === System.Array )return instanceObj instanceof $Array;
        if ( theClass === System.Object )return instanceObj instanceof $Object;
        if ( theClass === System.Function )return instanceObj instanceof $Function;
    } catch (e) {}
    return false;
};

/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
System.is=function is(instanceObj, theClass)
{
    if( instanceObj == null )
    {
        return theClass === System.Object || theClass===$Object  ? true : false;
    }
    if (theClass === System.Class)
    {
        return instanceObj instanceof System.Class;
    }
    if( instanceObj && instanceObj.constructor instanceof System.Class && theClass instanceof System.Interface)
    {
        var objClass =instanceObj.constructor;
        if (objClass === theClass)return true;

        while ( objClass instanceof System.Class )
        {
            var impls = objClass.__T__.implements;
            if (impls && impls.length > 0)
            {
                var i = 0;
                var len = impls.length;
                for (; i < len; i++)
                {
                    var interfaceModule = impls[i];
                    while (interfaceModule) {
                        if (interfaceModule === theClass)return true;
                        interfaceModule =interfaceModule.__T__["extends"];
                    }
                }
            }
            objClass =objClass.__T__["extends"] || System.Object;
            if (objClass === theClass)return true;
        }
        if( objClass.prototype )instanceObj = objClass.prototype;
    }
    return System.instanceOf(instanceObj, theClass);
};

/**
 * 判断是否为一个单纯的对象
 * @param val
 * @returns {boolean}
 */
System.isObject = function isObject(val)
{
    if (!val || typeof val !== "object")return false;
    var proto = System.Object.getPrototypeOf(val);
    if( proto === System.Object.prototype || proto === $Object.prototype )
    {
        return true;
    }
    return false;
};
/**
 * 检查所有传入的值定义
 * 如果传入多个值时所有的都定义的才返回true否则为false
 * @param val,...
 * @returns {boolean}
 */
System.isDefined = function isDefined()
{
    var i = arguments.length;
    while (i > 0) if (typeof arguments[--i] === 'undefined')return false;
    return true;
};
/**
 * 判断是否为数组
 * @param val
 * @returns {boolean}
 */
System.isArray = function isArray(val) {
    if (!val || typeof val !== "object")return false;
    var proto = System.Object.getPrototypeOf(val);
    return proto === System.Array.prototype || proto === $Array.prototype;
};

/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
System.isFunction = function isFunction(val) {
    if (!val)return false;
    return System.typeOf(val) === 'function' || val instanceof System.Function || val instanceof $Function;
};
/**
 * 判断是否为布尔类型
 * @param val
 * @returns {boolean}
 */
System.isBoolean =function isBoolean(val) {
    return typeof val === 'boolean';
};
/**
 * 判断是否为字符串
 * @param val
 * @returns {boolean}
 */
System.isString = function isString(val) {
    return typeof val === 'string';
};
/**
 * 判断是否为一个标量
 * 只有对象类型或者Null不是标量
 * @param {boolean}
 */
System.isScalar = function isScalar(val) {
    var t = typeof val;
    return t === 'string' || t === 'number' || t === 'float' || t === 'boolean';
};
/**
 * 判断是否为数字类型
 * @param val
 * @returns {boolean}
 */
System.isNumber = function isNumber(val) {
    return typeof val === 'number';
};

/**
 * 判断是否为一个空值
 * @param val
 * @param flag 为true时排除val为0的值
 * @returns {boolean}
 */
System.isEmpty =function isEmpty(val, flag) {
    if (!val)return flag !== true || val !== 0;
    if (System.isObject(val)||System.isArray(val)) {
        var ret;
        for (ret in val)break;
        return typeof ret === "undefined";
    }
    return false;
};

/**
 * 去掉指定字符两边的空白
 * @param str
 * @returns {string}
 */
System.trim =function trim(str) {
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') : '';
};

/**
 * 返回一组指定范围值的数组
 * @param low 最低值
 * @param high 最高值
 * @param step 每次的步增数，默认为1
 */
System.range =function range(low, high, step) {

    if( high >= low )
    {
        var obj = [];
        if (!System.isNumber(step))step = 1;
        step = Math.max(step, 1);
        for (;low <= high; low += step)obj.push(low);
        return obj;
    }
    return [];
};

/**
 * 将字符串的首字母转换为大写
 * @param str
 * @returns {string}
 */
System.ucfirst =  function ucfirst(str) {
    return typeof str === "string" ? str.charAt(0).toUpperCase() + str.substr(1) : str;
};

/**
 * 将字符串的首字母转换为小写
 * @param str
 * @returns {string}
 */
System.lcfirst =  function lcfirst(str) {
    return typeof str === "string" ? str.charAt(0).toLowerCase() + str.substr(1) : str;
};


/**
 * 复制字符串到指定的次数
 * @param string str
 * @param number num
 * @returns {string}
 */
System.repeat = function repeat(str, num) {
    if (typeof str === "string") {
        return new System.Array((parseInt(num) || 0) + 1).join(str);
    }
    return '';
};

/**
 * 比较两个两个字符串的值。
 * 如果 a > b 返回 1 a<b 返回 -1 否则返回 0
 * 比较的优先级数字优先于字符串。字母及汉字是按本地字符集排序。
 * @param a
 * @param b
 * @returns {*}
 */
System.compare = function compare(a, b) {

    var c = System.parseFloat(a), d = System.parseFloat(b);
    if (System.isNaN(c) && System.isNaN(d)) {
        return a.localeCompare(b);
    } else if (!System.isNaN(c) && !System.isNaN(d)) {
        return c > d ? 1 : (c < d ? -1 : 0);
    }
    return System.isNaN(c) ? 1 : -1;
};

/**
 * 格式化输出
 * @format
 * @param [...]
 * @returns {string}
 */
System.sprintf = function sprintf() {
    var str = '', i = 1, len = arguments.length, param;
    if (len > 0) {
        str = arguments[0];
        if (typeof str === "string") {
            for (; i < len; i++) {
                param = arguments[i];
                str = str.replace(/%(s|d|f|v)/, function (all, method) {
                    if (method === 'd') {
                        param = System.parseInt(param);
                        return System.isNaN(param) ? '' : param;
                    } else if (method === 'f') {
                        param = System.parseFloat(param);
                        return System.isNaN(param) ? '' : param;
                    } else if (method === 'v') {
                        return System.Object.prototype.valueOf.call(param);
                    }
                    return System.Object.prototype.toString.call(param);
                });
            }
            str.replace(/%(s|d|f|v)/g, '');
        }
    }
    return str;
};
/**
 * 把一个对象序列化为一个字符串
 * @param object 要序列化的对象
 * @param type   要序列化那种类型,可用值为：url 请求的查询串,style 样式字符串。 默认为 url 类型
 * @param group  是否要用分组，默认是分组（只限url 类型）
 * @return string
 */
System.serialize = function serialize(object, type, group) {
    if (typeof object === "string" || !object)
        return object;
    var str = [], key, joint = '&', separate = '=', val = '', prefix = System.isBoolean(group) ? null : group;
    type = type || 'url';
    group = ( group !== false );
    if (type === 'style') {
        joint = ';';
        separate = ':';
        group = false;
    } else if (type === 'attr') {
        separate = '=';
        joint = ' ';
        group = false;
    }
    if (System.isObject(object))for (key in object) {
        val = type === 'attr' ? '"' + object[key] + '"' : object[key];
        key = prefix ? prefix + '[' + key + ']' : key;
        str = str.concat(typeof val === 'object' ? System.serialize(val, type, group ? key : false) : key + separate + val);
    }
    return str.join(joint);
};
/**
 * 将一个已序列化的字符串反序列化为一个对象
 * @param str
 * @returns {{}}
 */
System.unserialize=function unserialize(str) {
    var object = {}, index, joint = '&', separate = '=', val, ref, last, group = false;
    if (/[\w\-]+\s*\=.*?(?=\&|$)/.test(str)) {
        str = str.replace(/^&|&$/, '');
        group = true;

    } else if (/[\w\-\_]+\s*\:.*?(?=\;|$)/.test(str)) {
        joint = ';';
        separate = ':';
        str = str.replace(/^;|;$/, '')
    }

    str = str.split(joint);
    for (index in str) {
        val = str[index].split(separate);
        if (group && /\]\s*$/.test(val[0])) {
            ref = object, last;
            val[0].replace(/\w+/ig, function (key) {
                last = ref;
                ref = !ref[key] ? ref[key] = {} : ref[key];
            });
            last && ( last[RegExp.lastMatch] = val[1] );
        } else {
            object[val[0]] = val[1];
        }
    }
    return object;
};

var __uid__=1;

/**
 * 全局唯一值
 * @returns {string}
 */
System.uid =function uid()
{
   return (__uid__++)+''+(System.Math.random() * 100000)>>>0;
};

/**
 * 给一个指定的对象管理一组数据
 * @param target
 * @param name
 * @param value
 * @returns {*}
 */
System.storage=function storage(target, name , value)
{
    if( target==null )throw new TypeError('target can not is null or undefined');
    if( typeof name !== "string" )throw new TypeError('name can only is string');
    var namespace = name.split('.');
    var i = 0, len = namespace.length-1;
    while( i<len )
    {
        name = namespace[i++];
        target= target[ name ] || (target[ name ] = {});
    }
    name = namespace[ len ];
    if( value !== undefined )
    {
        return target[name] = value;

    }else if( value === undefined )
    {
        var val = target[ name ];
        delete target[ name ];
        return val;
    }
    return target[name];
};

var _globalEvent=null;
System.getGlobalEvent=function getGlobalEvent()
{
      if( _globalEvent===null )
      {
          _globalEvent = new System.EventDispatcher( window );
      }
      return _globalEvent;
}

System.context=null;
System.getContext=function getContext()
{
    return System.context;
}

Internal.createSymbolStorage=function(symbol)
{
    return function(target, name, value )
    {
        if( name === true )
        {
            target[ symbol ]=value;
            return value;
        }
        var data = target[ symbol ];
        if( !data )
        {
            data={};
            target[ symbol ]=data;
        }
        if( typeof value !== "undefined" )
        {
            if( typeof data[ name ] === "number" )
            {
                if (value === "increment")return data[name]++;
                if (value === "decrement")return data[name]--;
            }
            data[ name ]=value;
            return value;
        }
        return name==null ? data : data[ name ];
    }
};