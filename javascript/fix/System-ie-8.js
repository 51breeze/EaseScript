if (System.env.platform(System.env.BROWSER_IE) && System.env.version(8, '<='))
{
    System.typeOf = function typeOf(instanceObj)
    {
        if (instanceObj instanceof System.Class )return 'class';
        if (instanceObj instanceof System.Interface)return 'interface';
        if (instanceObj instanceof System.Namespace)return 'namespace';
        var val = typeof instanceObj;
        if( val === "object" && /function/i.test(instanceObj+"") )
        {
            return "function";

        } else if( val === 'function' && (instanceObj.constructor === System.RegExp || instanceObj.constructor===$RegExp ) )
        {
            return "object";
        }
        return val;
    };
}