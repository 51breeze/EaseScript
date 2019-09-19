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
    if( !isSupported )throw new Error('Http the client does not support');
    if ( !(this instanceof Http) )return new Http(options);
    EventDispatcher.call(this);
    Object.defineProperty(this,"__options__", {value:Object.merge(true,{},setting, options)});
    options = this.__options__;
    options.xhr = null;
    options.loading = false;
    options.setHeader = false;
    options.queues = [];
    options.param = null;
    options.responseHeaders = {};
    options.timeoutTimer = null;
}

module.exports = Http;
var Object = require("./Object.js");
var EventDispatcher = require("./EventDispatcher.js");
var System = require("./System.js");
var JSON = require("./JSON.js");
var HttpEvent = require("./HttpEvent.js");
var isSupported=false;
var XHR=null;
var localUrl='';
var patternUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
var protocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
var patternHeaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;
var localUrlParts=[];
var setting = {
    async: true
    , dataType: 'html'
    , method: 'GET'
    , timeout: 30
    , charset: 'UTF-8'
    , header: {
        'contentType': 'application/x-www-form-urlencoded'
        ,'Accept': "text/html"
        ,'X-Requested-With': 'XMLHttpRequest'
    }
};

if( typeof window !=="undefined" )
{
    XHR = window.XMLHttpRequest || window.ActiveXObject;
    isSupported= !!XHR;
    localUrl = window.location.href;
    localUrlParts = patternUrl.exec( localUrl.toLowerCase() ) || [];
}

/**
 * @private
 * 完成请求
 * @param event
 */
function done(event)
{
    var options = this.__options__;
    var xhr = options.xhr;
    if (xhr.readyState !== 4 || xhr.status==0 )return;
    var match, result = null, headers = {};
    System.clearTimeout(options.timeoutTimer);
    options.timeoutTimer = null;

    //获取响应头信息
    if( typeof xhr.getAllResponseHeaders === "function" )
    {
        while ( ( match = patternHeaders.exec(xhr.getAllResponseHeaders()) ) )
        {
            headers[match[1].toLowerCase()] = match[2];
        }
    }
    options.loading=false;
    options.responseHeaders=headers;
    if (xhr.status >= 200 && xhr.status < 300)
    {
        result = xhr.responseXML;
        if (options.dataType.toLowerCase() === Http.TYPE_JSON)
        {
            try {
                result = JSON.parse( xhr.responseText );
            } catch (e) {
                throw new Error('Invalid JSON the ajax response');
            }
        }
    }

    var e = new HttpEvent( HttpEvent.SUCCESS );
    e.originalEvent = event;
    e.data = result || {};
    e.status = xhr.status;
    e.url = options.url;
    e.param = options.param;
    this.dispatchEvent(e);
    if( options.queues.length>0)
    {
        var queue = options.queues.shift();
        this.load.apply(this, queue);
    }
}
function loadStart(event)
{
    var e = new HttpEvent(HttpEvent.LOAD_START);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    this.dispatchEvent(e);
}

function progress(event)
{
    var e = new HttpEvent(HttpEvent.PROGRESS);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    e.loaded = event.loaded;
    e.total = event.total;
    this.dispatchEvent(e);
}

function error()
{
    var e = new HttpEvent(HttpEvent.ERROR);
    var xhr = event.currentTarget;
    e.url = xhr.__url__;
    e.originalEvent = event;
    this.dispatchEvent(e);
}

