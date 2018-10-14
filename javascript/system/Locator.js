/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,TypeError
 */

var map={
    "host":location.hostname,
    "origin":location.origin,
    "scheme":location.protocol.replace(/:$/,''),
    "port":location.port,
    "uri":location.search,
    "url":location.href,
    "filename":"",
    "path":[],
    "query":{},
    "fragment":[]
}

var fragment = location.href.match(/(#\w+)/g);
if( fragment )
{
    map.fragment = fragment;
}

var query = map.uri.match(/[\w\-]+\=[^\&]*/g);
if( query )
{
    var obj = {};
    for(var i in query)
    {
        var item = query[i].split("=");
        map.query[ item[0] ] = item[1]||'';
    }
}

var path = location.pathname.replace(/^\//,"");
if( path )
{
    path = path.split("/");
    if( path[0].indexOf(".") > 0 )
    {
        map.filename = path.shift();
    }else if( path[ path.length-1 ].indexOf(".") > 0 ){
        map.filename = path.pop();
    }
    map.path = path;
}

/**
 * 资源定位器
 * @constructor
 */
function Locator()
{
    throw new TypeError("Locator is not constructor");
}

/**
 * 返回地址栏中的URL
 * @returns {string|*}
 */
Locator.url=function url()
{
    return map.url;
}

/**
 * 返回地址栏中的URI
 * @returns {string}
 */
Locator.uri=function uri()
{
    return map.uri;
}

/**
 * 返回地址栏中请求的路径部分。如查指定index则返回位于index索引的路径名，否则返回一个数组。
 * 给定的index必须是一个从0开始的整数
 * @param index
 * @returns {*}
 */
Locator.path = function path( index )
{
    if( index >= 0 )
    {
        return map.path[index];
    }
    return map.path.slice(0);
}

/**
 * 返回地址栏中请求的主机名称
 * @returns {string}
 */
Locator.host = function host()
{
    return map.host;
}

/**
 * 返回地址栏中的资源地址
 * 通常是一个带有请求协议的主机名
 * @returns {string}
 */
Locator.origin = function origin()
{
   return map.origin;
}

/**
 * 返回地址样中的请求协议
 * 通常为http,https
 * @returns {string}
 */
Locator.scheme = function scheme()
{
    return map.scheme;
}

/**
 * 返回端口号
 * @returns {string|*}
 */
Locator.port = function port()
{
    return map.port;
}

/**
 * 返回指定位置的片段名（锚点名）, 从URL的左边开始索引
 * 如果没有指定索引则返回一个数组
 * @param index
 * @returns {Array}
 */
Locator.fragment = function fragment( index )
{
    if( index >=0 )
    {
        return map.fragment[ index ] || null;
    }
    return map.fragment.slice(0);
}

/**
 * 返回指定名称的值， 如果没有返回指定的默认值
 * @param name 查询指定的key名称
 * @param defaultValue 默认值，默认返回null
 * @returns {*}
 */
Locator.query = function query(name, defaultValue)
{
    if( typeof name === "string" )
    {
        defaultValue = typeof defaultValue === "undefined" ? null : defaultValue;
        return map.query[name] || defaultValue;
    }
    return Object.merge({}, map.query);
}
System.Locator = Locator;