(function(definedModules){
    var installedModules = {};
    function require( identifier )
    {
        if( installedModules[identifier] )
        {
            return installedModules[identifier].exports;
        }
    
        if( !definedModules.hasOwnProperty(identifier) )
        {
            throw new ReferenceError( identifier +" is not define.");
        }
    
        var module = installedModules[identifier] = {
            id: identifier,
            exports: {}
        };
    
        definedModules[identifier].call(module.exports, module, require);
        return module.exports;
    }
    
    require.has=function has( identifier )
    {
        return definedModules.hasOwnProperty(identifier);
    }
    return require("[CODE[BOOTSTRAP_CLASS]]");
}([CODE[MODULES]]));