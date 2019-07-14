/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Symbol,Internal;
 */

function Namespace(prefix, uri)
{
    storage(this, true, {prefix:prefix||'',uri:uri||''});
}

module.exports = Namespace;
var Object = require("./Object.js");
var Symbol = require("./Symbol.js");
var System = require("./System.js");
var Internal = require("./Internal.js");
var storage=Internal.createSymbolStorage( Symbol('Namespace') );
var codeMap={};

Object.defineProperty( Namespace, "getCodeByUri", {value:function getCodeByUri(uri){
    return codeMap[uri] || '';
}});

Object.defineProperty( Namespace, "valueOf", {value:function valueOf(){
    return '[Namespace object]';
}});

Object.defineProperty( Namespace, "toString", {value:function toString(){
    return '[Namespace object]';
}});

Namespace.prototype = Object.create( Object.prototype,{
    "constructor":{value:Namespace},
    "toString":{
        value:function toString(){
            return this.valueOf();
        }
    },
    "valueOf":{
        value:function valueOf(){
            var data = storage(this);
            return data.prefix+data.uri;
        }
    }
});


System.Namespace = Namespace;