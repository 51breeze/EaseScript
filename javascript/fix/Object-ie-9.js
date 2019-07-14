/**
 * 生成一个对象
 */
if( !Object.create  )
{
    Object.create = (function () {
        function F() {
        }
        var $has = Object.prototype.hasOwnProperty;
        return function (O, P) {
            if (typeof O != 'object'){
                throw new TypeError('Object prototype may only be an Object or null');
            }
            F.prototype = O;
            var obj = new F();
            //F.prototype = null;
            if (P != null)
            {
                P = Object(P);
                for (var n in P)if ($has.call(P, n))
                {
                   Object.defineProperty(obj, n, P[n]);
                }
                if( P.constructor && P.constructor.value )
                {
                    Object.defineProperty(obj, 'constructor', P.constructor );
                }
            }
            return obj;
        };
    })();
}

