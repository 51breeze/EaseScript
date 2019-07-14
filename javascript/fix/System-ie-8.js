if (System.env.platform(System.env.BROWSER_IE,8))
{
    System.typeOf = function typeOf(instanceObj)
    {
        if ( instanceObj == null )return 'object';
        if ( System.isClass( instanceObj ) )return 'class';
        if ( System.isInterface( instanceObj )  )return 'interface';
        if ( System.isNamespace( instanceObj) )return 'namespace';
        var val = typeof instanceObj;
        if( val === "object" && /function/i.test(instanceObj+"") )
        {
            return "function";
        } else if( val === 'function' && ( instanceObj.constructor === RegExp ) )
        {
            return "object";
        }
        return val;
    };
}