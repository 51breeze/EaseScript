/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Symbol,Internal;
 */
var storage=Internal.createSymbolStorage( Symbol('namespace') );
var codeMap={};
function Namespace(prefix, uri)
{
    storage(this, true, {prefix:prefix||'',uri:uri||''});
}

Namespace.getCodeByUri=function getCodeByUri(uri){
    return codeMap[uri] || '';
};

Namespace.valueOf=function valueOf(){
    return '[Namespace object]';
};

Namespace.toString=function toString(){
    return '[Namespace object]';
};
Namespace.prototype = Object.create( Object.prototype );
Namespace.prototype.constructor=Namespace;
Namespace.prototype.toString=function toString(){
    return this.valueOf();
};
Namespace.prototype.valueOf=function valueOf(){
    var data = storage(this);
    return data.prefix+data.uri;
};
System.Namespace = Namespace;