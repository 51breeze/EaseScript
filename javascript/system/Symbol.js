/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Internal
 */
var Internal = require("./Internal.js");
var System = require("./System.js");
var hasSymbol = !!Internal.$Symbol;
var _Symbol = Internal.$Symbol || (function()
{
    var tables={};
    var hash={};
    var prefix ='@@symbol';
    var prefixLen =  prefix.length;
    var SYMBOL_KEY_NAME = prefix+'(SYMBOL_KEY_NAME)';
    var SYMBOL_KEY_VALUE= prefix+'(SYMBOL_KEY_VALUE)';
    function isSymbolPropertyName( propName )
    {
        if( propName==null || hasSymbol===true )return false;
        propName=propName.toString();
        return propName.substr(0,prefixLen) === prefix+'(' && propName.substr(-1)===')';
    }

    var factor = (function () {
        return function Symbol( name ){
            this[SYMBOL_KEY_NAME] = name || '';
            this[SYMBOL_KEY_VALUE]= prefix+'('+System.uid()+')';
        };
    }());

    /**
     * Symbol对象
     * @param name
     * @constructor
     */
    function Symbol( name )
    {
        if(this instanceof Symbol)
        {
            throw new TypeError('is not constructor');
        }
        return new factor(name);
    }
    Symbol.prototype.constructor = Symbol;
    factor.prototype = Symbol.prototype;

    /**
     * 返回Symbol的原始值
     * @returns {string}
     */
    Symbol.prototype.toString=function toString()
    {
        return this[SYMBOL_KEY_VALUE];
        //throw new TypeError ("can't convert symbol to string");
    };

    /**
     * 返回Symbol的表示式
     * @returns {string}
     */
    Symbol.prototype.valueOf=function valueOf()
    {
        return this[SYMBOL_KEY_VALUE];
    };

    /**
     * 在注册表中生成一个指定名称的symbol。并返回symbol对象
     * @param name
     * @returns {Symbol}
     */
    Symbol["for"] = function( name )
    {
        if( tables[name] )return tables[name];
        tables[name] = Symbol( name );
        hash[ tables[name][SYMBOL_KEY_VALUE] ]=name;
        return tables[name];
    };

    /**
     * 返回在注册表中的symbol名称
     * 如果不存在返回undefined
     * @param symbol
     * @returns {*}
     */
    Symbol.keyFor=function keyFor( symbol )
    {
        if( symbol instanceof Symbol )
        {
            return hash[ symbol[SYMBOL_KEY_VALUE] ];
        }
        return undefined;
    };
    Symbol.isSymbolPropertyName = isSymbolPropertyName;
    return Symbol;

}());

module.exports =_Symbol;