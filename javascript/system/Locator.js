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
    return (urlSegments.scheme||location.protocol||"http")+"://"+(urlSegments.host||location.hostname)
        +(urlSegments.port ? ":"+urlSegments.port : "")
        +( urlSegments.path && urlSegments.path.length>0? "/"+urlSegments.path.join("/") : "" )
        +(query?"?"+query:"");
}

var cached={};

/**
 * 创建一个指定的url的分段信息
 * @param url  一个完整的url信息
 * @param name 返回指定的段名部分
 * @return {}
 */
Locator.create=function create(url,name)
{
    if( typeof url !== "string" )return false;
    url = System.trim(url);
    if( !/^(https?|file|ftp|udp|tcp)\:\/\//i.test(url) )
    {
        var http = location.protocol+"//"+location.hostname+(location.port ? ":"+location.port : "");
        url = url.charAt(0) === "/" || url.charAt(0) === "?" ? http+url : http+"/"+url;
    }

    var segments = cached[ url ];
    if( !segments )
    {
        segments= cached[ url ] = {};

        var pos = url.indexOf(":");
        segments.scheme = pos > 0 && pos < 6 ? url.slice(0,pos).toLowerCase() : null;
        segments.url = url;

        url = url.slice(pos+1).replace(/^\/+/g,'');
        pos = url.indexOf( segments.scheme==="file" ? ":" : "/");

        segments.host = pos > 0 ? url.slice( 0, pos ) : null;
        segments.uri  = (pos > 0 ? url.slice( segments.scheme==="file" ? pos+1 : pos ) : url).replace(/^\/\//g,'/');
        segments.path = segments.uri;
        segments.fragment=[];
        segments.query = {};
        url = segments.uri;

        if( segments.host && segments.host.indexOf("@") > 0 )
        {
            var info = segments.host.split("@",2);
            if( info[0] )
            {
                var userinfo = info[0].split(":",2);
                segments.username = userinfo[0];
                segments.password = userinfo[1];
            }

            if( info[1] )
            {
               segments.host = info[1];
            }
        }

        if( segments.host && segments.host.indexOf(":") > 0 )
        {
            var hostinfo = segments.host.split(":");
            if( hostinfo[0] ){
               segments.host = hostinfo[0];
            }
            if( hostinfo[1] ){
                segments.port = hostinfo[1];
            }
        }
      
        var query = null;
        pos = url.indexOf("?");
        if( pos >=0 )
        {
            segments.path = url.slice(0, pos);
            url = url.slice( pos+1 );
            query = url;
        }

        if( segments.path )
        {
            var path = segments.path.replace(/^\/+|\/+$/g,"");
            segments.path = path ? path.split("/") : [];
        }

        pos = url.indexOf("#");
        if( pos >= 0 )
        {
            if( query )
            {
                query = url.slice(0,pos)
            }
            url = url.slice(pos+1);
            if( url ){
                segments.fragment = url.split("#");
            }
        }
        
        if( query )
        {
            query = query.split("&");
            for(var i=0;i<query.length;i++)
            {
                var item = query[i].split("=",2);
                segments.query[ System.trim(item[0]) ] = item.length > 1 ? window.decodeURIComponent( item[1] ) : "";
            }
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