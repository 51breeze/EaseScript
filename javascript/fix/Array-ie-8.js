/**
 * 返回一个数组
 * @type {Function}
 */
if( !Array.prototype.map )
{
    Object.defineProperty(Array.prototype,"map", {value:function map(callback, thisArg)
    {
        var T, A, k;
        if (this == null)throw new TypeError("this is null or not defined");
        if (!System.isFunction(callback))throw new TypeError(callback + " is not a function");
        var O =  System.isArray(this) ? this : [];
        var len = O.length >>> 0;
        if (thisArg)T = thisArg;
        A = new Array(len);
        k = 0;
        var kValue, mappedValue;
        while(k < len) {
            if (k in O) {
                kValue = O[ k ];
                mappedValue = callback.call(T, kValue, k, O);
                A[ k ] = mappedValue;
            }
            k++;
        }
        return A;
    }});
}
/**
 * 返回指定元素的索引位置
 * @param searchElement
 * @returns {number}
 */
if ( !Array.prototype.indexOf )
{
    Object.defineProperty(Array.prototype,"indexOf", {value:function indexOf(searchElement, fromIndex)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var obj = Object(this);
        var len = obj.length >>> 0;
        if (len === 0)return -1;
        var n = +fromIndex || 0;
        if ( System.Math.abs(n) === System.Infinity)n = 0;
        if (n >= len)return -1;
        var k = System.Math.max(n >= 0 ? n : len - System.Math.abs(n), 0);
        while (k < len)
        {
            if (k in obj && obj[k] === searchElement)return k;
            k++;
        }
        return -1;
    }});
}

if (!Array.prototype.lastIndexOf)
{
    Object.defineProperty(Array.prototype,"lastIndexOf", {value:function lastIndexOf(searchElement)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var n, k, t = Object(this), len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        n = len - 1;
        if (arguments.length > 1)
        {
            n = Number(arguments[1]);
            if (n != n) {
                n = 0;
            }
            else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
            {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--)
        {
            if (k in t && t[k] === searchElement)
            {
                return k;
            }
        }
        return -1;
    }});
}

/**
 * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
 * @param callback
 * @param thisArg
 * @returns {Array}
 */
    
if (!Array.prototype.filter)
{
    Object.defineProperty(Array.prototype,"filter",{value:function filter(callback, thisArg)
    {
        if (typeof callback !== 'function')throw new TypeError('callback must be a function');
        if (this==null)throw new ReferenceError('this is null or not defined');
        var items = new Array();
        var obj = Object(this);
        var len = obj.length >> 0;
        var k = 0;
        thisArg = thisArg || this;
        while (k<len)
        {
            if( k in obj && callback.call(thisArg, obj[k], k, obj) )
            {
                items.push(obj[k]);
            }
            k++;
        }
        return items;
    }});
}

 /**
 * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
 * @param callback 一个回调函数。
 * 参数中的第一个为属性值，第二个为属性名。
 * 如果返回 false 则退出循环
 * @returns {Object}
 */
if (!Array.prototype.forEach)
{
    Object.defineProperty(Array.prototype,"forEach",{value:function forEach(callback, thisArg)
        {
            var T, k;
            if (this == null)
            {
                throw new TypeError(' this is null or not defined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== "function") 
            {
                throw new TypeError(callback + ' is not a function');
            }
            if (arguments.length > 1) 
            {
                T = thisArg;
            }
            k = 0;
            while (k < len) 
            {
                var kValue;
                if (k in O)
                {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);
                }
                k++;
            }
        }
    });
}

if (!Array.isArray)
{
    Object.defineProperty(Array,"isArray",{value:function isArray(arg) 
    {
       return Object.prototype.toString.call(arg) === '[object Array]';
    }});
}