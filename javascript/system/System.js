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
System.Math = Math;
System.String = String;
System.Number = Number;
System.Boolean  = Boolean;
System.RegExp = RegExp;
System.Date = Date;
System.RegExp = RegExp;
System.Error  = Error;
System.TypeError  = TypeError;
System.ReferenceError  = ReferenceError;
System.SyntaxError = SyntaxError;
System.alert=function(a){
    window.alert(a);
}

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
    env.platform = function platform(name) {
        if (name != null)return name == _platform[0];
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
    if (instanceObj == null )return 'object';
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
 * 判断是否为一个可遍历的对象
 * null, undefined 属于对象类型但也会返回 false
 * @param val
 * @param flag 默认为 false。如为true表示一个纯对象,否则数组对象也会返回true
 * @returns {boolean}
 */
System.isObject =function isObject(val, flag)
{
    if (!val || typeof val !== "object")return false;
    var proto = System.Object.getPrototypeOf(val);
    if( proto === System.Object.prototype || proto === $Object.prototype )
    {
        return true;
    }
    return flag !== true && System.isArray(val);
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
    if (System.isObject(val)) {
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
    if (System.isObject(object, true))for (key in object) {
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
System.crc32 = (function(){
var crc32Table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 " +
"E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D " +
"6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 " +
"3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 " +
"ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 " +
"CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 " +
"01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 " +
"7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 " +
"F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE " +
"A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 " +
"33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F " +
"5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C " +
"74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D " +
"0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 " +
"89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 " +
"D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF " +
"4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 " +
"2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 " +
"EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 " +
"86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA " +
"11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 " +
"4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C " +
"CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 " +
"B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
function crc32(str, crc) {
    if (typeof crc === "undefined") crc = 0;
    var n = 0; //a number between 0 and 255
    var x = 0; //an hex number
    var iTop = str.length;
    crc = crc ^ (-1);
    for (var i = 0; i < iTop; i++) {
        n = ( crc ^ str.charCodeAt(i) ) & 0xFF;
        x = "0x" + crc32Table.substr(n * 9, 8);
        crc = ( crc >>> 8 ) ^ x;
    }
    return System.Math.abs(crc ^ (-1));
}
    return crc32;
}());

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
            data[ name ]=value;
            return value;
        }
        return name==null ? data : data[ name ];
    }
};