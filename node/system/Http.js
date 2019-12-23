/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require System,Object,EventDispatcher,JSON,HttpEvent
*/

/**
 * HTTP 请求类
 * @param options
 * @returns {Http}
 * @constructor
 */
function Http( options )
{
    if ( !(this instanceof Http) )return new Http(options);
    EventDispatcher.call(this);
    this.options = options;
    this.loading = false;
    this.queues = [];
    this.responseHeaders = {};
}

module.exports = Http;

var Object = require("./Object.js");
var axios = require("@axios");
var EventDispatcher = require("./EventDispatcher.js");
var HttpEvent = require("./HttpEvent.js");
var System = require("./System.js");

/**
 * @private
 * 完成请求
 * @param event
 */
function done(response, url, data, method)
{
    this.loading=false;
    this.responseHeaders=response.headers;

    var e = new HttpEvent( HttpEvent.SUCCESS );
    e.data = response.data || {};
    e.status = response.status;
    e.url = url;
    e.param = data;
    e.method = method;

    this.dispatchEvent(e);
    if( this.queues.length>0)
    {
        var queue = this.queues.shift();
        this.load.apply(this, queue);
    }
}


function error(error, url, data, method)
{
    var e = new HttpEvent(HttpEvent.ERROR);
    e.url = url;
    e.status = 500;
    if( error.response )
    {
        e.data =  error.response.data || {};
        e.status =  error.response.status;
        this.responseHeaders=error.response.headers;

    }else 
    {
        e.data = error.message;
    }

    e.url = url;
    e.param = data;
    e.method = method;
    this.dispatchEvent(e);

    if( this.queues.length>0)
    {
        var queue = this.queues.shift();
        this.load.apply(this, queue);
    }
}

/**
 * Difine constan Http accept type
 */
Http.ACCEPT_XML= "application/xml,text/xml";
Http.ACCEPT_HTML= "text/html";
Http.ACCEPT_TEXT="text/plain";
Http.ACCEPT_JSON= "application/json, text/javascript";
Http.ACCEPT_ALL= "*/*";

/**
 * Difine constan Http contentType data
 */
Http.HEADER_TYPE_URLENCODED= "application/x-www-form-urlencoded";
Http.HEADER_TYPE_FORM_DATA="multipart/form-data";
Http.HEADER_TYPE_PLAIN="text/plain";
Http.HEADER_TYPE_JSON="application/json";

/**
 * Difine constan Http dataType format
 */
Http.TYPE_HTML= 'html';
Http.TYPE_XML= 'xml';
Http.TYPE_JSON= 'json';
Http.TYPE_JSONP= 'jsonp';

/**
 * Difine Http method
 */
Http.METHOD_GET='GET';
Http.METHOD_POST='POST';
Http.METHOD_PUT='PUT';
Http.METHOD_DELETE='DELETE';

/**
 * 继承事件类
 * @type {Object|Function}
 */
Http.prototype = Object.create( EventDispatcher.prototype,{
    "constructor":{value:Http}
});

/**
 * 取消请求
 * @returns {Boolean}
 */
Object.defineProperty(Http.prototype,"option", {value:function option(name, value)
{
    if( typeof name  === "object" ){
        this.options = name;
        return this;
    }

    var options = this.options;
    if( value == null ){
        return options[ name ];
    }
    options[ name ] = value;
    return this;
}});

/**
 * 取消请求
 * @returns {Boolean}
 */
Object.defineProperty(Http.prototype,"abort", {value:function abort()
{
    if( this.cancel )
    {
        this.cancel();
        var event = new HttpEvent(HttpEvent.CANCELED);
        event.data = null;
        event.status = -1;
        event.url = this.cancel.url;
        event.param = this.cancel.data;
        event.method = this.cancel.method;
        this.dispatchEvent(event);
        return true;
    }
    return false;
}});

/**
 * 发送请求
 * @param data
 * @returns {boolean}
 */
Object.defineProperty(Http.prototype,"load",{value:function load(url, data, method)
{
    if (typeof url !== "string")throw new Error('Invalid url');

    var options = this.options;
    var method = method || options.method;
    if( this.loading ===true )
    {
        options.queues.push( [url, data, method] );
        return false;
    }

    this.loading=true;
    if ( typeof method === 'string' )
    {
        method = method.toUpperCase();
        if( Http["METHOD_"+method] !==method )
        {
            throw new Error('Invalid method for ' + method);
        }
    }

    var request = System.environments("HTTP_REQUEST");
    var baseURL = undefined;
    if( request )
    {
        baseURL = request.protocol+"://"+request.host;
    }

    var target = this;
    axios({
        method: method,
        url:url,
        baseURL:baseURL,
        data: method === "GET" ? undefined : data,
        params: method === "GET" ? data : undefined,
        headers:options.header || undefined,
        timeout:options.timeout || 3000,
        withCredentials:!!options.withCredentials,
        auth:options.auth || undefined,
        responseType:options.dataType || Http.TYPE_JSON,
        responseEncoding:options.responseEncoding || "utf8",
        xsrfCookieName:options.xsrfCookieName || "XSRF-TOKEN",
        xsrfHeaderName:options.xsrfHeaderName || "X-XSRF-TOKEN",
        onUploadProgress:options.onUploadProgress || undefined,
        onDownloadProgress:options.onDownloadProgress || undefined,
        maxContentLength:options.maxContentLength || 2000,
        validateStatus:options.validateStatus || undefined,
        maxRedirects:options.maxRedirects || 5,
        socketPath:options.socketPath || null,
        proxy:options.proxy || undefined,
        cancelToken:new axios.CancelToken( (cancel)=>{
            cancel.url = url;
            cancel.data = data;
            cancel.method = method;
            this.cancel = cancel;
        })
      }).then(function(response) {
          done.call(target, response, url, data, method );
      }).catch(function(err){
         error.call(target, err, url, data, method );
      });
}});

/**
 * 设置Http请求头信息
 * @param name
 * @param value
 * @returns {Http}
 */
Object.defineProperty(Http.prototype,"setRequestHeader",{value:function setRequestHeader(name, value)
{
    var options = this.__options__;
    if (typeof value !== "undefined" )
    {
        options.header[name] = value;
    }
    return this;
}});

/**
 * 获取已经响应的头信息
 * @param name
 * @returns {null}
 */
Object.defineProperty(Http.prototype,"getResponseHeader",{value:function getResponseHeader(name) {

    return typeof name === 'string' ? this.responseHeaders[ name.toLowerCase() ] || '' : this.responseHeaders;
}});