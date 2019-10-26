/**
 * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
 * @param value
 * @param start
 * @param end
 * @returns {Object}
 */
if (!Array.prototype.fill)
{
    Object.defineProperty(Array.prototype,"fill",{value:function fill(value, start, end)
        {
            if (this==null)throw new ReferenceError('this is null or not defined');
            if (!(System.is(this, Array) || System.isArray(this)))throw new ReferenceError('this is not Array');
            var len = this.length >> 0;
            var relativeStart = start >> 0;
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var relativeEnd = end == null ? len : end >> 0;
            var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            while (k < final) {
                this[k] = value;
                k++;
            }
            return this;
        }
    });
}

/**
 * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
 * @param callback
 * @param thisArg
 * @returns {*}
 */
if (!Array.prototype.find)
{
    Object.defineProperty(Array.prototype,"find",{value:function find(callback, thisArg)
        {
            if (typeof callback !== 'function')throw new TypeError('callback must be a function');
            if (this==null)throw new ReferenceError('this is null or not defined');
            var obj = System.Object(this);
            var len = obj.length >> 0;
            var k = 0;
            thisArg = thisArg || this;
            while (k<len)if( k in obj)
            {
                if( callback.call(thisArg, obj[k++], k, obj) )
                {
                    return obj[k];
                }
            }
            return;
        }
    });
}

if (!Array.from)
{
    Object.defineProperty(Array,"from",{value:(function () {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };
    
        return function from(arrayLike) {
            var C = this;
            var items = Object(arrayLike);
            if (arrayLike == null) {
            throw new TypeError("Array.from requires an array-like object - not null or undefined");
            }
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
            if (!isCallable(mapFn)) {
                throw new TypeError('Array.from: when provided, the second argument must be a function');
            }
            if (arguments.length > 2) {
                T = arguments[2];
            }
            }
            var len = toLength(items.length);
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);
            var k = 0;
            var kValue;
            while (k < len) {
            kValue = items[k];
            if (mapFn) {
                A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
            } else {
                A[k] = kValue;
            }
            k += 1;
            }
            A.length = len;
            return A;
        };
        }())
    });
}

if (!Array.of)
{
    Object.defineProperty(Array,"of",{value:function of() {
       return Array.prototype.slice.call(arguments);
    }});
}