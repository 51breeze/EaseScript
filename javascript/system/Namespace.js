/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Symbol;
 */
var storage=Internal.createSymbolStorage( Symbol('namespace') );
var codeMap={};
function Namespace(prefix, uri)
{
    storage(this, true, {prefix:prefix||'',uri:uri||''});
}

Object.defineProperty(Namespace,"getCodeByUri", {value:function getCodeByUri(uri){
    return codeMap[uri] || '';
}});

Object.defineProperty(Namespace,"valueOf", {value:function valueOf(){
    return '[object Namespace]';
}});

Object.defineProperty(Namespace,"toString", {value:function toString(){
    return '[object Namespace]';
}});

Object.defineProperty(Namespace.prototype,"constructor", {value:Namespace});
Object.defineProperty( Namespace.prototype, "toString", {value:function toString(){
    return '[object Namespace]';
}});

Object.defineProperty( Namespace.prototype, "valueOf", {value:function valueOf(){
    var data = storage(this);
    return data.prefix+data.uri;
}});

System.Namespace = Namespace;