function getXHR( target )
{
    var xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new window.ActiveXObject("Microsoft.XMLHTTP");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4)done.call( target );
    };
    return xhr;
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
    var options = this.__options__;
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
    var options = this.__options__;
    if (options.xhr)
    {
        try{options.xhr.abort();}catch(e){}
        var event = new HttpEvent(HttpEvent.CANCELED);
        event.data = null;
        event.status = -1;
        event.url = this.__url__;
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
    var options = this.__options__;
    var method = method || options.method;
    var async = !!options.async;
    var xhr;

    if( options.loading ===true )
    {
        options.queues.push( [url, data, method] );
        return false;
    }

    options.loading=true;
    options.url= url;
    options.param= data;

    if (typeof method === 'string')
    {
        method = method.toUpperCase();
        if ( Http["METHOD_"+method] !==method )throw new Error('Invalid method for ' + method);
    }

    try
    {
        if( options.dataType.toLowerCase() === Http.TYPE_JSONP )
        {
            xhr = new ScriptRequest( async );
            xhr.addEventListener(HttpEvent.SUCCESS, function (event)
            {
                if ( options.timeoutTimer )
                {
                    System.clearTimeout( options.timeoutTimer );
                    options.timeoutTimer = null;
                }
                options.loading=false;
                event.url=options.url;
                this.dispatchEvent(event);

            }, false, 0, this);
            xhr.send(url, data, method);

        } else
        {
            xhr = options.xhr = getXHR( this );
            data = data != null ? System.serialize(data, 'url') : null;
            if (method === Http.METHOD_GET && data)
            {
                if (data != '')url += /\?/.test(url) ? '&' + data : '?' + data;
                data = null;
            }
            options.url = url;
            xhr.open(method, url, async);
            if( options.setHeader===false )
            {
                //设置请求头 如果请求方法为post
                if( method === Http.METHOD_POST)
                {
                    options.header.contentType = Http.HEADER_TYPE_URLENCODED;
                }

                //设置编码
                if (!/charset/i.test(options.header.contentType))
                {
                    options.header.contentType += ';' + options.charset;
                }

                try {
                    var name;
                    for (name in options.header) {
                        xhr.setRequestHeader(name, options.header[name]);
                    }
                } catch (e) {}

                //设置可以接收的内容类型
                try {
                    xhr.overrideMimeType(options.header.Accept);
                } catch (e) {}
            }
            options.setHeader=true;
            xhr.send(data);
        }

    } catch (e)
    {
        throw new Error('Http the client does not support('+e.message+')');
    }

    //设置请求超时
    options.timeoutTimer = System.setTimeout((function (url,self)
    {
        return function () {
            self.abort();
            if(self.hasEventListener(HttpEvent.TIMEOUT))
            {
                var event = new HttpEvent(HttpEvent.TIMEOUT);
                event.data =null;
                event.status = 408;
                event.url = url;
                self.dispatchEvent(event);
            }
            if (self.__timeoutTimer__)
            {
                System.clearTimeout(self.__timeoutTimer__);
                options.timeoutTimer = null;
            }
        }
    })(url,this), options.timeout * 1000);
    return true;
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
    var options = this.__options__;
    if( !options.responseHeaders )return '';
    return typeof name === 'string' ? options.responseHeaders[ name.toLowerCase() ] || '' : options.responseHeaders;
}});

//脚本请求队列
var queues = [];

/**
 * 通过脚本请求服务器
 * @returns {ScriptRequest}
 * @constructor
 */
function ScriptRequest( async )
{
    if (!(this instanceof ScriptRequest))
    {
        return new ScriptRequest();
    }
    var target = document.createElement('script');
    target.setAttribute('type', 'text/javascript');
    EventDispatcher.call(this, target);
    queues.push(this);
    this.__key__ = 's'+queues.length+System.uid();
    this.__target__ = target;
    this.__async__ = !!async;
}

ScriptRequest.prototype = Object.create(EventDispatcher.prototype,{
    "constructor":{value:ScriptRequest}
});
ScriptRequest.prototype.__key__ = null;
ScriptRequest.prototype.__target__ = null;
ScriptRequest.prototype.__async__ = null;
ScriptRequest.prototype.__sended__ = false;

var headElement = null;

/**
 * 开始请求数据
 * @param url
 * @param data
 * @param async
 */
ScriptRequest.prototype.send = function send(url, data)
{
    if (this.__sended__)return false;
    this.__sended__ = true;
    if (typeof url !== 'string')throw new Error('Invalid url.');
    var param = [];
    if(data!=null)param.push( System.serialize(data, 'url') );
    param.push('k=' + this.__key__ );
    param.push('JSONP_CALLBACK=JSONP_CALLBACK');
    param = param.join('&');
    url += !/\?/.test(url) ? '?' + param : '&' + param;
    var target = this.__target__;
    if( this.__async__ )target.setAttribute('async', 'async');
    target.setAttribute('src', url);
    if( headElement === null )
    {
        headElement = document.head || document.getElementsByTagName("head")[0];
    }

    if( !headElement || !headElement.parentNode )
    {
        throw new ReferenceError("Head element is not exist.");
    }

    if (!target.parentNode)
    {
        headElement.appendChild(target);
    }
};

/**
 * 终止请求
 */
ScriptRequest.prototype.abort = function ()
{
    this.__canceled__ = true;
    var target = this.__target__;
    if (target && target.parentNode) {
        target.parentNode.removeChild(target);
    }
    return true;
};

/**
 * 脚本请求后的响应回调函数
 * @param data 响应的数据集
 * @param key 向服务器请求时的 key。 此 key 是通知每个请求对象做出反应的唯一编号。
 * @public
 */
Http.JSONP_CALLBACK = function JSONP_CALLBACK(data, key)
{
    var index = Math.max(queues.length - 1, 0);
    if (typeof key !== "undefined") while (index > 0) {
        if (queues[index].__key__ == key)break;
        index--;
    }
    if (queues[index] && queues[index].__key__ == key)
    {
        var target = queues.splice(index, 1).pop();
        if (!target.__canceled__) {
            var event = new HttpEvent(HttpEvent.SUCCESS);
            event.data = data;
            event.status = 200;
            target.dispatchEvent(event);
        }
    }
};

if( typeof window !=="undefined" )
{
   window.JSONP_CALLBACK=Http.JSONP_CALLBACK;
}