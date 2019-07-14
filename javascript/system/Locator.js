/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,TypeError
 */

/**
 * 资源定位器
 * @constructor
 */
function Locator()
{
    throw new TypeError("Locator is not constructor");
}

module.exports = Locator;
var Object = require("./Object.js");
var TypeError = require("./TypeError.js");
var System = require("./System.js");
var urlSegments={};

/**
 * 返回地址栏中的URL
 * @returns {string|*}
 */
Locator.url=function url()
{
    return urlSegments.url;
}

/**
 * 返回地址栏中的URI
 * @returns {string}
 */
Locator.uri=function uri()
{
    return urlSegments.uri;
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
        return urlSegments.path[index];
    }
    return urlSegments.path.slice(0);
}

/**
 * 返回地址栏中请求的主机名称
 * @returns {string}
 */
Locator.host = function host()
{
    return urlSegments.host;
}

/**
 * 返回地址栏中的资源地址
 * 通常是一个带有请求协议的主机名
 * @returns {string}
 */
Locator.origin = function origin()
{
   return urlSegments.origin;
}

/**
 * 返回地址样中的请求协议
 * 通常为http,https
 * @returns {string}
 */
Locator.scheme = function scheme()
{
    return urlSegments.scheme;
}

/**
 * 返回端口号
 * @returns {string|*}
 */
Locator.port = function port()
{
    return urlSegments.port;
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
        return urlSegments.fragment[ index ] || null;
    }
    return urlSegments.fragment.slice(0);
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
        return urlSegments.query[name] || defaultValue;
    }
    return Object.merge({}, urlSegments.query);
}

/**
 * 将一个url的片段组装成url
 * @param urlSegments
 * @return {string}
 */
Locator.toUrl=function toUrl( urlSegments )
{
    var query = System.serialize(urlSegments.query||{},"url",true);
    if( urlSegments.fragment )
    {
        if( typeof urlSegments.fragment === "string" )
        {
            query+="#"+urlSegments.fragment;
        }else if( urlSegments.fragment.length > 0)
        {
            query+="#"+urlSegments.fragment.join("#");
        }
    }
    return (urlSegments.scheme||"http")+"://"+urlSegments.host
        +(urlSegments.port ? ":"+urlSegments.port : "")
        +( urlSegments.path && urlSegments.path.length>0? "/"+urlSegments.path.join("/") : "" )
        +(query?"?"+query:"");
}

/**
 * 创建一个指定的url的分段信息
 * @param url  一个完整的url信息
 * @param name 返回指定的段名部分
 * @return {}
 */
Locator.create=function create(url,name){
    if( typeof url !== "string" )return false;
    url = System.trim(url);
    if( !/^(https?|file)\:\/\//i.test(url) ){
       var http = location.protocol+"//"+location.hostname+(location.port ? ":"+location.port : "");
       url = url.charAt(0) === "/" || url.charAt(0) === "?" ? http+url : http+"/"+url;
    }

    var match= url.match(/^((https?)\:\/\/)([\w\.\-]+)(\:(\d+))?(((\/([a-zA-Z]+[\w+](\.[a-zA-Z]+[\w+])?)*)+)?(\?(&?\w+\=?[^&#=]*)+)?(#[\w\,\|\-\+]*)?)?$/i);
    if( !match && /^file\:\/\//i.test(url) )
    {
        match= url.match(/^((file)\:\/\/\/)([a-zA-Z]+\:)(\:(\d+))?(((\/([a-zA-Z]+[\w+](\.[a-zA-Z]+[\w+])?)*)+)?(\?(&?\w+\=?[^&#=]*)+)?(#[\w\,\|\-\+]*)?)?$/i);
    }

    if( !match )return null;
    var segments={
        "host":match[3],
        "origin":match[2]+"://"+match[3]+(match[5]?":"+match[5]:""),
        "scheme":match[2],
        "port":match[5]||"",
        "uri":match[6],
        "url":url,
        "path":[],
        "query":{},
        "fragment":[]
    }

    var info = segments.uri.split("?",2);
    var path = info[0].substr(1);
    segments.path = path.split("/");
    if( info[1] )
    {
        var query=info[1];
        query = query.replace(/#([\w\,\|\-\+]+)$/g, function (a, b) {
            if (b) segments.fragment.push(b);
            return "";
        });
        query = query.split("&");
        for (var i in query) {
            var item = query[i].split("=");
            segments.query[System.trim(item[0])] = window.decodeURIComponent(System.trim(item[1]));
        }
    }
    return name ? segments[name] : segments;
}

/**
 * 返回一个匹配的路由服务提供者
 * @param name
 * @return {*}
 */
Locator.match = function match( name )
{
    var segments = name;
    if( typeof name === "string" ) {
        segments = Locator.create(name);
    }
    if( !segments )return null;
    if( segments.host !== location.hostname ){
        return null;
    }
    var pathName = System.environments("URL_PATH_NAME");
    if( typeof segments.query[ pathName ] !== "undefined" )
    {
        name = segments.query[ pathName ];
    }else{
        name = '/'+segments.path.join('/');
    }

    var routes = System.environments("HTTP_ROUTES");
    for(var method in routes)
    {
        var route = routes[method];
        if( typeof route[name] !== "undefined" )
        {
            return route[name];
        }
    }
    return null;
}
urlSegments = Locator.create(location.href)||{
    "host":"",
    "origin":"",
    "scheme":"",
    "port":"",
    "uri":"",
    "url":location.href,
    "path":[],
    "query":{},
    "fragment":[]
};