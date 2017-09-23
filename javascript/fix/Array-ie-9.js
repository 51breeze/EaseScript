/**
 * 返回一个数组
 * @type {Function}
 */
if( !Array.prototype.map )
{
    Array.prototype.map=function map(callback, thisArg)
    {
        var T, A, k;
        if (this == null)throw new TypeError("this is null or not defined");
        if (!System.isFunction(callback))throw new TypeError(callback + " is not a function");
        var O =  System.isObject(this) ? this : [];
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
    }
}
/**
 * 返回指定元素的索引位置
 * @param searchElement
 * @returns {number}
 */
if ( !Array.prototype.indexOf )
{
    Array.prototype.indexOf = function indexOf(searchElement, fromIndex)
    {
        if (this == null)throw new TypeError('"this" is null or not defined');
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
    };
}