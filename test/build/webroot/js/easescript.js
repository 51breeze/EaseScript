(function(definedModules, undefined){

var httpRoutes = {
	"get":{
		"/MyIndex":"IndexApplication@home",
		"/MyIndex/viewport":"IndexApplication@viewport",
		"/MyIndex/list":"IndexApplication@list",
		"/MyIndex/home":"IndexApplication@home",
		"/MyIndex/index":"IndexApplication@index",
		"/Person":"PersonApplication@index"
	},
	"post":{
		"/MyIndex/home":"IndexApplication@home",
		"/MyIndex/add":"IndexApplication@add"
	},
	"put":{
		"/MyIndex/home":"IndexApplication@home"
	}
};
var defaultRoute = "IndexApplication@home";

/**
 * 运行环境相关信息
 */
var env={
    "HTTP_DEFAULT_ROUTE":defaultRoute,
    "HTTP_ROUTES":httpRoutes,
    "HTTP_ROUTE_PATH":null,
    "MODE":3,
    "ORIGIN_SYNTAX":"javascript",
    "URL_PATH_NAME":"PATH",
    "HTTP_ROUTE_CONTROLLER":null,
    "COMMAND_SWITCH":0,
    "VERSION":1564835921314,
    "LOAD_JS_PATH":"js",
    "LOAD_CSS_PATH":"css",
    "MODULE_SUFFIX":".es"
};

/**
 * 框架信息
 */
var EaseScript = {
    "Requirements":{"IndexApplication.es":{"script":"js/IndexApplication.js?v=8cf411d6e04e6ccb","css":"css/IndexApplication.css?v=8cf411d6e04e6ccb","require":[]},"PersonApplication.es":{"script":"js/PersonApplication.js?v=8cf411d6e04e6ccb","css":"css/PersonApplication.css?v=8cf411d6e04e6ccb","require":[]}},
    "Load":{},
    "Environments":env
};

/**
 * 已加载的模块
 */
var installedModules = {};

/**
 * 加载并初始化模块
 * @param string 
 */
function require( classname )
{
    if( installedModules[classname] )
    {
        return installedModules[classname].exports;
    }

    var module = installedModules[classname] = {
        id: classname,
        exports: {}
    };

	definedModules[classname].call(module.exports, module, require);
	return module.exports;
}

var Internal= require("system/Internal.es");
var locator = require("system/Locator.es");
var Object  = require("system/Object.es");
var System  = require("system/System.es");
var Event   = require("system/Event.es");
var global  = System.getGlobalEvent();
Object.merge(Internal.env, env);

/**
 * 加载指定的脚本文件
 * @param filename
 * @param callback
 * @param classname
 * @return {HTMLScriptElement}
 */
var loadMap = {};
function loadScript(filename,callback){

    if( loadMap[filename] )
    {
        if(typeof callback === "function"){
            callback();
        }
        return loadMap[filename];
    }
    var script = null;
    var match = filename.match(/\.(css|js)[$|\?]/i);
    switch ( match && match[1].toLowerCase() ){
        case "js" :
            script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', filename );
            break;
        case "css":
            script = document.createElement('link');
            script.setAttribute('rel', 'stylesheet');
            script.setAttribute('href', filename );
            break;
    }
    if( !script )
    {
        throw new TypeError("Invalid script file. only support css or js for the '"+filename+"'");
    }
    loadMap[filename] = script;
    if( callback )
    {
        var loaded = false;
        script.onreadystatechange = script.onload = function (e) {
            if ((script.readyState == 'loaded' || script.readyState == 'complete' || script.readyState == 4) || (e && e.type === "load")) {
                script.onreadystatechange  = script.onload = null;
                if(loaded===false){
                    callback(e);
                    loaded = true;
                }
            }
        }
    }
    var headElement = document.head || document.getElementsByTagName("head")[0];
    if( !headElement || !headElement.parentNode )
    {
        throw new ReferenceError("Head element is not exist.");
    }
    headElement.appendChild(script);
    return script;
}

/**
 * 开始执行应该模块
 * @param module
 * @param method
 */
function start(module, method)
{
    try {
        var main = require( module );
        var obj = new main();
        global.dispatchEvent(new Event(Event.INITIALIZING));
        var response = obj[method]();
        if (global.hasEventListener(Event.INITIALIZE_COMPLETED)) {
            global.dispatchEvent(new Event(Event.INITIALIZE_COMPLETED));
        }
        return response;
    }catch(e)
    {
        throw e.valueOf();
    }
}

/**
 * 加载器
 * @param requirements
 * @param then
 */
function loader(requirements, then)
{
    if( !requirements || !(requirements.length > 0) )return then();
    requirements = requirements.slice(0);
    (function load() {
       requirements.length > 0 ? loadScript(requirements.shift(), load) :  then();
    }());
}

/**
 * 初始化模块文件
 * @param {} module 
 */
function initModule(module)
{
    if( typeof EaseScript.Load[module] === "function" && EaseScript.Load[module].init !==true )
    {
        EaseScript.Load[module].init = true;
        var modules = EaseScript.Load[module].call( EaseScript, require );
        Object.forEach( modules, function(classModule,classname)
        {
            if( !definedModules.hasOwnProperty(classname) )
            {
                definedModules[ classname ] = classModule;
            }
        });
    }
}

var handle = "8cf411d6e04e6ccb";
EaseScript.Load = (typeof window[ handle ] === "object" &&  window[ handle ].Load) || {};
window[ handle ]=EaseScript;

/**
 * 文档加载就绪
 */
global.addEventListener(Event.READY,function (e) {

    try{
       
        var router = httpRoutes.get || {};
        var path = locator.query( env.URL_PATH_NAME );
        if( !path ){
            path = '/'+locator.path().join("/");
        }
        //指定需要执行的模块
        router = router[ path ] || defaultRoute;
        var controller = router.split("@");
        var module = controller[0];
        var method = controller[1];
        env.HTTP_ROUTE_CONTROLLER=router;
        if( typeof httpRoutes.get[ path ] !== "undefined"){
            env.HTTP_ROUTE_PATH = path ;
        }else{
            Object.forEach(httpRoutes.get,function (provider, name) {
                if( provider === router ){
                    env.HTTP_ROUTE_PATH = name;
                    return false;
                }
            });
        }

        //调度指定模块中的方法
        (env.HTTP_DISPATCHER=function(module, method, callback)
        {
            module = module+env.MODULE_SUFFIX;
            //如果存在先初始化
            initModule(module);
            //如果模块类已经加载
            if( System.hasClass( module ) )
            {
                typeof callback === "function" ? callback( start(module, method) ) : start(module, method);
            }
            //需要加载模块及模块相关脚本
            else
            {
                //如果没有配置指定的模块
                var moduleInfo = EaseScript.Requirements[ module ]
                if( !moduleInfo || !moduleInfo.script )
                {
                    throw new ReferenceError("Not found the '"+module+"'." );
                }

                //加载模块样式
                if( moduleInfo.css )
                {
                    loadScript( moduleInfo.css );
                }

                //加载模块依赖文件
                loader(moduleInfo.require, function () {
                    //加载主模块
                    loadScript(moduleInfo.script, function () {
                        //初始化模块
                        initModule(module);
                        typeof callback === "function" ? callback( start(module, method) ) : start(module, method);
                    },module);
                });
            }
        })(module, method);

    }catch(e)
    {
        window.console.log(e);
        throw new Error( e.message );
    }
},false,-500);

}({

/***** Class es/core/Application.es *****/

"es/core/Application.es": function(module,require){
var Application=function Application(){
constructor.apply(this,arguments);
};
module.exports=Application;
var View=require("es/core/View.es");
var Interaction=require("es/core/Interaction.es");
var ApplicationEvent=require("es/events/ApplicationEvent.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Element=require("system/Element.es");
var System=require("system/System.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"appContainer":null,"initiated":false,"_dataset":{},"_async":true}});

	EventDispatcher.call(this,document);
	this[__PRIVATE__].appContainer=Element.createElement("div");
	this[__PRIVATE__].appContainer.className="application";
};
var __PRIVATE__=Symbol("es.core.Application").valueOf();
var method={"E6_lastApp":{"writable":true,"value":null,"type":8}
};
for(var prop in method){
	Object.defineProperty(Application, prop, method[prop]);
}
var proto={"constructor":{"value":Application},"E6_appContainer":{"writable":true,"value":null,"type":8}
,"E6_initiated":{"writable":true,"value":false,"type":8}
,"getContainer":{"value":function getContainer(){
	var event;
	var container=this[__PRIVATE__].appContainer;
	if(this[__PRIVATE__].initiated===false){
		event=new ApplicationEvent(ApplicationEvent.FETCH_ROOT_CONTAINER);
		event.setContainer(container);
		if(this.dispatchEvent(event)){
			if(System.is(event.getContainer(), IDisplay)){
				container=Reflect.type(Reflect.get(Application,Reflect.type(event.getContainer(),IDisplay).getElement(),0),Node);
			}
			else {
				container=Reflect.type(event.getContainer(),Node);
			}
			if(!event.defaultPrevented){
				if(Application.E6_lastApp){
					document.body.removeChild(Application.E6_lastApp);
				}
				document.body.appendChild(container);
				Application.E6_lastApp=container;
			}
		}
		this[__PRIVATE__].initiated=true;
		this[__PRIVATE__].appContainer=container;
	}
	return container;
},"type":1}
,"assign":{"value":function assign(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Application",134);
	if(value==null){
		return this[__PRIVATE__]._dataset[name];
	}
	return this[__PRIVATE__]._dataset[name]=value;
},"type":1}
,"E6__dataset":{"writable":true,"value":{},"type":8}
,"getDataset":{"value":function dataset(){
	return this[__PRIVATE__]._dataset;
},"type":2},"setDataset":{"value":function dataset(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.Application",159);
	this[__PRIVATE__]._dataset=value;
},"type":4},"getTitle":{"value":function title(){
	return Reflect.type(this[__PRIVATE__]._dataset.title,String);
},"type":2},"setTitle":{"value":function title(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.Application",168);
	this[__PRIVATE__]._dataset.title=value;
	document.title=value;
},"type":4},"E6__async":{"writable":true,"value":true,"type":8}
,"getAsync":{"value":function async(){
	return true;
},"type":2},"setAsync":{"value":function async(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Application",194);
	this[__PRIVATE__]._async=flag;
},"type":4},"getComponentId":{"value":function getComponentId(prefix){
	if(prefix === undefined ){prefix="";}
	if(!System.is(prefix, String))throw new TypeError("type does not match. must be String","es.core.Application",217);
	return "";
},"type":1}
,"n2_render":{"value":function render(view){
	if(!System.is(view, View))throw new TypeError("type does not match. must be View","es.core.Application",225);
	view.display();
	return view;
},"type":1}
};
Application.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/Application.es",Application,{
	"extends":null,
	"package":"es.core",
	"classname":"Application",
	"uri":["E6","n2","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** System system/Internal.es *****/

"system/Internal.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

module.exports =(function(
Internal,
$Object,
$Array,
$String,
$Number,
$Function,
$RegExp,
$Boolean,
$Date,
$Math,
$Error,
$SyntaxError,
$TypeError,
$EvalError,
$ReferenceError,
$JSON,
$Symbol,
$console
){

/**
 * 环境参数配置
 */
var env = Internal.env = {
    'BROWSER_IE': 'IE',
    'BROWSER_FIREFOX': 'FIREFOX',
    'BROWSER_CHROME': 'CHROME',
    'BROWSER_OPERA': 'OPERA',
    'BROWSER_SAFARI': 'SAFARI',
    'BROWSER_MOZILLA': 'MOZILLA',
    'NODE_JS': 'NODE_JS',
    'IS_CLIENT': false
};

var _platform = [];
if (typeof navigator !== "undefined") 
{
    var ua = navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? _platform = [env.BROWSER_IE, parseFloat(s[1])] :
    (s = ua.match(/firefox\/([\d.]+)/)) ? _platform = [env.BROWSER_FIREFOX, parseFloat(s[1])] :
    (s = ua.match(/chrome\/([\d.]+)/)) ? _platform = [env.BROWSER_CHROME, parseFloat(s[1])] :
    (s = ua.match(/opera.([\d.]+)/)) ? _platform = [env.BROWSER_OPERA, parseFloat(s[1])] :
    (s = ua.match(/version\/([\d.]+).*safari/)) ? _platform = [env.BROWSER_SAFARI, parseFloat(s[1])] :
    (s = ua.match(/^mozilla\/([\d.]+)/)) ? _platform = [env.BROWSER_MOZILLA, parseFloat(s[1])] : null;
    env.IS_CLIENT = true;

} else if (typeof process !== "undefined")
{
    _platform = [env.NODE_JS, process.versions.node];
}

/**
 * 获取当前运行平台
 * @returns {*}
 */
env.platform = function platform(name, version)
{
    if ( typeof name === "string" )
    {
        name = name.toUpperCase();
        if( version > 0 )return name == _platform[0] && env.version( version );
        return name == _platform[0];
    }
    return _platform[0];
};

/**
 * 判断是否为指定的浏览器
 * @param type
 * @returns {string|null}
 */
env.version = function version(value, expre) {
    var result = _platform[1];
    if (value == null)return result;
    value = parseFloat(value);
    switch (expre) {
        case '=' :
            return result == value;
        case '!=' :
            return result != value;
        case '>' :
            return result > value;
        case '>=' :
            return result >= value;
        case '<=' :
            return result <= value;
        case '<' :
            return result < value;
        default:
            return result <= value;
    }
};

Internal.defineProperty = $Object.defineProperty;

/**
* 定义属性描述
*/
if( !Internal.defineProperty || Internal.env.version(Internal.env.BROWSER_IE,8) )
{
    Internal.defineProperty = function defineProperty(obj, prop, desc)
    {
        if( obj == null)
        {
            throw new TypeError('target is non-object');
        }
        return obj[prop] = desc.value;
    }
}


Internal.createSymbolStorage=function(symbol)
{
    return function(target, name, value )
    {
        if( name === true )
        {
            target[ symbol ]=value;
            return value;
        }
        var data = target[ symbol ];
        if( !data )
        {
            data={};
            target[ symbol ]=data;
        }
        if( typeof value !== "undefined" )
        {
            if( typeof data[ name ] === "number" )
            {
                if (value === "increment")return data[name]++;
                if (value === "decrement")return data[name]--;
            }
            data[ name ]=value;
            return value;
        }
        return name==null ? data : data[ name ];
    }
};

var classValueMap={
    1:"Class",
    2:"Interface",
    3:"Namespace",
}
var modules = {};
Internal.defineClass=function(name,classFactory,desc,type)
{
    Internal.defineProperty(classFactory,"name",{enumerable: false, value: name,configurable:false});
    if( type != 3 )
    {
        Internal.defineProperty(classFactory, "valueOf", { enumerable: false, value:function valueOf(){
            return "["+classValueMap[type]+" "+name+"]";
        },configurable:false});
    }

    Internal.defineProperty(classFactory, "toString", { enumerable: false, value:function toString(){
        return "["+classValueMap[type]+" "+name+"]";
    },configurable:false});

    Internal.defineProperty(classFactory, "constructor", { enumerable: false, value:classFactory,configurable:false});
    Internal.defineProperty(classFactory, "__CLASS__", { enumerable: false, value:name,configurable:false});
    Internal.defineProperty(classFactory, "__RESOURCETYPE__", { enumerable: false, value:type,configurable:false});
    Internal.defineProperty(classFactory, "__T__", { enumerable: false,value:desc,configurable:false});

    modules[ name ] = classFactory;
    return classFactory;
}

Internal.getClassModule=function( name )
{
    if( modules.hasOwnProperty(name) )
    {
        return modules[name];
    }
    return null;
}

Internal.$Object = $Object;
Internal.$Array = $Array;
Internal.$String = $String;
Internal.$Number = $Number;
Internal.$Function = $Function;
Internal.$RegExp = $RegExp;
Internal.$Boolean = $Boolean;
Internal.$Date = $Date;
Internal.$Error = $Error;
Internal.$Math = $Math;
Internal.$SyntaxError = $SyntaxError;
Internal.$TypeError = $TypeError;
Internal.$SyntaxError = $SyntaxError;
Internal.$EvalError = $EvalError;
Internal.$ReferenceError = $ReferenceError;
Internal.$JSON = $JSON;
Internal.$Symbol = $Symbol;
Internal.$console = $console;
return Internal;

}({},Object,Array,String,Number,Function,RegExp,Boolean,Date,Math,Error,SyntaxError,TypeError,EvalError,ReferenceError,JSON,Symbol,console));
},

/***** System system/Error.es *****/

"system/Error.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object
 */
function Error( message , filename, line )
{
    message = message ||"";
    var obj = $Error.call(this, message);
    obj.name = this.name;
    this.stack = (obj.stack || '').toString();
    this.message = message;
    this.line=line || 0;
    this.filename =filename || '';
}

module.exports = Error;
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var $Error = Internal.$Error;

Error.prototype =Object.create( $Error.prototype,{
    "constructor":{value:Error},
    "valueOf":{value:function toString()
    {
        var msg = [];
        if( this.filename )msg.push( this.filename );
        if( this.line )msg.push( this.line );
        if( msg.length > 0 )
        {
            return this.name+': '+this.message+'\n at '+ msg.join(':') + '\n' + this.stack;
        }
        return this.name+': '+this.message+'\n'+ this.stack;
    }}
});

Error.prototype.line=null;
Error.prototype.name='Error';
Error.prototype.message=null;
Error.prototype.filename=null;
Error.prototype.stack='';


},

/***** System system/ReferenceError.es *****/

"system/ReferenceError.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function ReferenceError( message , filename,line )
{
    Error.call(this, message , filename, line);
}

module.exports =ReferenceError;
var Error =require("system/Error.es");
var Object =require("system/Object.es");

ReferenceError.prototype = Object.create( Error.prototype ,{
    "constructor":{value:ReferenceError}
});
ReferenceError.prototype.name='ReferenceError';
},

/***** System system/TypeError.es *****/

"system/TypeError.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object
 */
function TypeError( message , filename, line)
{
    Error.call(this, message , filename, line);
}

module.exports =TypeError;
var Object =require("system/Object.es");
var Error =require("system/Error.es");

TypeError.prototype =Object.create( Error.prototype ,{
    "constructor":{value:TypeError}
});
TypeError.prototype.name='TypeError';
},

/***** System system/Array.es *****/

"system/Array.es": function(module,require){
/*
* Copyright © 2017 EaseScript All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/EaseScript
* @author Jun Ye <664371281@qq.com>
* @require System,Object,ReferenceError,TypeError
*/
function Array(length)
{
    if( !(this instanceof Array) )
    {
        var obj = new Array();
        $Array.apply(obj , Array.prototype.slice.call(arguments, 0) );
        return obj;
    }
    $Array.call(this);
    if( arguments.length > 0 )
    {
        if( typeof length === 'number' && arguments.length===1 )
        {
            this.length = length;
        }else
        {
            Array.prototype.splice.apply(this, [0,0].concat( Array.prototype.slice.call(arguments,0) ) );
        }
    }
    return this;
};

module.exports = Array;
var Internal =require("system/Internal.es");
var System =require("system/System.es");
var Object =require("system/Object.es");
var ReferenceError =require("system/ReferenceError.es");
var TypeError =require("system/TypeError.es");
var $Array = Internal.$Array;

Array.prototype = Object.create( Object.prototype,{
    "constructor":{value:Array},  
    /**
     * 返回此对象的字符串
     * @returns {*}
     */
    "toString":{value:function toString()
    {
        if( this.constructor === Array ){
            return "[object Array]";
        }
        return Object.prototype.toString.call(this);
    }},

    /**
     * 返回此对象的数据值
     * @returns {*}
     */
    "valueOf":{value:function valueOf()
    {
        if( this.constructor === Array ){
            return this.slice(0);
        }
        return Object.prototype.valueOf.call(this);
    }},
    "length":{value:0,writable:true},
    "slice":{value:$Array.prototype.slice},
    "concat":{value:$Array.prototype.concat},
    "splice":{value:$Array.prototype.splice},
    "join":{value:$Array.prototype.join},
    "pop":{value:$Array.prototype.pop},
    "push":{value:$Array.prototype.push},
    "shift":{value:$Array.prototype.shift},
    "unshift":{value:$Array.prototype.unshift},
    "sort":{value:$Array.prototype.sort},
    "reverse":{value:$Array.prototype.reverse},
    "toLocaleString":{value:$Array.prototype.toLocaleString},
    "indexOf":{value:$Array.prototype.indexOf},
    "lastIndexOf":{value:$Array.prototype.lastIndexOf},
    "map":{value:$Array.prototype.map},

    /**
     * 循环对象中的每一个属性，只有纯对象或者是一个数组才会执行。
     * @param callback 一个回调函数。
     * 参数中的第一个为属性值，第二个为属性名。
     * 如果返回 false 则退出循环
     * @returns {Object}
     */
    "forEach":{value:$Array.prototype.forEach || function forEach(callback, thisArg)
        {
            if (!System.isFunction(callback)) throw new TypeError(callback + " is not a function");
            if (this == null) throw new ReferenceError('this is null or not defined');
            var i = 0;
            var len = this.length;
            for(;i<len;i++)
            {
                callback.call(thisArg||this, this[i], i );
            }
            return this;
        }
    },


    /**
     * 方法使用指定的函数测试所有元素，并创建一个包含所有通过测试的元素的新数组。
     * @param callback
     * @param thisArg
     * @returns {Array}
     */
    "filter":{value:$Array.prototype.filter || function filter(callback, thisArg)
        {
            if (typeof callback !== 'function')throw new TypeError('callback must be a function');
            if (this==null)throw new ReferenceError('this is null or not defined');
            var items = new Array();
            var obj = System.Object(this);
            var len = obj.length >> 0;
            var k = 0;
            thisArg = thisArg || this;
            while (k<len)
            {
                if( k in obj && callback.call(thisArg, obj[k], k, obj) )
                {
                    items.push(obj[k]);
                }
                k++;
            }
            return items;
        }
    },

    /**
     * 返回一个唯一元素的数组
     * @returns {Array}
     */
    "unique":{value:function unique()
        {
            if (this==null)throw new ReferenceError('this is null or not defined');
            var obj = System.Object(this);
            var arr = Array.prototype.slice.call(obj,0);
            var i=0;
            var b;
            var len = arr.length >> 0;
            for(;i<len;i++)
            {
                b = i+1;
                for (;b<len;b++)if(arr[i]===arr[b])arr.splice(b, 1);
            }
            return arr;
        }
    },

    /**
     * 将一个数组的所有元素从开始索引填充到具有静态值的结束索引
     * @param value
     * @param start
     * @param end
     * @returns {Object}
     */
    "fill":{value:function fill(value, start, end)
        {
            if (this==null)throw new ReferenceError('this is null or not defined');
            if (!(System.is(this, Array) || System.isArray(this)))throw new ReferenceError('this is not Array');
            var len = this.length >> 0;
            var relativeStart = start >> 0;
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
            var relativeEnd = end == null ? len : end >> 0;
            var final = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
            while (k < final) {
                this[k] = value;
                k++;
            }
            return this;
        }
    },

    /**
     * 返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
     * @param callback
     * @param thisArg
     * @returns {*}
     */
    "find":{value:function find(callback, thisArg)
        {
            if (typeof callback !== 'function')throw new TypeError('callback must be a function');
            if (this==null)throw new ReferenceError('this is null or not defined');
            var obj = System.Object(this);
            var len = obj.length >> 0;
            var k = 0;
            thisArg = thisArg || this;
            while (k<len)if( k in obj)
            {
                if( callback.call(thisArg, obj[k++], k, obj) )
                {
                    return obj[k];
                }
            }
            return;
        }
    }
});

/**
 * 返回一个数组
 * @type {Function}
 */
if( !Array.prototype.map )
{
    Object.defineProperty(Array.prototype,"map", {value:function map(callback, thisArg)
    {
        var T, A, k;
        if (this == null)throw new TypeError("this is null or not defined");
        if (!System.isFunction(callback))throw new TypeError(callback + " is not a function");
        var O =  System.isArray(this) ? this : [];
        var len = O.length >>> 0;
        if (thisArg)T = thisArg;
        A = new Array(len);
        k = 0;
        var kValue, mappedValue;
        while(k < len) {
            if (k in O) {
                kValue = O[ k ];
                mappedValue = callback.call(T, kValue, k, O);
                A[ k ] = mappedValue;
            }
            k++;
        }
        return A;
    }});
}
/**
 * 返回指定元素的索引位置
 * @param searchElement
 * @returns {number}
 */
if ( !Array.prototype.indexOf )
{
    Object.defineProperty(Array.prototype,"indexOf", {value:function indexOf(searchElement, fromIndex)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var obj = Object(this);
        var len = obj.length >>> 0;
        if (len === 0)return -1;
        var n = +fromIndex || 0;
        if ( System.Math.abs(n) === System.Infinity)n = 0;
        if (n >= len)return -1;
        var k = System.Math.max(n >= 0 ? n : len - System.Math.abs(n), 0);
        while (k < len)
        {
            if (k in obj && obj[k] === searchElement)return k;
            k++;
        }
        return -1;
    }});
}

if (!Array.prototype.lastIndexOf)
{
    Object.defineProperty(Array.prototype,"indexOf", {value:function lastIndexOf(searchElement)
    {
        if (this == null)throw new TypeError('this is null or not defined');
        var n, k, t = Object(this), len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        n = len - 1;
        if (arguments.length > 1)
        {
            n = Number(arguments[1]);
            if (n != n) {
                n = 0;
            }
            else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
            {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--)
        {
            if (k in t && t[k] === searchElement)
            {
                return k;
            }
        }
        return -1;
    }});
}
},

/***** System system/JSON.es *****/

"system/JSON.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object, Array
 */
var Internal =require("system/Internal.es");
var _JSON= Internal.$JSON || (function()
{
    function JSON() {
        if (this instanceof JSON)throw new TypeError('JSON is not constructor.');
    }
    var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
    var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
    function escFunc(m) {
        return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);
    }
    JSON.parse = function (strJson)
    {
        return eval('(' + strJson + ')');
    };

    JSON.stringify = function(value)
    {
        if (value == null) return 'null';
        var type = typeof value;
        if (type === 'number')return System.isFinite(value) ? value.toString() : 'null';
        if (type === 'boolean')return value.toString();
        if (type === 'object') {
            var tmp = [];
            if (typeof value.toJSON === 'function') {
                return JSON.stringify(value.toJSON());
            } else if (System.instanceOf(value, Array)) {
                for (var i = 0; i < value.length; i++)tmp.push(JSON.stringify(value[i]));
                return '[' + tmp.join(',') + ']';
            } else if (System.isObject(value)) {
                for (var b in value)tmp.push(JSON.stringify(b) + ':' + JSON.stringify(value[b]));
                return '{' + tmp.join(',') + '}';
            } else {
                var items = Object.prototype.getEnumerableProperties.call(value);
                for (var i = 0; i < items.length; i++)tmp.push(JSON.stringify(items[i].key) + ':' + JSON.stringify(items[i].value));
                return '{' + tmp.join(', ') + '}';
            }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
    };
    return JSON;

}());

module.exports = _JSON;
var Object =require("system/Object.es");
var Array =require("system/Array.es");
var System =require("system/System.es");

},

/***** System system/Symbol.es *****/

"system/Symbol.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Internal
 */
var Internal =require("system/Internal.es");
var System =require("system/System.es");
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
},

/***** System system/Namespace.es *****/

"system/Namespace.es": function(module,require){
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
var Object =require("system/Object.es");
var Symbol =require("system/Symbol.es");
var System =require("system/System.es");
var Internal =require("system/Internal.es");
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
},

/***** System system/SyntaxError.es *****/

"system/SyntaxError.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function SyntaxError(  message , filename, line)
{
    Error.call(this, message , filename, line);
};

module.exports =SyntaxError;
var Object =require("system/Object.es");
var Error =require("system/Error.es");

SyntaxError.prototype = Object.create( Error.prototype ,{
    "constructor":{value:SyntaxError}
});
SyntaxError.prototype.name='SyntaxError';
},

/***** System system/Reflect.es *****/

"system/Reflect.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,System,Namespace,Error,TypeError,ReferenceError,SyntaxError
 */

function Reflect()
{ 
    throw new SyntaxError('Reflect is not constructor.');
}
module.exports =Reflect;
var Object =require("system/Object.es");
var ReferenceError =require("system/ReferenceError.es");
var Namespace =require("system/Namespace.es");
var TypeError =require("system/TypeError.es");
var SyntaxError =require("system/SyntaxError.es");
var Object =require("system/Object.es");
var System =require("system/System.es");
var Internal =require("system/Internal.es");
var $Reflect = Internal.$Reflect;
var $has = Object.prototype.hasOwnProperty;
var ATTR_TYPE={
    1:"function",
    2:"get",
    4:"set",
    8:"var",
    16:"const",
    32:"namespace"
};
var _construct = $Reflect ? $Reflect.construct : function construct(theClass,args)
{
    if( !System.isFunction( theClass ) )
    {
        throw new TypeError('is not function');
    }
    switch ( args.length )
    {
        case 0 :
            return new theClass();
        case 1 :
            return new theClass(args[0]);
        case 2 :
            return new theClass(args[0], args[1]);
        case 3 :
            return new theClass(args[0], args[1], args[2]);
        default :
            return Function('f,a', 'return new f(a[' + System.range(0, args.length).join('],a[') + ']);')(theClass, args);
    }
};

var _apply = $Reflect ? $Reflect.apply : function apply(target, thisArgument, argumentsList)
{
    if( System.typeOf(target) !== "function" )
    {
        throw new TypeError('is not function');
    }
    thisArgument = thisArgument === target ? undefined : thisArgument;
    if (argumentsList != null) {
        return target.apply(thisArgument === target ? undefined : thisArgument, argumentsList);
    }
    if (thisArgument != null) {
        return target.call(thisArgument);
    }
    return target();
};

function fetchAccessorName(name,accessor)
{
    return accessor+(name.substr(0,1).toUpperCase()+name.substr(1));
}

function fetchDescObject(target, prop, value, desc, accessor )
{
    if( accessor && ATTR_TYPE[ desc.type ] === accessor )
    {
        var def = {"prop": prop, "desc": desc};
        def[ accessor ] = desc.value;
        return def;
    }
    return {"target":target,"prop": prop,"value":value, "desc": desc};
}

function fetchMethodAndAttributeDesc(context,proto,target,name,isstatic,accessor,ns)
{
    var prop = accessor ? fetchAccessorName(name,accessor) : name;
    prop = ns ? ns+'_'+prop : prop;
    if( $has.call(proto,prop) )
    {
        var desc = proto[prop];

        //静态成员
        if( isstatic )
        {
            return fetchDescObject(target, prop, target[prop], desc, accessor );
        }
        //实例成员
        else
        {
            //私有实例属性
            if( context && context.__T__.uri[0]===ns )
            {
                var _private = context.__T__.privateSymbol.valueOf();
                if( $has.call( target[_private], name ) )
                {
                    return fetchDescObject(target[_private], name, target[_private][name], desc, accessor);
                }
            }
            return fetchDescObject(proto, prop, desc.value, desc, accessor);
        }
    }
    if( accessor )
    {
       return fetchMethodAndAttributeDesc(context,proto,target, name,isstatic,'',ns);
    }
    return null;
}

function getNamespaceUri(context, ns)
{
    if( !ns || !(ns.length > 0) )
    {
        return context ? context.__T__.uri : [];
    }
    var uri = context.__T__.uri.slice(0);
    var len = ns.length;
    for(;i<len;i++)
    {
        var item = ns[i];
        if( item instanceof Namespace )
        {
            uri.push( Namespace.getCodeByUri( item.valueOf() ) );
        }
    }
    return uri;
}

function description(scope, target, name , receiver , ns, accessor)
{
    //表示获取一个类中的属性或者方法（静态属性或者静态方法）
    if( System.isClass(target.constructor) )
    {
        var isstatic = ( !receiver || receiver === target ) && System.isClass(target);
        var objClass = isstatic ? target : target.constructor;
        var context = System.isClass(scope) ? scope : null;
        var proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;

        //获取公开的属性
        var desc = fetchMethodAndAttributeDesc( context, proto, target, name, isstatic, accessor, '');
        if( desc )
        {
            return desc;
        }

        //获取带有命名空间的属性
        var uri = getNamespaceUri( context, ns);
        do{ 
            var i = uri.length;
            proto = isstatic ? objClass.__T__.method : objClass.__T__.proto;
            while ( proto && (i--) > 0)
            {
                desc = fetchMethodAndAttributeDesc( context, proto, target, name, isstatic, accessor, uri[i]);
                if ( desc )
                {
                    return desc;
                }
            }

        }while( !isstatic && System.isClass(objClass = objClass.__T__["extends"]) );

        if( accessor && accessor==="set" )
        {
           return {"writable":false};
        }

        objClass = (objClass || Object).prototype;
        var obj = objClass[name];
        if( obj )
        {
            return {"target":objClass, "prop": name, "value":obj, "desc": {value:obj} };
        }
    }
    return null;
};


/**
 * 静态方法 Reflect.apply() 通过指定的参数列表发起对目标(target)函数的调用
 * @param theClass
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.apply=function apply(target, thisArgument, argumentsList )
{
    if( !System.isFunction( target ) || System.isClass(target) )
    {
        throw new TypeError('target is not function');
    }

    if( !System.isArray(argumentsList) )
    {
        argumentsList = typeof argumentsList !== "undefined" ? [argumentsList] : [];
    }
    return _apply(target, thisArgument, argumentsList);
};

/**
 * 调用一个对象上的函数
 * @param target
 * @param propertyKey
 * @param thisArgument
 * @param argumentsList
 * @returns {*}
 */
Reflect.call=function call(scope, target, propertyKey,argumentsList,thisArgument,ns)
{
    if( target == null )throw new ReferenceError('target is null or undefined');
    if( propertyKey==null ){
        return Reflect.apply( target, thisArgument, argumentsList );
    }
    var fn = Reflect.get(scope,target, propertyKey, thisArgument , ns );
    if( typeof fn !== "function" )
    {
        throw new TypeError('target.'+propertyKey+' is not function');
    }
    return _apply(fn, thisArgument||target, argumentsList||[]);
};

/**
 * Reflect.construct() 方法的行为有点像 new 操作符 构造函数 ， 相当于运行 new target(...args).
 * @param target
 * @param argumentsList
 * @returns {*}
 */
Reflect.construct=function construct(target , args)
{
    if( System.isClass(target) )
    {
        if( target.__T__.abstract )
        {
            throw new TypeError('Abstract class cannot be instantiated');
        }
    }
    return _construct(target, args || []);
};

/**
 * 静态方法 Reflect.deleteProperty() 允许用于删除属性。它很像 delete operator ，但它是一个函数。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.deleteProperty=function deleteProperty(target, propertyKey)
{
    if( !target || propertyKey==null )return false;
    if( propertyKey==="__proto__")return false;
    if( System.isClass(target) ){
        if( target.__T__.dynamic !==true )return false;
        if( target.__T__.privateSymbol === propertyKey)return false;
    }
    if( $has.call(target,propertyKey) )
    {
        return (delete target[propertyKey]);
    }
    return false;
};

/**
 * 静态方法 Reflect.has() 作用与 in 操作符 相同。
 * @param target
 * @param propertyKey
 * @returns {boolean}
 */
Reflect.has=function has(scope, target, propertyKey)
{
    if( propertyKey==null || target == null )return false;
    if( propertyKey==="__proto__")return false;
    if( System.isClass(target.constructor) )
    {
        return !!description(scope,target,propertyKey,null,null,"get");
    }
    return propertyKey in target;
};

Reflect.type=function type(value, typeClass)
{
    if( typeof typeClass === "string" )
    {
        var original = value;
        typeClass = typeClass.toLowerCase();
        switch ( typeClass )
        {
            case "integer" :
            case "int" :
            case "number":
            case "uint":
                value = parseInt(value);
                if (typeClass !== "number")
                 {
                    if (typeClass === "uint" && value < 0)
                    {
                        throw new System.RangeError(original + " convert failed. can only be an unsigned Integer");
                    }
                    if (value > 2147483647 || value < -2147483648)
                    {
                        throw new System.RangeError(original + " convert failed. the length of overflow Integer");
                    }
                }
                break;
            case "double":
            case "float":
                value = parseFloat(value);
                break;
            case "class" :
               if( !System.isClass(value) )
               {
                   throw new System.TypeError(original + " is not Class.");
               }
               break;
        }
        return value;
    }
    if( value == null || typeClass === Object )return value;
    if( typeClass && !System.is(value, typeClass) )
    {
        var classname = System.isClass(typeClass.constructor) ? typeClass.constructor.__CLASS__ :  System.typeOf( typeClass );
        var up = System.ucfirst( System.typeOf( typeClass ) );
        if( System[ up ] ){
            classname = up;
        }
        throw new System.TypeError( value+' can not be convert for ' + classname );
    }
    return value;
};

/**
 * 获取目标公开的属性值
 * @param target
 * @param propertyKey
 * @returns {*}
 */
Reflect.get=function(scope,target, propertyKey, receiver , ns )
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    var desc = description(scope,target,propertyKey,receiver,ns,"get");
    receiver = receiver || target;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )return undefined;
        return target[propertyKey];
    }
    if( desc.get )
    {
        return desc.get.call( System.isClass(receiver) ? null : receiver);
    }
    return desc.value;
};

/**
 * 设置目标公开的属性值
 * @param target
 * @param propertyKey
 * @param value
 * @returns {*}
 */
Reflect.set=function(scope,target, propertyKey, value , receiver ,ns )
{
    if( propertyKey==null )return target;
    if( target == null )throw new ReferenceError('target is null or undefined');
    var desc = description(scope,target,propertyKey,receiver,ns,"set");
    var isstatic = System.isClass(target);
    receiver = receiver || target;
    if( !desc )
    {
        //内置对象属性外部不可访问
        if( propertyKey === '__proto__' )
        {
            throw new ReferenceError('__proto__ is not writable');
        }
        if( isstatic )
        {
            throw new ReferenceError(propertyKey+' is not exists');
        }
        var objClass = target.constructor;
        if( System.isClass(objClass) ) 
        {
            if( objClass.__T__.dynamic !==true )
            {
                throw new ReferenceError(propertyKey+' is not exists');
            }
            var obj = target[propertyKey];
            //如果是一个动态对象并且是第一次赋值时存在此属性名则认为是原型对象上的类成员， 不能赋值。
            if( obj && !$has.call(target,propertyKey) )
            {
                throw new TypeError(propertyKey+' is not configurable');
            }

        }
        //如果是一个静态类不能赋值。
        else if( typeof target ==="function" )
        {
            throw new TypeError(propertyKey+' is not configurable');
        }
        return target[propertyKey]=value;
    }
    if( desc.set )
    {
        return desc.set.call( isstatic ? null : receiver, value);
    }
    if( desc.writable === false  )
    {
        throw new ReferenceError(propertyKey+' is not writable');
    }
    if( typeof desc.target === "object" || typeof desc.target === "function" )
    {
        return desc.target[ desc.prop ] = value;
    }
    throw new ReferenceError(propertyKey+' is not writable');
};

Reflect.incre=function incre(scope,target, propertyKey, flag , ns)
{
    flag = flag !== false;
    var val = Reflect.get(scope,target, propertyKey, undefined, ns );
    var ret = val+1;
    Reflect.set(scope,target, propertyKey, ret , undefined, ns );
    return flag ? val : ret;
}

Reflect.decre= function decre(scope,target, propertyKey, flag , ns )
{
    flag = flag !== false;
    var val = Reflect.get(scope,target, propertyKey, undefined, ns );
    var ret = val-1;
    Reflect.set(scope,target, propertyKey, ret , undefined, ns );
    return flag ? val : ret;
}
},

/***** System system/Function.es *****/

"system/Function.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Array,Object
 */
function Function() {
    return $Function.apply(this, Array.prototype.slice.call(arguments,0) );
};

module.exports = Function;
var Object =require("system/Object.es");
var Array =require("system/Array.es");
var Internal =require("system/Internal.es");
var $Function = Internal.$Function;

Function.prototype = Object.create( Object.prototype );
Function.prototype.apply = $Function.prototype.apply;
Function.prototype.call = $Function.prototype.call;
Function.prototype.bind = $Function.prototype.bind;

/**
 * 绑定一个对象到返回的函数中
 * 返回一个函数
 * @type {bind}
 */
if( !Function.prototype.bind )
{
    var Array = require("./Array.js");
    var TypeError = require("./TypeError.js");
    Object.defineProperty(Function.prototype,"bind", {value:function bind(thisArg)
    {
        if (typeof this !== "function")throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        var args = Array.prototype.slice.call(arguments, 1),
            fn = this,
            Nop = function () {
            },
            Bound = function () {
                return fn.apply(this instanceof Nop ? this : thisArg || this, args.concat(Array.prototype.slice.call(arguments)));
            };
        Nop.prototype = this.prototype;
        Bound.prototype = new Nop();
        return Bound;
    }});
}
},

/***** System system/System.es *****/

"system/System.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
* @require System,Internal;
*/


var System={};
var Internal =require("system/Internal.es");
module.exports =System;

/**
 * 系统环境
 */
System.env = Internal.env;

var Object =require("system/Object.es");
var Array =require("system/Array.es");
var JSON =require("system/JSON.es");
var Reflect =require("system/Reflect.es");
var Function =require("system/Function.es");
var EventDispatcher =require("system/EventDispatcher.es");
var $Object = Internal.$Object;
var $Array = Internal.$Array;
var $Function = Internal.$Function;

System.isFinite = isFinite;
System.decodeURI = decodeURI;
System.decodeURIComponent = decodeURIComponent;
System.encodeURI = encodeURI;
System.encodeURIComponent = encodeURIComponent;
System.isNaN = isNaN;
System.Infinity = Infinity;
System.parseFloat = parseFloat;
System.parseInt = parseInt;

;(function(f){
    System.setTimeout =f(setTimeout);
    System.setInterval =f(setInterval);
})(function(f){return function(c,t){
    var a=[].slice.call(arguments,2);
    return f( function(){ c.apply(this,a) }, t ) };
});
System.clearTimeout = function(id){
    return clearTimeout( id );
};
System.clearInterval = function(id){
    return clearInterval( id );
};

/**
 * 返回对象类型的字符串表示形式
 * @param instanceObj
 * @returns {*}
 */
System.typeOf = function typeOf(instanceObj)
{
    if (instanceObj == null )
    {
        return instanceObj===null ? 'object' : 'undefined';
    }
    if ( System.isClass( instanceObj ) )return 'class';
    if ( System.isInterface( instanceObj ) )return 'interface';
    if ( System.isNamespace( instanceObj ) )return 'namespace';
    return typeof instanceObj;
};

/**
 * 检查实例对象是否属于指定的类型(不会检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
System.instanceOf = function instanceOf(instanceObj, theClass)
{
    if( instanceObj == null )
    {
        return theClass === Object || theClass===$Object  ? true : false;
    }

    if (theClass === 'class')
    {
        return System.isClass( instanceObj );
    }

    if( theClass === JSON )
    {
        return System.isObject( instanceObj );
    }

    if( System.isClass( theClass ) )
    {
        return instanceObj instanceof theClass;
    }

    if ( theClass === Array )
    {
        return System.isArray( instanceObj );
    }
    if ( theClass === Object )
    {
        return typeof instanceObj ==="object";
    }
    if ( theClass === Function )
    {
        return System.isFunction( instanceObj );
    }
    return Object(instanceObj) instanceof theClass;
};

/**
 * 检查实例对象是否属于指定的类型(检查接口类型)
 * @param instanceObj
 * @param theClass
 * @returns {boolean}
 */
System.is=function is(instanceObj, theClass)
{
    if( instanceObj == null )
    {
        return theClass === Object || theClass===$Object ? true : false;
    }
   
    if (theClass === 'class')
    {
        return System.isClass( instanceObj );
    }

    var isClass = System.isClass( instanceObj.constructor );
    if( isClass && System.isInterface(theClass) )
    {
        var objClass =instanceObj.constructor;
        while ( objClass && System.isClass(objClass) )
        {
            var impls = objClass.__T__.implements;
            if (impls && impls.length > 0)
            {
                var i = 0;
                var len = impls.length;
                for (; i < len; i++)
                {
                   if( isInterfaceEqual(impls[i],theClass) )
                   {
                       return true;
                   }
                }
            }
            objClass =objClass.__T__["extends"];
        }
        return false;
    }
    return System.instanceOf(instanceObj, theClass);
};

/**
 * 判断指定的对象是否为一个类
 */
System.isClass=function isClass( target )
{
   return target && typeof target === "function" && target.__CLASS__ && target.__RESOURCETYPE__ === 1;
}

System.isInterface=function isInterface( target )
{
   return target && typeof target === "function" && target.__CLASS__ && target.__RESOURCETYPE__ === 2;
}

System.isNamespace=function isNamespace( target )
{
   return target && typeof target === "function" && target.__CLASS__ && target.__RESOURCETYPE__ === 3;
}

/**
* 判断接口模块是否有继承指定的接口类
*/
function isInterfaceEqual(interfaceModule,interfaceClass)
{
    if (interfaceModule === interfaceClass)
    {
        return true;
    }
    interfaceModule = interfaceModule.__T__["extends"];
    if( interfaceModule )
    {
        if( interfaceModule instanceof Array )
        {
            var len = interfaceModule.length;
            var i = 0;
            for( ;i<len;i++)
            {
                if( isInterfaceEqual(interfaceModule[i],interfaceClass) )
                {
                    return true;
                }
            }

        }else
        {
            return isInterfaceEqual(interfaceModule,interfaceClass);
        }
    }
    return false;
}

/**
 * 判断是否为一个单纯的对象
 * @param val
 * @returns {boolean}
 */
System.isObject = function isObject(val, flag )
{
    if (!val || typeof val !== "object")return false;
    var proto = Object.getPrototypeOf(val);
    if( proto === Object.prototype || proto === $Object.prototype )
    {
        return true;
    }
    return flag && val instanceof Object;
};
/**
 * 检查所有传入的值定义
 * 如果传入多个值时所有的都定义的才返回true否则为false
 * @param val,...
 * @returns {boolean}
 */
System.isDefined = function isDefined()
{
    var i = arguments.length;
    while (i > 0) if (typeof arguments[--i] === 'undefined')return false;
    return true;
};

/**
 * 判断是否为数组
 * @param val
 * @returns {boolean}
 */
System.isArray = function isArray(val) {
    if (!val || typeof val !== "object")return false;
    var proto = Object.getPrototypeOf(val);
    return proto === Array.prototype || proto === $Array.prototype;
};

/**
 * 判断是否为函数
 * @param val
 * @returns {boolean}
 */
System.isFunction = function isFunction(val) {
    if (!val)return false;
    return System.typeOf(val) === 'function' || val instanceof Function || Object.getPrototypeOf(val) === $Function.prototype;
};
/**
 * 判断是否为布尔类型
 * @param val
 * @returns {boolean}
 */
System.isBoolean =function isBoolean(val) {
    return typeof val === 'boolean';
};
/**
 * 判断是否为字符串
 * @param val
 * @returns {boolean}
 */
System.isString = function isString(val) {
    return typeof val === 'string';
};
/**
 * 判断是否为一个标量
 * 只有对象类型或者Null不是标量
 * @param {boolean}
 */
System.isScalar = function isScalar(val) {
    var t = typeof val;
    return t === 'string' || t === 'number' || t === 'float' || t === 'boolean';
};
/**
 * 判断是否为数字类型
 * @param val
 * @returns {boolean}
 */
System.isNumber = function isNumber(val) {
    return typeof val === 'number';
};

/**
 * 判断是否为一个空值
 * @param val
 * @param flag 为true时排除val为0的值
 * @returns {boolean}
 */
System.isEmpty =function isEmpty(val, flag) {
    if (!val)return flag !== true || val !== 0;
    if (System.isObject(val)||System.isArray(val)) {
        var ret;
        for (ret in val)break;
        return typeof ret === "undefined";
    }
    return false;
};

/**
 * 去掉指定字符两边的空白
 * @param str
 * @returns {string}
 */
System.trim =function trim(str) {
    return typeof str === "string" ? str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') : '';
};

/**
 * 返回一组指定范围值的数组
 * @param low 最低值
 * @param high 最高值
 * @param step 每次的步增数，默认为1
 */
System.range =function range(low, high, step) {

    if( high >= low )
    {
        var obj = [];
        if (!System.isNumber(step))step = 1;
        step = Math.max(step, 1);
        for (;low <= high; low += step)obj.push(low);
        return obj;
    }
    return [];
};

/**
 * 将字符串的首字母转换为大写
 * @param str
 * @returns {string}
 */
System.ucfirst =  function ucfirst(str) {
    return typeof str === "string" ? str.charAt(0).toUpperCase() + str.substr(1) : str;
};

/**
 * 将字符串的首字母转换为小写
 * @param str
 * @returns {string}
 */
System.lcfirst =  function lcfirst(str) {
    return typeof str === "string" ? str.charAt(0).toLowerCase() + str.substr(1) : str;
};


/**
 * 复制字符串到指定的次数
 * @param string str
 * @param number num
 * @returns {string}
 */
System.repeat = function repeat(str, num) {
    if (typeof str === "string") {
        return new Array((parseInt(num) || 0) + 1).join(str);
    }
    return '';
};

/**
 * 比较两个两个字符串的值。
 * 如果 a > b 返回 1 a<b 返回 -1 否则返回 0
 * 比较的优先级数字优先于字符串。字母及汉字是按本地字符集排序。
 * @param a
 * @param b
 * @returns {*}
 */
System.compare = function compare(a, b) {

    var c = System.parseFloat(a), d = System.parseFloat(b);
    if (System.isNaN(c) && System.isNaN(d)) {
        return a.localeCompare(b);
    } else if (!System.isNaN(c) && !System.isNaN(d)) {
        return c > d ? 1 : (c < d ? -1 : 0);
    }
    return System.isNaN(c) ? 1 : -1;
};

/**
 * 格式化输出
 * @format
 * @param [...]
 * @returns {string}
 */
System.sprintf = function sprintf() {
    var str = '', i = 1, len = arguments.length, param;
    if (len > 0) {
        str = arguments[0];
        if (typeof str === "string") {
            for (; i < len; i++) {
                param = arguments[i];
                str = str.replace(/%(s|d|f|v)/, function (all, method) {
                    if (method === 'd') {
                        param = System.parseInt(param);
                        return System.isNaN(param) ? '' : param;
                    } else if (method === 'f') {
                        param = System.parseFloat(param);
                        return System.isNaN(param) ? '' : param;
                    } else if (method === 'v') {
                        return Object.prototype.valueOf.call(param);
                    }
                    return Object.prototype.toString.call(param);
                });
            }
            str.replace(/%(s|d|f|v)/g, '');
        }
    }
    return str;
};
/**
 * 把一个对象序列化为一个字符串
 * @param object 要序列化的对象
 * @param type   要序列化那种类型,可用值为：url 请求的查询串,style 样式字符串。 默认为 url 类型
 * @param group  是否要用分组，默认是分组（只限url 类型）
 * @return string
 */
System.serialize = function serialize(object, type, group) {
    if (typeof object === "string" || !object)
        return object;
    var str = [], key, joint = '&', separate = '=', val = '', prefix = System.isBoolean(group) ? null : group;
    type = type || 'url';
    group = ( group !== false );
    if (type === 'style') {
        joint = ';';
        separate = ':';
        group = false;
    } else if (type === 'attr') {
        separate = '=';
        joint = ' ';
        group = false;
    }
    if (System.isObject(object))for (key in object) {
        val = type === 'attr' ? '"' + object[key] + '"' : object[key];
        key = prefix ? prefix + '[' + key + ']' : key;
        str = str.concat(typeof val === 'object' ? System.serialize(val, type, group ? key : false) : key + separate + val);
    }
    return str.join(joint);
};
/**
 * 将一个已序列化的字符串反序列化为一个对象
 * @param str
 * @returns {{}}
 */
System.unserialize=function unserialize(str) {
    var object = {}, index, joint = '&', separate = '=', val, ref, last, group = false;
    if (/[\w\-]+\s*\=.*?(?=\&|$)/.test(str)) {
        str = str.replace(/^&|&$/, '');
        group = true;

    } else if (/[\w\-\_]+\s*\:.*?(?=\;|$)/.test(str)) {
        joint = ';';
        separate = ':';
        str = str.replace(/^;|;$/, '')
    }

    str = str.split(joint);
    for (index in str) {
        val = str[index].split(separate);
        if (group && /\]\s*$/.test(val[0])) {
            ref = object, last;
            val[0].replace(/\w+/ig, function (key) {
                last = ref;
                ref = !ref[key] ? ref[key] = {} : ref[key];
            });
            last && ( last[RegExp.lastMatch] = val[1] );
        } else {
            object[val[0]] = val[1];
        }
    }
    return object;
};

var __uid__=1;

/**
 * 全局唯一值
 * @returns {string}
 */
System.uid =function uid()
{
   return (__uid__++)+''+( Math.random() * 100000 )>>>0;
};

/**
 * 给一个指定的对象管理一组数据
 * @param target
 * @param name
 * @param value
 * @returns {*}
 */
System.storage=function storage(target, name , value)
{
    if( target==null )throw new TypeError('target can not is null or undefined');
    if( typeof name !== "string" )throw new TypeError('name can only is string');
    var namespace = name.split('.');
    var i = 0, len = namespace.length-1;
    while( i<len )
    {
        name = namespace[i++];
        target= target[ name ] || (target[ name ] = {});
    }
    name = namespace[ len ];
    if( value !== undefined )
    {
        return target[name] = value;

    }else if( value === undefined )
    {
        var val = target[ name ];
        delete target[ name ];
        return val;
    }
    return target[name];
};

var _globalEvent=null;
System.getGlobalEvent=function getGlobalEvent()
{
      if( _globalEvent===null )
      {
          _globalEvent = new EventDispatcher( window );
      }
      return _globalEvent;
}

/**
 * 运行相关的环境信息
 * @type {{}}
 */
System.environmentMap = {};
System.environments=function environments( name )
{
    if( typeof name === "string" ) {
        return System.environmentMap[name] || null;
    }
    return Object.merge({},System.environmentMap);
}


/**
 * 根据指定的类名获取类的对象
 * @param name
 * @returns {Object}
 */
System.getDefinitionByName = function getDefinitionByName(name)
{
    if( has.call(System, name) )
    {
        return System[name];
    }
    var module = Internal.getClassModule(name);
    if( module )
    {
        return module;
    }
    throw new TypeError('"' + name + '" is not defined.');
};

System.hasClass = function hasClass(name) 
{
    return !!Internal.getClassModule( name );
};

var map=['System','Class','Interface','Namespace','Reflect','Object','JSON','Array','String','RegExp','EventDispatcher','TypeError','Error','Symbol','Element'];

/**
 * 返回类的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedClassName = function getQualifiedClassName( target )
{
    if( target == null )throw new ReferenceError( 'target is null or undefined' );
    if( target===System )return 'System';
    if( target===JSON )return 'JSON';
    if( target===Reflect )return 'Reflect';
    if( typeof target === "function" && target.prototype)
    {
        var valueof = target.valueOf();
        if( valueof.indexOf("[Class") === 0 )
        {
           return valueof.slice(7,-1);

        }else if( valueof.indexOf("[Namespace") === 0 )
        {
            return valueof.slice(11,-1);
        }else if( valueof.indexOf("[Interface") === 0 )
        {
            return valueof.slice(11,-1);
        }

        var con  = target;
        if( con )
        {
            var str = con.toString();
            if( str.indexOf('[native code]')>0 )
            {
                str = str.substr(0, str.indexOf('(') );
                return str.substr(str.lastIndexOf(' ')+1);
            }
            for (var b in map)
            {
                var obj = System[ map[b] ];
                if (con === obj) {
                    return map[b];
                }
            }
        }
    }
    throw new ReferenceError( 'target is not Class' );
};

/**
 * 返回对象的完全限定类名
 * @param value 需要完全限定类名称的对象。
 * 可以将任何类型、对象实例、原始类型和类对象
 * @returns {string}
 */
System.getQualifiedObjectName = function getQualifiedObjectName( target )
{
    if( target == null || typeof target !== "object")
    {
        throw new ReferenceError( 'target is not object or is null' );
    }
    return System.getQualifiedClassName( Object.getPrototypeOf( target ).constructor );
};
/**
 * 获取指定实例对象的超类名称
 * @param value
 * @returns {string}
 */
System.getQualifiedSuperclassName =function getQualifiedSuperclassName(target)
{
    if( target == null )throw new ReferenceError( 'target is null or undefined' );
    var classname = System.getQualifiedClassName( Object.getPrototypeOf( target ).constructor );
    var module = Internal.getClassModule( classname );
    if( module )
    {
        return System.getQualifiedClassName( module["extends"] || Object );
    }
    return null;
};
},

/***** System system/Object.es *****/

"system/Object.es": function(module,require){
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System
 */

var Internal =require("system/Internal.es");
var $Object = Internal.$Object;

function Object( value )
{
    if ( value != null )return $Object(value);
    if( !(this instanceof Object) ) return new Object();
    return this;
}

/**
 * 定义属性
 */
Internal.defineProperty(Object,"defineProperty",{value:Internal.defineProperty});

/**
 * 生成一个对象
 */
Object.defineProperty(Object,"create",{value:$Object.create});

/**
 * 合并其它参数到指定的 target 对象中
 * 如果只有一个参数则只对本身进行扩展。
 * @param deep true 深度合并
 * @param target object 目标源对象
 * @param ...valueObj object 待合并到目标源上的对象
 * @returns Object
 */
Object.defineProperty(Object,"merge",{
    value:function merge()
    {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        if ( typeof target === "boolean" )
        {
            deep = target;
            target = arguments[1] || {};
            i++;
        }
        if ( length === i )
        {
            target = {};
            --i;
        }else if ( typeof target !== "object" && typeof target !== "function" )
        {
            target = {};
        }

        //只有动态类对象允许合并属性
        if( ( System.isClass(target.constructor) && target.constructor.__T__.dynamic !==true) || System.isClass(target) )
        {
            return target;
        }

        for ( ;i < length; i++ )
        {
            if ( (options = arguments[ i ]) != null )
            {
                var token;
                if( System.isClass(options) )continue;
                if( System.isClass(options.constructor) )
                {
                    if( options.constructor.__T__.dynamic !== true )continue;
                    token = options.constructor.__T__.uri[0];
                }
                for ( name in options )
                {
                    if( token===name || !$Object.prototype.hasOwnProperty.call(options,name) )continue;
                    copy = options[name];
                    if ( target === copy )continue;
                    if ( deep && copy && ( System.isObject(copy) || ( copyIsArray = System.isArray(copy) ) ) )
                    {
                        src =  target[name];
                        if ( copyIsArray )
                        {
                            copyIsArray = false;
                            clone = src && System.isArray(src) ? src : [];
                        } else
                        {
                            clone = src && System.isObject(src) ? src : {};
                        }
                        target[name]=Object.merge( deep, clone, copy )

                    } else if ( typeof copy !== "undefined" )
                    {
                        target[name]=copy;
                    }
                }
            }
        }
        return target;
    }
});

/**
 * 循环每一个元素并应用到指定的回调函数上
 * @param object
 * @param callback
 */
Object.defineProperty(Object,"forEach",{
    value:function forEach(object,callback,thisObject)
    {
        if( object == null || System.isClass(object) || typeof callback !== "function" )return;
        var isIterator = false;
        var value = null;
        if( object && System.hasClass( Internal.iteratorClass ) )
        {
            if( object.constructor && System.isClass(object.constructor) )
            {
                isIterator = System.is(object, System.getDefinitionByName( Internal.iteratorClass ) );
            }else{
                isIterator = object instanceof System.ListIterator;
            }
        }
        thisObject = thisObject||object;
        if( isIterator && typeof object.next === "function" )
        {
            var next = object.next;
            var current = object.current;
            var key = object.key;
            var rewind = object.rewind;
            rewind.call(object);
            for (;next.call(object); )
            {
                value = current.call(object);
                if( callback.call(thisObject, value, key.call(object) ) === false )
                {
                    return value;
                }
            }

        }else
        {
            var token;
            if ( System.isClass(object.constructor) )
            {
                if (object.constructor.__T__.dynamic !== true)return;
                token = object.constructor.__T__.uri[0];
            }
            var prop;
            for (prop in object)
            {
                if (Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(prop))continue;
                if (prop !== token && $Object.prototype.propertyIsEnumerable.call(object, prop))
                {
                    value = object[prop];
                    if( callback.call(thisObject, value, prop) === false ){
                        return value;
                    }
                }
            }
        }
    }
});

/**
 * 获取对象的原型
 */
Object.defineProperty(Object,"getPrototypeOf",{
    value:$Object.getPrototypeOf || function getPrototypeOf(obj)
    {
        if( obj == null )throw new TypeError("non-object");
        if( System.isClass(obj.constructor) )
        {
            return null;
        }
        return obj.__proto__ ? obj.__proto__ : (obj.constructor ? obj.constructor.prototype : null);
    }
});

/**
 * 设置对象的原型链
 * @returns {Object}
 */
Object.defineProperty(Object,"setPrototypeOf",{
    value:$Object.setPrototypeOf || function setPrototypeOf(obj, proto)
    {
        if( obj == null )throw new TypeError("non-object");
        if( System.isClass(obj.constructor))
        {
            return false;
        }
        obj.__proto__ = proto;
        return obj;
    }
});

//基础对象的原型方法
Object.prototype = Object.create( $Object.prototype,{

    /**
    * 返回对象的原始值
    */
   "valueOf":{
       value:function valueOf()
       {
           if( System.isClass(this.constructor) )
           {
               var objClass = this.constructor;
               var p = objClass.__T__['package'];
               return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
           }
           return $Object.prototype.valueOf.call(this);
       }
   },
   "toString":{
        value:function toString()
        {
            if( System.isClass(this.constructor) )
            {
                var objClass = this.constructor;
                var p = objClass.__T__['package'];
                return '[object '+(p ? p+'.' : '')+objClass.__T__.classname+"]";
            }
            return $Object.prototype.toString.call(this);
        }
    },

    /**
     * 表示对象本身是否已经定义了指定的属性。
     * 如果目标对象具有与 name 参数指定的字符串匹配的属性，则此方法返回 true；否则返回 false。
     * @param prop 对象的属性。
     * @returns {Boolean}
     */
    "hasOwnProperty":{
        value:function hasOwnProperty( name )
        {
            if( this == null )throw new TypeError("non-object");
            if( System.isClass(this) ) return false;
            if( System.isClass(this.constructor) )
            {
                if( this.constructor.__T__.dynamic !==true )return false;
                if( this.constructor.__T__.uri[0] === name )return false;
            }
            return $Object.prototype.hasOwnProperty.call(this,name);
        }
    },


     /**
     * 表示指定的属性是否存在、是否可枚举。
     * 如果为 true，则该属性存在并且可以在 for..in 循环中枚举。该属性必须存在于目标对象上，
     * 原因是：该方法不检查目标对象的原型链。您创建的属性是可枚举的，但是内置属性通常是不可枚举的。
     * @param name
     * @returns {Boolean}
     */
    "propertyIsEnumerable":{
        value:function propertyIsEnumerable( name )
        {
            if( this == null )throw new TypeError("non-object");
            if( System.isClass(this) ) return false;
            if( System.isClass(this.constructor) )
            {
                if( this.constructor.__T__.dynamic !==true )return false;
                if( this.constructor.__T__.uri[0] === name )return false;
            }
            if( Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(name) )return false;
            return $Object.prototype.propertyIsEnumerable.call(this,name);
        }
    },

    /**
     * 返回对象可枚举的属性的键名
     * @returns {Array}
     */
    "keys":{
        value:function keys()
        {
            return Object.prototype.getEnumerableProperties.call(this,-1);
        }
    },


    /**
     * 返回对象可枚举的属性值
     * @returns {Array}
     */
    "values":{
        value:function values()
        {
            return Object.prototype.getEnumerableProperties.call(this,1);
        }
    },

    /**
     * 获取可枚举的属性
     * @param state
     * @returns {Array}
     */
    "getEnumerableProperties":{
        value:function getEnumerableProperties( state )
        {
            if( this == null )throw new TypeError("non-object");
            var items=state===2 ? {} : [];
            if( System.isClass(this) )return items;
            var token;
            if( System.isClass(this.constructor) )
            {
                if( this.constructor.__T__.dynamic !==true )return items;
                token = this.constructor.__T__.uri[0];
            }
            var prop;
            for( prop in this )
            {
                if( Symbol.isSymbolPropertyName && Symbol.isSymbolPropertyName(prop) )continue;
                if( prop !== token && $propertyIsEnumerable.call(this,prop) )
                {
                    //类中定义的属性成员不可枚举
                    //动态类设置的属性可以枚举，但属性描述符enumerable=false时不可枚举
                    switch (state){
                        case -1 : items.push(prop); break;
                        case  1 : items.push( this[prop] ); break;
                        case  2 : items[prop] = this[prop]; break;
                        default : items.push({key: prop, value: this[prop]});
                    }
                }
            }
            return items;
        }
    },

    /**
    * 对象的构造函数
    */
    "constructor":{
        value:Object
    }
});

module.exports =Object;
var System =require("system/System.es");
var Symbol =require("system/Symbol.es");

/**
 * 生成一个对象
 */
if( !Object.create  )
{
    Object.create = (function () {
        function F() {
        }
        var $has = Object.prototype.hasOwnProperty;
        return function (O, P) {
            if (typeof O != 'object'){
                throw new TypeError('Object prototype may only be an Object or null');
            }
            F.prototype = O;
            var obj = new F();
            //F.prototype = null;
            if (P != null)
            {
                P = Object(P);
                for (var n in P)if ($has.call(P, n))
                {
                   Object.defineProperty(obj, n, P[n]);
                }
                if( P.constructor && P.constructor.value )
                {
                    Object.defineProperty(obj, 'constructor', P.constructor );
                }
            }
            return obj;
        };
    })();
}


},

/***** System system/Event.es *****/

"system/Event.es": function(module,require){
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object
 */
function Event( type, bubbles, cancelable )
{
    if( type && typeof type !=="string" )throw new TypeError('event type is not string');
    this.type = type;
    this.bubbles = !(bubbles===false);
    this.cancelable = !(cancelable===false);
}

module.exports = Event;
var Object =require("system/Object.es");
var System =require("system/System.es");
var TypeError =require("system/TypeError.es");


/**
 * 一组事件名的常量
 * @type {string}
 */
Event.SUBMIT='submit';
Event.RESIZE='resize';
Event.SELECT='fetch';
Event.UNLOAD='unload';
Event.LOAD='load';
Event.LOAD_START='loadstart';
Event.PROGRESS='progress';
Event.RESET='reset';
Event.FOCUS='focus';
Event.BLUR='blur';
Event.ERROR='error';
Event.COPY='copy';
Event.BEFORECOPY='beforecopy';
Event.CUT='cut';
Event.BEFORECUT='beforecut';
Event.PASTE='paste';
Event.BEFOREPASTE='beforepaste';
Event.SELECTSTART='selectstart';
Event.READY='ready';
Event.SCROLL='scroll';
Event.INITIALIZE_COMPLETED = "initializeCompleted";

Event.ANIMATION_START="animationstart";
Event.ANIMATION_END="animationend";
Event.ANIMATION_ITERATION="animationiteration";
Event.TRANSITION_END="transitionend";

/**
 * 事件原型
 * @type {Object}
 */
Event.prototype = Object.create( Object.prototype,{
    "constructor":{value:Event},
    "toString":function toString(){
        return '[object Event]';
    },
    "valueOf":function valueOf(){
        return '[object Event]';
    }
});

//true 只触发冒泡阶段的事件 , false 只触发捕获阶段的事件
Event.prototype.bubbles = true;
//是否可以取消浏览器默认关联的事件
Event.prototype.cancelable = true;
Event.prototype.currentTarget = null;
Event.prototype.target = null;
Event.prototype.defaultPrevented = false;
Event.prototype.originalEvent = null;
Event.prototype.type = null;
Event.prototype.propagationStopped = false;
Event.prototype.immediatePropagationStopped = false;
Event.prototype.altkey = false;
Event.prototype.button = false;
Event.prototype.ctrlKey = false;
Event.prototype.shiftKey = false;
Event.prototype.metaKey = false;

/**
 * 阻止事件的默认行为
 */
Event.prototype.preventDefault = function preventDefault()
{
    if( this.cancelable===true )
    {
        this.defaultPrevented = true;
        if ( this.originalEvent )
        {
            if( this.originalEvent.preventDefault ){
                this.originalEvent.preventDefault();
            }else{
                this.originalEvent.returnValue = false;
            }
        }
    }
};

/**
 * 阻止向上冒泡事件
 */
Event.prototype.stopPropagation = function stopPropagation()
{
    if( this.originalEvent )
    {
        this.originalEvent.stopPropagation ? this.originalEvent.stopPropagation() :  this.originalEvent.cancelBubble=true;
    }
    this.propagationStopped = true;
};

/**
 *  阻止向上冒泡事件，并停止执行当前事件类型的所有侦听器
 */
Event.prototype.stopImmediatePropagation = function stopImmediatePropagation()
{
    if( this.originalEvent && this.originalEvent.stopImmediatePropagation )this.originalEvent.stopImmediatePropagation();
    this.stopPropagation();
    this.immediatePropagationStopped = true;
};

/**
 * map event name
 * @internal Event.fix;
 */
Event.fix={
    map:{},
    hooks:{},
    prefix:'',
    cssprefix:'',
    cssevent:{},
    eventname:{
        'DOMContentLoaded':true
    }
};
Event.fix.map[ Event.READY ]='DOMContentLoaded';
Event.fix.cssevent[ Event.ANIMATION_START ]     ="AnimationStart";
Event.fix.cssevent[ Event.ANIMATION_END ]       ="AnimationEnd";
Event.fix.cssevent[ Event.ANIMATION_ITERATION ] ="AnimationIteration";
Event.fix.cssevent[ Event.TRANSITION_END ]      ="TransitionEnd";

/**
 * 获取统一的事件名
 * @param type
 * @param flag
 * @returns {*}
 * @internal Event.type;
 */
Event.type = function type( eventType, flag )
{
    if( typeof eventType !== "string" )return eventType;
    if( flag===true )
    {
        eventType= Event.fix.prefix==='on' ? eventType.replace(/^on/i,'') : eventType;
        var lower =  eventType.toLowerCase();
        if( Event.fix.cssprefix && lower.substr(0, Event.fix.cssprefix.length )===Event.fix.cssprefix )
        {
            return lower.substr(Event.fix.cssprefix.length);
        }
        for(var prop in Event.fix.map)
        {
            if( Event.fix.map[prop].toLowerCase() === lower )
            {
                return prop;
            }
        }
        return eventType;
    }
    if( Event.fix.cssevent[ eventType ] ){
        return Event.fix.cssprefix ? Event.fix.cssprefix+Event.fix.cssevent[ eventType ] : eventType;
    }
    if( Event.fix.eventname[ eventType ]===true )return eventType;
    return Event.fix.map[ eventType ] ? Event.fix.map[ eventType ] : Event.fix.prefix+eventType.toLowerCase();
};

var eventModules=[];

//@internal Event.registerEvent;
Event.registerEvent = function registerEvent( callback )
{
    eventModules.push( callback );
};

/*
 * 根据原型事件创建一个Event
 * @param event
 * @returns {Event}
 * @internal Event.create;
 */
Event.create = function create( originalEvent )
{
    originalEvent=originalEvent ? originalEvent : (typeof window === "object" ? window.event : null);
    var event=null;
    var i=0;
    if( !originalEvent )throw new TypeError('Invalid event');
    var type = originalEvent.type;
    var target = originalEvent.srcElement || originalEvent.target;
    target = target && target.nodeType===3 ? target.parentNode : target;
    var currentTarget =  originalEvent.currentTarget || target;
    if( typeof type !== "string" )throw new TypeError('Invalid event type');
    if( !System.instanceOf(originalEvent,Event) )
    {
        type = Event.type(type, true);
        while (i < eventModules.length && !(event = eventModules[i++](type, target, originalEvent)));
    }else
    {
        event = originalEvent;
    }
    if( !(event instanceof Event) )event = new Event( type );
    event.type=type;
    event.target=target;
    event.currentTarget = currentTarget;
    event.bubbles = originalEvent.bubbles !== false;
    event.cancelable = originalEvent.cancelable !== false;
    event.originalEvent = originalEvent;
    event.timeStamp = originalEvent.timeStamp;
    event.relatedTarget= originalEvent.relatedTarget;
    event.altkey= !!originalEvent.altkey;
    event.button= originalEvent.button;
    event.ctrlKey= !!originalEvent.ctrlKey;
    event.shiftKey= !!originalEvent.shiftKey;
    event.metaKey= !!originalEvent.metaKey;
    if( originalEvent.animationName )
    {
        event.animationName = originalEvent.animationName;
        event.elapsedTime   = originalEvent.elapsedTime;
        event.eventPhase   = originalEvent.eventPhase;
        event.isTrusted   = originalEvent.isTrusted;
    }
    return event;
};

Event.fix.hooks[ Event.READY ]=function (listener, dispatcher)
{
    var target=this;
    var doc = this.contentWindow ?  this.contentWindow.document : this.ownerDocument || this.document || this;
    var win=  doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;
    if( !(win || doc) )return;
    var id = null;
    var has = false;
    var handle=function(event)
    {
        if( !event )
        {
            switch ( doc.readyState )
            {
                case 'loaded'   :
                case 'complete' :
                case '4'        :
                    event= new Event( Event.READY );
                    break;
            }
        }
        if( event && has===false)
        {
            has = true;
            if(id){
                window.clearInterval(id);
                id = null;
            }
            event = event instanceof Event ? event : Event.create( event );
            event.currentTarget = target;
            event.target = target;
            dispatcher( event );
        }
    }
    var type = Event.type(Event.READY);
    doc.addEventListener ? doc.addEventListener( type, handle) : doc.attachEvent(type, handle);
    id = window.setInterval(handle,50);
    return true;
}
/**
 * IE8 以下
 */
if( System.env.platform('IE',8) )
{

Event.fix.map[ Event.READY ] = 'readystatechange';
Event.fix.prefix='on';

(function () {

/**
 * 监测加载对象上的就绪状态
 * @param event
 * @param type
 * @returns loaded|complete|4
 */
var getReadyState=function( target )
{
    var nodeName=  typeof target.nodeName === "string" ?  target.nodeName.toLowerCase() : null ;
    var readyState=target.readyState;
    //iframe
    if( nodeName==='iframe' )
    {
        readyState=target.contentWindow.document.readyState;
    }//window
    else if( target.window && target.document )
    {
        readyState=target.document.readyState;
    }
    return readyState;
}

Event.fix.hooks[ Event.LOAD ]=function (listener, dispatcher)
{
    if( this.$addEventListener )
    {
        this.$addEventListener( Event.type(Event.LOAD) ,dispatcher);

    }else if( this.attachEvent )
    {
        this.attachEvent( Event.type(Event.LOAD) ,dispatcher);

    }else if( typeof this.onreadystatechange !== "undefined" )
    {
        this.onreadystatechange=function()
        {
            if( this.readyState === 4 )
            {
                if( this.status === 200 )
                {
                    var event = new Event(Event.LOAD);
                    event.currentTarget = this;
                    event.target = this;
                    dispatcher(event);
                }else
                {
                    var event = new Event(Event.ERROR);
                    event.currentTarget = this;
                    event.target = this;
                    dispatcher(event);
                }
            }
        }
    }
}
var document_head = null;
Event.fix.hooks[ Event.READY ]=function (listener, dispatcher)
{
    var target=this;
    var doc = this.contentWindow ?  this.contentWindow.document : this.ownerDocument || this.document || this;
    var win=  doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;
    if( !(win || doc) )return;
    var handle=function(event)
    {
        if( !event )
        {
           switch ( getReadyState( doc ) )
           {
               case 'loaded'   :
               case 'complete' :
               case '4'        :
                   event= new Event( Event.READY );
               break;
           }
        }
        if( event )
        {
            if( document_head === null && !document.head )
            {
                document.head = (new System.Element("head"))[0];
            }
            event = event instanceof Event ? event : Event.create( event );
            event.currentTarget = target;
            event.target = target;
            dispatcher( event );
        }
    }
    var type = Event.type(Event.READY);
    doc.addEventListener ? doc.addEventListener( type, handle ) : doc.attachEvent(type, handle);
    //不是一个顶级文档或者窗口对象
    if( !this.contentWindow && win && doc )
    {
        var toplevel = false;
        try {
            toplevel = win.frameElement == null;
        } catch(e) {}
        if ( toplevel && doc.documentElement.doScroll )
        {
            var doCheck=function(){
                try {
                    doc.documentElement.doScroll("left");
                } catch(e) {
                    System.setTimeout( doCheck, 1 );
                    return;
                }
                handle();
            }
            doCheck();
        }
    }
    handle();
    return true;
}
}());
}
},

/***** System system/EventDispatcher.es *****/

"system/EventDispatcher.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Event,Internal,Symbol
 */

function EventDispatcher( target )
{
    if( !(this instanceof EventDispatcher) )
    {
        return target && target instanceof EventDispatcher ? target : new EventDispatcher( target );
    }
    if( target != null && !( typeof target.addEventListener === "function" ||
        System.typeOf( target.attachEvent )=== "function" ||
        System.typeOf( target.onreadystatechange ) !== "undefined" ||
        target instanceof EventDispatcher ) )
    {
        target = null;
    }
    storage(this, true, {target:target||this, events:{}});
}

module.exports = EventDispatcher;
var Object =require("system/Object.es");
var System =require("system/System.es");
var Internal =require("system/Internal.es");
var Symbol =require("system/Symbol.es");
var Event =require("system/Event.es");
var storage=Internal.createSymbolStorage( Symbol('EventDispatcher') );

EventDispatcher.prototype=Object.create( Object.prototype,{
    "constructor":{value:EventDispatcher}
});


/**
 * 判断是否有指定类型的侦听器
 * @param type
 * @param listener
 * @returns {boolean}
 */
EventDispatcher.prototype.hasEventListener=function hasEventListener( type , listener )
{
    var target =  storage(this,'target') || this;
    if( target instanceof EventDispatcher && target !== this )
    {
        return target.hasEventListener(type, listener);
    }
    var len = target.length >> 0;
    if( len > 0 )
    {
        while(len>0 && target[--len] )
        {
           if( $hasEventListener(target[len], type, listener) )
           {
               return true;
           }
        }
        return false;
    }
    return $hasEventListener(target, type, listener);
};

/**
 * 添加侦听器
 * @param type
 * @param listener
 * @param priority
 * @returns {EventDispatcher}
 */
EventDispatcher.prototype.addEventListener=function addEventListener(type,callback,useCapture,priority,reference)
{
    if( typeof type !== 'string' )throw new TypeError('Invalid event type');
    if( typeof callback !== 'function' )throw new TypeError('Invalid callback function');
    var target = storage(this,'target') || this;
    if( target instanceof EventDispatcher && target !== this )
    {
        target.addEventListener(type,callback,useCapture,priority,reference||this);
        return this;
    }
    var listener=new Listener(type,callback,useCapture,priority,reference,this);
    var len = target.length >> 0;
    if( len > 0 )
    {
        while(len>0 && target[--len] )
        {
            $addEventListener( target[len], listener );
        }
        return this;
    }
    $addEventListener(target, listener);
    return this;
};

/**
 * 移除指定类型的侦听器
 * @param type
 * @param listener
 * @returns {boolean}
 */
EventDispatcher.prototype.removeEventListener=function removeEventListener(type,listener)
{
    var target = storage(this,'target') || this;
    if(target instanceof EventDispatcher && target !== this )
    {
        return target.removeEventListener(type,listener);
    }
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0 && target[--len] )$removeEventListener( target[len], type, listener, this);
        return true;
    }
    return $removeEventListener(target,type,listener,this);
};

/**
 * 调度指定事件
 * @param event
 * @returns {boolean}
 */
EventDispatcher.prototype.dispatchEvent=function dispatchEvent( event )
{
    //if( typeof event === "string" )event = new System.Event( event );
    if( !System.is(event,Event) )throw new TypeError('Invalid event');
    var target = storage(this,'target') || this;
    if( target instanceof EventDispatcher && target !== this )
    {
        return target.dispatchEvent(event);
    }
    var len = target.length >> 0;
    if( len > 0 ){
        while(len>0 && target[--len] )
        {
            event.target = event.currentTarget = target[len];
            $dispatchEvent(event);
        }
        return !event.immediatePropagationStopped;
    }
    event.target = event.currentTarget=target;
    return $dispatchEvent( event );
};

/**
 * 判断是否有指定的侦听器
 * @param target
 * @param type
 * @param listener
 * @return {boolean}
 */
function $hasEventListener(target, type, listener)
{
    var is = typeof listener === "function";
    var events =  storage(target,'events');
    if( events && Object.prototype.hasOwnProperty.call(events,type) )
    {
        events = events[type];
        var length = events.length;
        if( !is ){
            return length > 0;
        }
        while (length > 0)
        {
            --length;
            if ( events[length].callback === listener )
            {
                return true;
            }
        }
    }
    return false;
}

/**
 * 添加侦听器到元素中
 * @param listener
 * @param handle
 * @returns {boolean}
 */
function $addEventListener(target, listener )
{
    if( target==null )throw new ReferenceError('this is null or not define');

    //获取事件数据集
    var type = listener.type;
    var data = storage(target);
    var events = data.events || (data.events={});
    //获取指定事件类型的引用
    events = events[ type ] || ( events[ type ]=[] );
    //如果不是 EventDispatcher 则在第一个事件中添加事件代理。
    if( events.length===0 && !(target instanceof EventDispatcher) )
    {
        //自定义事件处理
        if( Object.prototype.hasOwnProperty.call(Event.fix.hooks,type) )
        {
            Event.fix.hooks[ type ].call(target, listener, $dispatchEvent);

        }else {
            type = Event.type(type);
            try {
                if( target.addEventListener )
                {
                    target.addEventListener(type, $dispatchEvent, listener.useCapture);
                }else
                {
                    listener.proxyType=[type];
                    listener.proxyTarget=target;
                    listener.proxyHandle=function (e) {
                        $dispatchEvent(e, target);
                    }
                    target.attachEvent(type, listener.proxyHandle);
                }
            }catch (e) {}
        }
    }

    //添加到元素
    events.push( listener );
    
    //按权重排序，值大的在前面
    if( events.length > 1 ) events.sort(function(a,b)
    {
        return a.priority=== b.priority ? 0 : (a.priority < b.priority ? 1 : -1);
    });
    return true;
}
/**
 * 添加侦听器到元素中
 * @param string type 事件类型, 如果是一个'*'则表示删除所有的事件
 * @param function listener 可选，如果指定则只删除此侦听器
 * @param EventDispatcher eventDispatcher 可选，如果指定则只删除本对象中的元素事件
 * @returns {boolean}
 */
function $removeEventListener(target, type, listener , dispatcher )
{
    if( target==null )throw new ReferenceError('this is null or not define');

    //获取事件数据集
    var events =storage(target,'events');
    if( !events || !Object.prototype.hasOwnProperty.call(events,type) )
    {
        return false;
    }
    events = events[type];
    var length= events.length;
    var ret = length;
    var is = typeof listener === "function";
    while (length > 0)
    {
        --length;
        //如果有指定侦听器则删除指定的侦听器
        if ( (!is || events[length].callback === listener) && events[length].dispatcher === dispatcher )
        {
            var result = events.splice(length, 1);
            if( result[0] && result[0].proxyHandle && result[0].proxyType )
            {
                var types = result[0].proxyType;
                var num = types.length;
                while ( num > 0 )
                {
                    $removeListener(result[0].proxyTarget || target, types[ --num ], result[0].proxyHandle);
                }
            }
        }
    }

    //如果是元素并且没有侦听器就删除
    if( events.length < 1 && !(target instanceof EventDispatcher)  )
    {
        $removeListener(target, type, $dispatchEvent);
    }
    return events.length !== ret;
}

function $removeListener(target, type , handle )
{
    var eventType= Event.type( type );
    if( target.removeEventListener )
    {
        target.removeEventListener(eventType,handle,false);
        target.removeEventListener(eventType,handle,true);

    }else if( target.detachEvent )
    {
        target.detachEvent(eventType,handle);
    }
}


/**
 * 调度指定侦听项
 * @param event
 * @param listeners
 * @returns {boolean}
 */
function $dispatchEvent(e, currentTarget )
{
    if( !(e instanceof Event) )
    {
        e = Event.create( e );
        if(currentTarget)e.currentTarget = currentTarget;
    }
    if( !e || !e.currentTarget )throw new Error('invalid event target');
    var target = e.currentTarget;
    var events = storage(target,'events');
    if( !events || !Object.prototype.hasOwnProperty.call(events, e.type) )return true;
    events = events[e.type].slice(0);
    var length= 0,listener,thisArg,count=events.length;
    while( length < count )
    {
        listener = events[ length++ ];
        thisArg = listener.reference || listener.dispatcher;
        //如果是一个元素对象，设置当前元素为事件元素
        // bug 在Display 组件中使用事件后
        //if( thisArg.setCurrentElementTarget===true && e.target && (e.target.nodeType === 1 || e.target.nodeType === 9 || e.target.window) ){
            //thisArg.current( e.target );
        //}
        //调度侦听项
        listener.callback.call( thisArg , e );
        if( e.immediatePropagationStopped===true )
           return false;
    }
    return true;
}
/**
 * 事件侦听器
 * @param type
 * @param callback
 * @param priority
 * @param capture
 * @param currentTarget
 * @param target
 * @constructor
 */
function Listener(type,callback,useCapture,priority,reference,dispatcher)
{
    this.type=type;
    this.callback=callback;
    this.useCapture=!!useCapture;
    this.priority=priority>>0;
    this.reference=reference || null;
    this.dispatcher=dispatcher;
}
Object.defineProperty(Listener.prototype,"constructor",{value:Listener});
Listener.prototype.useCapture=false;
Listener.prototype.dispatcher=null;
Listener.prototype.reference=null;
Listener.prototype.priority=0;
Listener.prototype.callback=null;
Listener.prototype.currentTarget=null;
Listener.prototype.type=null;
Listener.prototype.proxyHandle = null;
Listener.prototype.proxyTarget = null;
Listener.prototype.proxyType = null;

},

/***** System system/PropertyEvent.es *****/

"system/PropertyEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
function PropertyEvent( type, bubbles,cancelable ){
    if( !(this instanceof PropertyEvent) )return new PropertyEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}

module.exports =PropertyEvent;
var Event =require("system/Event.es");
var Object =require("system/Object.es");

PropertyEvent.prototype=Object.create( Event.prototype ,{
    "constructor":{value:PropertyEvent}
});
PropertyEvent.prototype.property=null;
PropertyEvent.prototype.newValue=null;
PropertyEvent.prototype.oldValue=null;
PropertyEvent.CHANGE='propertychange';
PropertyEvent.COMMIT='propertycommit';
Event.fix.map[ PropertyEvent.CHANGE ] = 'input';

var hash = 'lastValue_'+(new Date().getTime())+ '_'+ Math.random() * 10000;

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    switch ( type ){
        case PropertyEvent.CHANGE :
        case PropertyEvent.COMMIT :
            if( originalEvent instanceof  Event )return originalEvent;
            var event =new PropertyEvent( type );
            var property = typeof originalEvent.propertyName === "string" ? originalEvent.propertyName : null;
            if( property===hash)return null;
            if( !property && System.Element.isForm(target,'button') )
            {
                property = 'value';
            }
            if( property )
            {
                event.property = property;
                event.oldValue = target[hash] || undefined;
                event.newValue = target[property];
                target[hash]= event.newValue;
            }
            return event;
    }
});
},

/***** System system/StyleEvent.es *****/

"system/StyleEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,PropertyEvent,Object
 */
function StyleEvent( type, bubbles,cancelable ){
    if( !(this instanceof StyleEvent) )return new StyleEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =StyleEvent;
var Object =require("system/Object.es");
var PropertyEvent =require("system/PropertyEvent.es");

StyleEvent.prototype=Object.create( PropertyEvent.prototype ,{
    "constructor":{value:StyleEvent}
});
StyleEvent.CHANGE='styleChange';
},

/***** System system/ScrollEvent.es *****/

"system/ScrollEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,PropertyEvent,Object
 */
function ScrollEvent( type, bubbles,cancelable ){
    if( !(this instanceof ScrollEvent) )return new ScrollEvent(type, bubbles,cancelable);
    PropertyEvent.call(this, type, bubbles,cancelable );
    return this;
};

module.exports =ScrollEvent;
var Object =require("system/Object.es");
var PropertyEvent =require("system/PropertyEvent.es");
var Event =require("system/Event.es");

ScrollEvent.prototype=Object.create( PropertyEvent.prototype ,{
    "constructor":{value:ScrollEvent}
});
ScrollEvent.CHANGE='scrollChange';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ScrollEvent )return originalEvent;
    if( type === ScrollEvent.CHANGE )return new ScrollEvent( ScrollEvent.CHANGE );
});
},

/***** System system/ElementEvent.es *****/

"system/ElementEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */
function ElementEvent( type, bubbles,cancelable )
{
    if( !System.instanceOf(this,ElementEvent) )return new ElementEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};

module.exports = ElementEvent;
var Object =require("system/Object.es");
var Event =require("system/Event.es");
var System =require("system/System.es");

ElementEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:ElementEvent}
});
ElementEvent.prototype.parent=null;
ElementEvent.prototype.child=null;
ElementEvent.ADD='elementAdd';
ElementEvent.ADD_TO_DOCUMENT='elementAddToDocument';
ElementEvent.REMOVE='elementRemove';
ElementEvent.CHANGE='elementChildrenChange';

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof ElementEvent )return originalEvent;
});
},

/***** System system/Element.es *****/

"system/Element.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array,EventDispatcher,Internal,StyleEvent,PropertyEvent,ScrollEvent,ElementEvent,Math,TypeError,Error,Symbol
 */


/**
 * Element class
 * @param selector
 * @param context
 * @returns {Element}
 * @constructor
 */
function Element(selector, context)
{
    if( !(this instanceof Element) )
    {
        return new Element( selector, context );
    }
    if( context )context= context instanceof Element ? context[0] : context;
    storage(this,true,{
        'context':context,
        'forEachCurrentItem':null,
        'forEachCurrentIndex':NaN
    });
    var result=null;
    if( selector )
    {
        //复制Element的结果到当前对象
         if( selector instanceof Element )
        {
            result = Array.prototype.slice.call(selector,0);
        }
        //指定的选择器是一组元素
        else if ( System.isArray(selector) )
        {
            result = filters( selector );
        }
        //是一个选择器或者指定一个需要创建的html标签
        else if (typeof selector === "string")
        {
            selector = System.trim( selector );
            //创建一个指定标签的新元素
            if( selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' )
            {
                result=[createElement(selector)];
            }
            //查询指定选择器的元素
            else
            {
                result = querySelector(selector, context);
            }
        }
        //指定的选择器为元素对象
        else if ( Element.isNodeElement(selector) || Element.isWindow(selector) )
        {
            result = [selector];
        }
    }
    Object.defineProperty(this,"length", {value:0,writable:true});
    if( result )makeElement( this, result);
    EventDispatcher.call(this);
}

module.exports = Element;
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var Symbol =require("system/Symbol.es");
var System =require("system/System.es");
var Array =require("system/Array.es");
var EventDispatcher =require("system/EventDispatcher.es");
var StyleEvent =require("system/StyleEvent.es");
var PropertyEvent =require("system/PropertyEvent.es");
var ScrollEvent =require("system/ScrollEvent.es");
var ElementEvent =require("system/ElementEvent.es");
var TypeError =require("system/TypeError.es");
var Error =require("system/Error.es");
var Event =require("system/Event.es");
var storage=Internal.createSymbolStorage( Symbol('Element') );
var accessor={};
var fix={
    attrMap:{
        'tabindex'       : 'tabIndex',
        'readonly'       : 'readOnly',
        'for'            : 'htmlFor',
        'maxlength'      : 'maxLength',
        'cellspacing'    : 'cellSpacing',
        'cellpadding'    : 'cellPadding',
        'rowspan'        : 'rowSpan',
        'colspan'        : 'colSpan',
        'usemap'         : 'useMap',
        'frameborder'    : 'frameBorder',
        'class'          : 'className',
        'contenteditable': 'contentEditable'
    }
    ,attrtrue:{
        'className':true,
        'innerHTML':true,
        'value'    :true
    }
    ,cssPrefixName:''
    ,cssPrefix:{
        'box-shadow':true,
        'border-radius':true,
        'border-top-left-radius':true,
        'border-top-right-radius':true,
        'border-bottom-left-radius':true,
        'border-bottom-right-radius':true,
        'focus-ring-color':true,
        'user-select':true,
        'radial-gradient':true,
        'linear-gradient':true,
        'transform':true,
        'transition':true,
        'animation':true,
        'animation-name':true,
        'animation-duration':true,
        'animation-iteration-count':true,
        'animation-delay':true,
        'animation-fill-mode':true,
        'animation-direction':true,
        'animation-timing-function':true,
        'animation-play-state':true
    }
    ,cssUpperRegex:/([A-Z]|^ms)/g
    ,cssCamelRegex:/-([a-z]|[0-9])/ig
    ,cssCamelCase:function( all, letter )
    {
        return ( letter + "" ).toUpperCase();
    }
    ,cssNumber:{
        "fillOpacity": true,
        "fontWeight": true,
        "lineHeight": true,
        "opacity": true,
        "orphans": true,
        "widows": true,
        "zIndex": true,
        "zoom": true
    }
    ,cssHooks:{}
    ,cssMap:{}
    ,fnHooks:{}
    ,cssDisplayRegex:/^(none|table(?!-c[ea]).+)/
    ,cssDisplayMap:{position:"absolute",visibility: "hidden", display:"block"}
    ,getsizeval:function( prop )
    {
        if ( Element.isWindow(this) )
        {
            var val =  Math.max(
                this['inner'+prop] || 0,
                this['offset'+prop] || 0,
                this['client'+prop] || 0
            ) || document.documentElement['client'+prop];
            if( document.compatMode ==="BackCompat" ){
                val = document.body['client'+prop];
            }
            return val;

        } else if ( Element.isDocument(this) )
        {
            return Math.max(
                    this.body['scroll'+prop] || 0,
                    this.documentElement['scroll'+prop] || 0,
                    this.body['offset'+prop] || 0,
                    this['offset'+prop] || 0,
                    this.body['client'+prop] || 0,
                    this['client'+prop] || 0
                )+(this.documentElement[ prop==='Height'? 'clientTop' : 'clientLeft' ] || 0);
        }
        var val = this['offset'+prop] || 0;
        if( val < 1 )
        {
            var style = getComputedStyle( this );
            val = parseFloat( prop==="Width" ? style.width : style.height )||0;
            if( val < 1 && fix.cssDisplayRegex.test( style.display ) )
            {
                var oldCss = {};
                var p;
                for( p in fix.cssDisplayMap )
                {
                    oldCss[p]=style[ p ];
                    this.style[ p ]=fix.cssDisplayMap[p];
                }
                val = this['offset'+prop] || 0;
                for( p in oldCss )this.style[ p ]=oldCss[p];
            }
        }
        return val;
    }
};

/**
 * @private
 */
function access(callback, name, newValue, isDisplay, isHidden)
{
    var write= typeof newValue !== 'undefined';
    var getter = accessor[callback].get;
    var setter = accessor[callback].set;
    if( fix.fnHooks[callback] )
    {
        getter = typeof fix.fnHooks[callback].get === "function" ? fix.fnHooks[callback].get : getter ;
        setter = typeof fix.fnHooks[callback].set === "function" ? fix.fnHooks[callback].set : setter ;
    }
    if( !write )
    {
        var elem = this.current();
        return elem ? getter.call(elem,name,this) : false;
    }

    return this.forEach(function(elem)
    {
        var oldValue= getter.call(elem,name,this);
        if( isDisplay )
        {
            var _data = storage(elem, 'data') || storage(elem, 'data', {});
            if( isHidden ){
                _data['---display---'] = oldValue;
            }else{
                newValue = _data['---display---'];
                if( !newValue || newValue.toLowerCase() === "none" )
                {
                    newValue=getDisplayValueByElem( elem );
                }
            }
        }

        if( oldValue !== newValue )
        {
            var event = setter.call(elem,name,newValue,this);
            if( event )
            {
                if (typeof event === "string")
                {
                    event = event === StyleEvent.CHANGE ? new StyleEvent(StyleEvent.CHANGE) : new PropertyEvent(PropertyEvent.CHANGE);
                    event.property = name;
                }
                if (event instanceof PropertyEvent)
                {
                    event.property = event.property || name;
                    event.newValue = event.newValue || newValue;
                    event.oldValue = event.oldValue || oldValue;
                    this.dispatchEvent(event);
                }
            }
        }
    });
}

/**
 * 获取元素的显示属性
 * @param elem
 * @returns {*}
 */
function getDisplayValueByElem( elem )
{
    var nodename = elem.nodeName.toLowerCase();
    switch ( nodename )
    {
        case "table" :
            return 'table' ;
        case "thead" :
            return 'table-header-group' ;
        case "tbody" :
            return 'table-row-group';
        case "tfoot" :
            return 'table-footer-group';
        case "tr" :
            return 'table-row';
        case "td" :
            return 'table-cell';
        case "col" :
            return 'table-column';
        case "caption" :
            return 'table-caption';
        case "colgroup" :
            return 'table-column-group';
        case "div" :
        case "ul"  :
        case "li"  :
        case "p":
        case "address":
        case "dl":
        case "dd":
        case "dt":
        case "ol":
        case "fieldset":
        case "form":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
            return 'block';
        default :
            return 'inline';
    }
}

/**
 * @private
 */
function getChildNodes(elem)
{
    var ret=[];
    if( !Element.isFrame(elem) && elem.hasChildNodes() )
    {
        var len=elem.childNodes.length,index= 0,node;
        while( index < len )
        {
            node=elem.childNodes.item(index);
            if( Element.getNodeName(node) !== "#text" )
            {
                ret.push(node);
            }
            ++index;
        }
    }
    return ret;
}
/**
 * @private
 */
function dispatchEvent(dispatch, type, parent, child )
{
    if( dispatch.hasEventListener(type) )
    {
        var event = new ElementEvent(type);
        event.parent = parent;
        event.child = child;
        return dispatch.dispatchEvent(event);
    }
    return true;
}

/**
 *  @private
 */
function recursion(prop, selector, deep, exclude)
{
    var results = new Array();
    var current;
    var nodename = '';
    var last;
    this.forEach(function(elem)
    {
        if( elem && elem.nodeType )
        {
            current = elem;
            do{
                last = current;
                current = current[prop];
                if( exclude && (elem === exclude || current===exclude) )return;
                if( current && ( nodename = Element.getNodeName(current) ) !== "#text" && results.indexOf( current ) < 0 )
                {
                    results.push( current );
                }
            } while ( current && last !== current && ( deep===true || nodename === "#text" ) );
        }
    });
    return selector ?
        ( typeof selector === "function" ?
            Array.prototype.filter.call(results,function(elem){
                this.current(elem);
                return selector.call(this,elem);
            },this)
           : querySelector(selector,null,null,results) )
        : results;
}

/**
 * @private
 * @param instance
 * @param results
 * @returns {*}
 */
function makeElement( instance, results , index )
{
    if( typeof results.valueOf === "function"  ){
        results = results.valueOf();
    }
    Array.prototype.splice.apply(instance, [].concat.apply([index || 0, 0], results));
    return instance;
}

/**
 * 统一规范的样式名
 * @param name
 * @returns {string}
 */
function getStyleName(name )
{
    if( typeof name !=='string' )
        return name;
    if( name === 'cssText')
        return name;
    name=fix.cssMap[name] || name;
    name=name.replace( /^-ms-/, "ms-" ).replace( fix.cssCamelRegex, fix.cssCamelCase );
    name = name.replace( fix.cssUpperRegex, "-$1" ).toLowerCase();
    if( fix.cssPrefix[name] === true )
    {
        return fix.cssPrefixName + name;
    }
    return name;
}

/**
 * @param cssText
 * @returns {string}
 */
function formatStyleSheet( styleObject,type,node,elem)
{
    if( type==="object" )
    {
        var results=[];
        for( var name in styleObject )
        {
            var value = formatStyleValue(name, styleObject[name], node, elem);
            if( value !==false )
            {
                value = typeof value === "object" ? System.serialize(value, 'style') : getStyleName(name) + ":" + value;
                results.push(value);
            }
        }
        return results.join(";");
    }
    return styleObject.replace(/([\w\-]+)\s*\:([^\;\}]*)/g, function (all, name, value) {
        value = formatStyleValue(name, value, node, elem);
        if( !value )return "";
        return typeof value === "object" ? System.serialize(value, 'style') : getStyleName(name)+":"+value;
    });
}

/**
 * 格式化样式名及属性值
 * @param name
 * @param value
 * @return {string}
 */
function formatStyleValue(name, value, node, elem, apply )
{
    var type = typeof value;
    if( type === "string" )
    {
        value = System.trim(value);
        type = /^\d+$/.test( value ) ? 'number' : type;
    }
    if( type === "string" )
    {
        var increment = /^([\-+])=([\-+.\de]+)/.exec(value);
        if (increment)
        {
            var inc = accessor.style.get.call(node||{}, name, elem);
            inc = parseFloat(inc) || 0;
            value = (+(increment[1] + 1) * +increment[2]) + inc;
            type = "number";

        } else if( System.env.platform("IE", 8) && value.substr(0, 5) === "rgba(" )
        {
            value = value.replace(/rgba\(.*?\)/i, rgbToHex(value));
        }
    }

    if( type === "number" && isNaN( value ) )
    {
        return false;
    }

    //添加单位
    if( type === "number" && !fix.cssNumber[name] )
    {
        value += "px";
    }
    if( fix.cssHooks[name] && typeof fix.cssHooks[name].set === "function")
    {
        if( apply )
        {
            var orgname = getStyleName(name);
            if( !fix.cssHooks[name].set.call(node,node.style,value,orgname) )
            {
                node.style[ orgname ] = value;
            }

        }else
        {
            var obj = {};
            fix.cssHooks[name].set.call(node||{},obj,value,elem);
            return obj;
        }

    }else
    {
        if( apply )
        {
            node.style[ getStyleName(name) ] = value;
        }else{
            return value;
        }
    }
}


/**
 * 选择元素
 * @param mixed selector CSS3选择器
 * @param mixed context  上下文
 * @returns []
 */
var querySelector = typeof Sizzle === "function" ? Sizzle : function(selector, context, results, seed )
{
    if( !results || !System.isArray(results) )
    {
        if( context )
        {
            if( Element.isWindow(context) )
            {
                context = document;
            }else if( typeof context === "string" && !( context = document.querySelector( context ) ) )
            {
                return [];
            }

            if( !Element.isHTMLContainer(context) )
            {
               throw new TypeError("Invalid context in Element.querySelector");
            }
        }
        results = Array.prototype.slice.call( (context||document).querySelectorAll(selector) );
    }

    if( seed && System.isArray(seed) )
    {
        var i=0;
        var ret=[];
        while( i<seed.length )
        {
            if( Array.prototype.indexOf.call(results, seed[i]) >=0 && Array.prototype.indexOf.call(ret,seed[i]) < 0)
            {
                ret.push( seed[i] );
            }
            i++;
        }
        return ret;
    }
    return results;
};

/**
 * @type {RegExp}
 */
var singleTagRegex=/^<(\w+)(.*?)\/\s*>$/;

/**
 * 创建HTML元素
 * @param html 一个html字符串
 * @returns {Node}
 */
function createElement(html , flag , isTable )
{
    if(System.isString(html) )
    {
        html=System.trim( html ).replace(/[\r\n]+/g,'');
        if( html )
        {
            if( flag ===true )
            {
                return document.createTextNode( html );
            }

            var match;
            if (html.charAt(0) === "<" && ( match = singleTagRegex.exec(html) ))
            {
                var elem = document.createElement(match[1]);
                var attr = matchAttr(html);
                for (var prop in attr) {
                    accessor['property'].set.call( elem, prop, attr[prop]);
                }
                return elem;

            }else if ( html.length >= 1 && /^[^\d+][a-zA-Z0-9]+$/.test(html) )
            {
                try {
                    return document.createElement(html);
                } catch (e) {
                }
            }  

            var div = document.createElement("div");
            var result = html.match(/^\<(tr|th|td|tbody|thead|tfoot)(?:[\s\>]+)/i);
            if( result )
            {
                var level = 1;
                switch( result[1] )
                {
                    case 'td':
                        html='<table><tbody><tr>'+html+'</tr></tbody></table>';
                        level = 3;
                        break;
                    case 'th':
                        html='<table><thead><tr>'+html+'</tr></thead></table>';
                        level = 3;
                        break;
                    case 'tr' :
                        html='<table><tbody>'+html+'</tbody></table>';
                        level = 2;
                        break;
                    default :
                        html ='<table>'+html+'</table>';
                        level = 1;
                }

                div.innerHTML = html;
                for (var i = 0; i < level; i++)
                {
                    div = div.childNodes.item(0);
                    div.parentNode.removeChild( div );
                }

                if( !div )
                {
                    throw new Error('Invalid html');
                }

                if( isTable )
                {
                    return div;
                }

            }else
            {
                div.innerHTML = html;
            }

            var len=div.childNodes.length;
            if(  len > 1 )
            {
                var fragment= document.createDocumentFragment();
                while( len > 0 )
                {
                    --len;
                    fragment.appendChild( div.childNodes.item(0) );
                }
                return fragment;
            }
            div=div.childNodes.item(0);
            return div.parentNode.removeChild( div );
        }

    }else if (Element.isNodeElement(html) )
        return  html.parentNode ?cloneNode(html,true) : html;
    throw new Error('createElement param invalid')
}
var getAttrExp = /(\w+)(\s*=\s*([\"\'])([^\3]*?)[^\\]\3)?/g;
var lrQuoteExp = /^[\'\"]|[\'\"]$/g;

/**
 * @private
 * 匹配字符串中的属性
 * @param strAttr
 * @return {}
 */
function matchAttr(strAttr)
{
    if( typeof strAttr === "string" && /[\S]*/.test(strAttr) )
    {
        var i=  strAttr.charAt(0)==='<' ? 1 : 0;
        var attr=strAttr.replace(/=\s*(\w+)/g,'="$1"').match( getAttrExp );
        strAttr={};
        if( attr && attr.length > 0 )
        {
            var item;
            while( item=attr[i++] )
            {
                var val  =  item.split('=');
                if( val.length > 0 )
                {
                    var prop =System.trim( val[0] );
                    strAttr[ prop ]='';
                    if( typeof val[1] === "string" )
                    {
                        strAttr[ prop ]=val[1].replace( lrQuoteExp ,'').replace(/\\([\'\"])/g,'$1');
                    }
                }
            }
        }
        return strAttr;
    }
    return null;
}

/**
 * @private
 * 合并元素属性。
 * 将 oSource 对象的属性合并到 target 元素
 * @param target 目标对象
 * @param oSource 引用对象
 * @returns {*}
 */
function mergeAttributes(target, oSource)
{
    var iselem=Element.isNodeElement( target );
    if( System.isObject(oSource) )
    {
        for (var key in oSource)if (oSource[key] && oSource[key] != '')
        {
            iselem ? accessor['property'].set.call( target, key,  oSource[key] ) : target[key] = oSource[key];
        }

    }else
    {
        var i=0, len=oSource.attributes.length,item;
        while( i<len )
        {
            item=oSource.attributes.item(i++);
            if( item.nodeValue && item.nodeValue !='' )
            {
                iselem ?  accessor['property'].set.call( target, item.nodeName, item.nodeValue ) : target[item.nodeName] = item.nodeValue;
            }
        }
    }
    return target;
}

/**
 * @private
 * 判断元素是否有样式
 * @param elem
 * @returns {boolean}
 */
function hasStyle(elem )
{
    return elem && elem.nodeType && elem.style && !(elem.nodeType === 3 || elem.nodeType === 8 || elem.nodeType === 9 || elem.nodeType === 11);
}

/**
 * @private
 * 获取元素当前的样式
 * @param elem
 * @returns {Object}
 */
function getComputedStyle(elem)
{
    if( !hasStyle(elem) )return {};
    return document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(elem, null)
        : elem.currentStyle || elem.style;
}

/**
 * @private
 * 克隆节点元素
 * @param nodeElement
 * @returns {Node}
 */
function cloneNode(nodeElement , deep )
{
    if( nodeElement.cloneNode )
    {
        return nodeElement.cloneNode( !!deep );
    }
    //nodeElement.nodeName
    if( typeof nodeElement.nodeName==='string' )
    {
        var node = document.createElement( nodeElement.nodeName  );
        if( node )mergeAttributes(node,nodeElement);
        return node;
    }
    return null;
}

/**
 * @private
 * @param results
 * @returns {Array}
 */
function filters(results) {
     return Array.prototype.filter.call(results, function (elem) {
        return Element.isNodeElement(elem) || Element.isWindow(elem);
    });
}


Element.prototype= Object.create( EventDispatcher.prototype,{
    "constructor":{value:Element},
    
    /**
     * 返回此对象的字符串
     * @returns {*}
     */
    "toString":{value:function toString()
    {
        if( this.constructor === Element ){
            return "[object Element]";
        }
        return EventDispatcher.prototype.toString.call(this);
    }},

    /**
     * 返回此对象的数据值
     * @returns {*}
     */
    "valueOf":{value:function valueOf()
    {
        if( this.constructor === Element ){
            return this.slice(0);
        }
        return EventDispatcher.prototype.valueOf.call(this);
    }}
})

Element.prototype.setCurrentElementTarget=true;

/**
 * 返回一个指定开始索引到结束索引的元素并返回新的Element集合
 */
Element.prototype.slice = Array.prototype.slice;

/**
 * 替换或者增加一个或者多个元素并返回新的Element集合
 */
Element.prototype.splice= function splice(start,deleteLenght)
{
    var results = Element.prototype.concat.apply([],Element.prototype.slice.call(arguments,2) );
    var items = Array.prototype.splice.call( this, start, deleteLenght);
    Array.prototype.splice.apply( this, Array.prototype.concat.apply( [0,this.length],  this.concat( results ) ) );
    return items;
}

/**
 * 合并一个或者多个元素并返回一个新的Element集合
 */
Element.prototype.concat = function concat()
{
    var results = this.slice(0);
    var index = 0;
    while ( arguments.length > index )
    {
        var items = [];
        if( arguments[index] instanceof Element )
        {
            items = arguments[index].slice(0);
        }
        else
        {
            items = filters( System.isArray(arguments[index]) ? arguments[index] : [ arguments[index] ] );
        }
        results = Array.prototype.concat.apply( results,items);
        index++;
    }
    return Array.prototype.unique.call(results);
}

/**
 * 搜索一个指定的元素在当前匹配的集合中的位置
 */
Element.prototype.indexOf= Array.prototype.indexOf;

/**
 * 遍历元素
 * @param function callback
 * @param object refObject
 * @returns {*}
 */
Element.prototype.forEach=function forEach(callback , refObject)
{
    var result=null;
    refObject=refObject || this;
    var current = storage(this,'forEachCurrentItem');
    if( current )
    {
        result=callback.call( refObject ,current, storage(this,'forEachCurrentIndex') );
    }else
    {
        var items=this.slice(0),
            index = 0,
            len=items.length;
        for( ; index < len ; index++ )
        {
            current = items[ index ];
            storage(this,'forEachCurrentItem',current);
            storage(this,'forEachCurrentIndex',index);
            result=callback.call(refObject ,current,index);
            if( result != null )break;
        }
        storage(this,'forEachCurrentItem',null);
        storage(this,'forEachCurrentIndex',NaN);
    }
    return result == null ? this : result;
};

/**
 * 设置获取当前操作的元素
 * 此操作不会改变原有元素结果集，只是对当前操作的设置和一个引用的元素
 * 如果在调用这个方法之前调用了this.forEach且没有结束遍历，则返回的是forEach当前游标位置的元素，否则为0的游标元素
 * @param selector|HTMLElement element
 * @returns {*}
 */
Element.prototype.current=function current( elem )
{
    if( typeof elem === "undefined" )
    {
        return storage(this,'forEachCurrentItem') || this[0];
    }
    if( elem )
    {
        if (typeof elem === "string")
        {
            elem = querySelector(elem, this.context || document);
            elem = elem && elem.length > 0 ? elem[0] : null;
        }
        elem = elem && ( Element.isNodeElement(elem) || Element.isWindow(elem) ) ? elem : null;
    }
    storage(this, 'forEachCurrentIndex', NaN);
    storage(this, 'forEachCurrentItem', elem);
    return this;
};

/**
 * @private
 */
accessor['property']={
    get:function(name){
        name = fix.attrMap[ name ] || name;
        return  ( fix.attrtrue[name] || !this.getAttribute  ? this[name] : this.getAttribute(name) ) || null;
    }
    ,set:function(name,newValue){
        name = fix.attrMap[ name ] || name;
        if( fix.attrtrue[name] ===true && newValue === null )newValue = '';
        if( newValue === null ){
            fix.attrtrue[name] || !this.removeAttribute ? delete this[name] : this.removeAttribute(name);
        }else
        {
            fix.attrtrue[name] || !this.setAttribute  ? this[name] = newValue : this.setAttribute(name, newValue);
        }
        return PropertyEvent.CHANGE;
    }
};

/**
 * 为每一个元素设置属性值
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.property=function property(name,value)
{
    return access.call(this,'property',name,value);
};

/**
 * 设置一组属性
 * @param propsObject
 * @returns {Element}
 */
Element.prototype.properties=function properties( propsObject )
{
    if( propsObject && typeof propsObject === "object" )
    {
        Object.forEach(propsObject,function(value,name)
        {
            access.call(this,'property',name,value);
        },this);
        return this;
    }

    var elem = this.current();
    var props={};
    if (elem.hasAttributes()) 
    {
       var attrs = elem.attributes;
       for(var i=0;i<attrs.length;i++)
       {
         props[ attrs[i].name ] = attrs[i].value;
       }
    } 
    return props;
}

/**
 * 判断当前匹配元素是否有指定的属性名
 * @param prop
 * @returns {boolean}
 */
Element.prototype.hasProperty=function hasProperty(prop)
{
    var elem = this.current();
    if( !elem )return false;
    if( fix.attrtrue[prop] === true )
    {
        return typeof elem[prop] !== "undefined";
    }
    return typeof elem.hasAttribute === 'function' ? elem.hasAttribute( prop ) : typeof elem[prop] !== "undefined";
};

/**
 * 获取设置数据对象
 * @param name
 * @param value
 * @returns {*}
 */
Element.prototype.data=function data(name, value)
{
    var type =  typeof name;
    var write = typeof value !== "undefined";
    var data;
    return this.forEach(function(elem)
    {
        if( type === "object" )
        {
            storage(elem,'data',name);

        }else if( type === 'string' && write )
        {
            data = storage(elem,'data') || storage(elem,'data',{});
            data[ name ]=value;

        }else
        {
            data = storage(elem,'data');
            return type === 'string' && data ? data[name] : data || null;
        }
    });
};

var rgbregex = /\s*rgba\(\s*(\d+)\,\s*(\d+)\,\s*(\d+)/i;
var rgbToHex = function(value)
{
      var ret = value.match(rgbregex);
      if( ret )
      {
          return [
              '#',
              ("0" + Number(ret[1] >> 0).toString(16) ).slice(-2),
              ("0" + Number(ret[2] >> 0).toString(16) ).slice(-2),
              ("0" + Number(ret[3] >> 0).toString(16) ).slice(-2),
          ].join('');
      }
      return value;
};

/**
 * @private
 */
accessor['style']= {
    get:function(name){
        var getter = fix.cssHooks[name] && typeof fix.cssHooks[name].get === "function" ? fix.cssHooks[name].get : null;
        var style = this.currentStyle || this.style;
        if( name !=="cssText" ){
            style = getComputedStyle(this);
        }
        return getter ? getter.call(this, style, name) : style[name]||'';
    }
    ,set:function(name, value, obj ){
        var type = typeof value;
        if( type === "object" )
        {
            for( var b in value )
            {
                formatStyleValue(b, value[b], this , obj , true );
            }
        }else
        {
            //解析 cssText 样式名
            if( name === 'cssText' )
            {
                if( value == null )
                {
                    value = "";
                }else if( type === "string" )
                {
                    var _cssText = this.style.cssText;
                    value = (_cssText ? _cssText+";" : "")+formatStyleSheet(value, type, this, obj);
                }
            }
            formatStyleValue(name, value, this , obj , true );
        }
        return StyleEvent.CHANGE;
    }
};

/**
 * 设置所有匹配元素的样式
 * @param name
 * @param value
 * @returns {Element}
 */
Element.prototype.style=function style(name, value)
{
    return access.call(this,'style',name,value);
};

/**
 * 显示元素
 * @returns {Element}
 */
Element.prototype.show=function show()
{
    access.call(this,'style',"display",'',true,false);
    return this;
};

/**
 * 隐藏当前元素
 * @returns {Element}
 */
Element.prototype.hide=function hide()
{
    access.call(this,'style',"display",'none',true,true);
    return this;
};

/**
 * @private
 */
accessor['text']= {
    get:function(){  return typeof this.textContent === "string" ? this.textContent : this.innerText; }
    ,set:function(name,newValue){
        typeof this.textContent === "string" ? this.textContent=newValue : this.innerText=newValue;
        return PropertyEvent.CHANGE;
    }
};

/**
 * 获取设置当前元素的文本内容。
 * @returns {string|Element}
 */
Element.prototype.text=function text( value )
{
    return access.call(this,'text','text',value);
};

/**
 * @private
 */
accessor['value']= {
    get:function(){ return this.value || null }
    ,set:function(name,newValue){
        this.value=newValue ;
        return PropertyEvent.CHANGE;
    }
};

/**
 * 获取设置表单元素的值。此方法只会对表单元素有用。
 * @returns {string|Element}
 */
Element.prototype.value=function value( val )
{
    return access.call(this,'value','value',val);
};

/**
 * 判断是否有指定的类名
 * @param className
 * @returns {boolean}
 */
Element.prototype.hasClass=function hasClass( className )
{
    if( typeof className !=='string' )
    {
        throw new Error("className is not String");
    }
    var value=this.property("class");
    if( !value ) return false;
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(  System.trim(value) );
};

/**
 * 添加指定的类名
 * @param className
 * @returns {Element}
 */
Element.prototype.addClass=function addClass( className , replace )
{
    if( typeof className !== "string" )throw new Error('className is not String');
    className = System.trim( className );
    var exp = replace===true ? null : new RegExp('(\\s|^)' + className + '(\\s|$)');
    this.forEach(function(elem){
        if( !hasStyle(elem) )return;
        var old = System.trim( this.property("class") || '' );
        if (!( old && exp && exp.test(old) )) {
            var oldClass = [old];
            var newValue = className;
            if (replace !== true) {
                oldClass.push(className);
                newValue = oldClass.join(' ');
            }
            elem['className'] = newValue;
            if (this.hasEventListener(StyleEvent.CHANGE)) {
                var event = new StyleEvent(StyleEvent.CHANGE);
                event.property = 'class';
                event.newValue = newValue;
                event.oldValue = old;
                if (!this.dispatchEvent(event)) {
                    elem['className'] = old;
                }
            }
            try{elem.offsetWidth = elem.offsetWidth}catch(e){};
        }
    });
    return this;
};

/**
 * 移除指定的类名或者清除所有的类名。
 * @param className
 * @returns {Element}
 */
Element.prototype.removeClass=function removeClass( className )
{
    var all = !className || typeof className !== 'string';
    return this.forEach(function(elem){
        if(!hasStyle(elem))return;
        var old = elem['className']||'';
        var newValue = !all && old ? old.replace( new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ') : '';
        this.addClass(newValue, true);
    });
};

/**
 * 获取设置元素宽度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.width=function width( value )
{
    if( value == null )
    {
        return parseFloat( fix.getsizeval.call(this.current(),'Width') );
    }
    access.call(this,'style','width',value);
    return this;
};

/**
 * 获取设置元素高度
 * @param value
 * @returns {int|Element}
 */
Element.prototype.height=function height( value )
{
    if( value == null )
    {
        return parseFloat( fix.getsizeval.call(this.current(),'Height') );
    }
    access.call(this,'style','height',value);
    return this;
};

/**
 * 为当前选择的元素集应用动画效果
 * @param name  动画名
 * @param duration 持续时间
 * @param timing 运行函数名  linear ease ease-in ease-out ease-in-out cubic-bezier(n,n,n,n)
 * @param delay  延时
 * @param count 重复次数
 * @param direction 是否应该轮流反向播放动画
 * @param fillMode 属性规定动画在播放之前或之后，其动画效果是否可见  none | forwards | backwards | both
 */
Element.prototype.animation=function animation(name, duration, timing, delay, count, direction, fillMode)
{
    var cmd = name+" "+(duration || 3)+"s "+(timing ||"ease");
    if(delay>0)cmd+=" "+delay+"s";
    if(count>1)cmd+=" "+count;
    if(direction)cmd+=" alternate";
    if(!fillMode)fillMode = "both";
    cmd+=" "+fillMode;
    this.style("animation","unset");
    this.style("animation",cmd);
    return this;
}

/**
 * 淡入效果
 * @param duration
 * @param opacity
 */
Element.prototype.fadeIn=function(duration, opacity)
{
    var name = "fadeIn";
    if( opacity>0 && opacity < 1)
    {
        name = Element.createAnimationStyleSheet("fadeIn_0_"+opacity,{from:{"opacity":0},to:{"opacity":opacity}});
    }
    this.animation(name,duration,"linear");
    return this;
}

/**
 * 淡出效果
 * @param duration
 * @param opacity
 */
Element.prototype.fadeOut=function(duration, opacity)
{
    var name = "fadeOut";
    if( opacity>0 && opacity<1)
    {
        name = Element.createAnimationStyleSheet("fadeOut_"+opacity+"_0",{from:{"opacity":opacity},to:{"opacity":0}});
    }
    this.animation(name,duration,"linear");
    return this;
}

/**
 * @private
 */
accessor['scroll']={
    get:function(prop){
        var e = this.defaultView || this.parentWindow || this;
        var p= 'scroll'+prop;
        return parseInt( Element.isWindow( e ) ? e[ prop.toLowerCase()==='top'?'pageYOffset':'pageXOffset'] || e.document.documentElement[p] || e.document.body[p] : e[p] );
    },
    set:function(prop,newValue,obj)
    {
        var e = this.defaultView || this.parentWindow || this;
        var old = accessor.scroll.get.call(this, prop);
        if( newValue == old )return;
        if( obj.style('position')==='static' )obj.style('position','relative');
        if(typeof e.scrollTo === "function")
        {
            var param = [newValue,NaN];
            if( prop.toLowerCase()==='top' )param = param.reverse();
            e.scrollTo.apply(e, param );

        } else
        {
            e['scroll'+prop] = newValue;
        }
        if( this.hasEventListener.call( ScrollEvent.CHANGE ) )
        {
            var event = new ScrollEvent( ScrollEvent.CHANGE );
            event.property = prop.toLowerCase();
            event.newValue = newValue;
            event.oldValue = old;
            return event;
        }
    }
};

/**
 * 获取设置滚动条顶部的位置
 * @param value
 */
Element.prototype.scrollTop=function scrollTop(value)
{
    return access.call(this,'scroll','Top',value);
};

/**
 * 获取设置滚动条左部的位置
 * @param value
 */
Element.prototype.scrollLeft=function scrollLeft(value)
{
    return access.call(this,'scroll','Left',value);
};

/**
 * 获取滚动条的宽度
 * @param value
 */
Element.prototype.scrollWidth=function scrollWidth()
{
    return access.call(this,'scroll','Width');
};

/**
 * 获取滚动条的高度
 * @param value
 */
Element.prototype.scrollHeight=function scrollHeight()
{
    return access.call(this,'scroll','Height');
};

/**
 * 获取元素相对文档页面边界的矩形坐标。
 * 如果元素的 position = fixed 或者 force=== true 则相对浏览器窗口的位置
 * @param NodeElement elem
 * @param boolean force 是否为全局坐标
 * @returns {left,top,right,bottom,width,height}
 */
Element.prototype.getBoundingRect=function getBoundingRect( force )
{
    var value={ 'top': 0, 'left': 0 ,'right' : 0,'bottom':0,'width':0,'height':0};
    var elem= this.current();
    if( Element.isWindow(elem) )
    {
        value.left = elem.screenLeft || elem.screenX;
        value.top = elem.screenTop || elem.screenY;
        value.width = this.width();
        value.height = this.height();
        value.right = value.width + value.left;
        value.bottom = value.height + value.top;
        return value;
    }

    if( !Element.isNodeElement( elem ) )
        throw new Error('invalid elem. elem not is NodeElement');

    var doc =  elem.ownerDocument || elem, docElem=doc.documentElement;
    this.current( Element.getWindow( doc ) );
    var scrollTop = this.scrollTop();
    var scrollLeft = this.scrollLeft();
    this.current( elem );

    if( "getBoundingClientRect" in document.documentElement )
    {
        var box = elem.getBoundingClientRect();
        var clientTop = docElem.clientTop || doc.body.clientTop || 0,
            clientLeft = docElem.clientLeft || doc.body.clientLeft || 0;

        value.top = box.top + scrollTop - clientTop;
        value.left = box.left + scrollLeft - clientLeft;
        value.right = box.right + scrollLeft - clientLeft;
        value.bottom = box.bottom + scrollTop - clientTop;
        value.width = box.width || box.right-box.left;
        value.height = box.height || box.bottom-box.top;

    }else
    {
        value.width = this.width();
        value.height= this.height();
        do {
            value.top += elem.offsetTop;
            value.left += elem.offsetLeft;
            elem = elem.offsetParent;
        } while (elem);
        value.right = value.width+value.left;
        value.bottom = value.height+value.top;
    }

    //始终相对浏览器窗口的位置
    if( this.style('position') === 'fixed' || force===true )
    {
        value.top -= scrollTop;
        value.left -= scrollLeft;
        value.right -= scrollLeft;
        value.bottom -= scrollTop;
    }
    return value;
};

/**
 * @private
 */
var position_hash={'absolute':true,'relative':true,'fixed':true};
accessor['position']={
    get:function(prop,obj){
        return obj.getBoundingRect()[ prop ];
    },
    set:function(prop,newValue,obj){
        var val = accessor.style.get.call(this,'position');
        if( val && !position_hash[val] )
        {
            accessor.style.set.call(this,'position','relative');
        }
        return accessor.style.set.call(this,prop,newValue,obj);
    }
};

/**
 * 获取或者设置相对于父元素的左边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.left=function left( val )
{
    return access.call(this,'position','left',val)
};

/**
 * 获取或者设置相对于父元素的顶边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.top=function top(val )
{
    return access.call(this,'position','top',val)
};

/**
 * 获取或者设置相对于父元素的右边位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.right=function right(val )
{
    return access.call(this,'position','right',val)
};

/**
 * 获取或者设置相对于父元素的底端位置
 * @param number val
 * @returns {number|Element}
 */
Element.prototype.bottom=function bottom(val )
{
    return access.call(this,'position','bottom',val)
};

/**
 * @private
 */
function point(left, top, local )
{
    var old = storage(this,'forEachCurrentItem');
    var target = this.current();
    this.current( target.parentNode );
    var offset=this.getBoundingRect();
    this.current( old );
    left = left || 0;
    top = top || 0;
    return local===true ? {left:offset.left+left,top:offset.top+top} : {left:left-offset.left, top:top-offset.top};
}

/**
 *  将本地坐标点转成相对视图的全局点
 *  @param left
 *  @param top
 *  @returns {object} left top
 */
Element.prototype.localToGlobal=function localToGlobal(left, top)
{
    return point.call(this,left, top, true);
};

/**
 *  将视图的全局点转成相对本地坐标点
 *  @param left
 *  @param top
 *  @returns {object}  left top
 */
Element.prototype.globalToLocal=function globalToLocal(left, top )
{
    return point.call(this,left, top);
};

//============================================元素选择===================================

/**
 * 查找当前匹配的第一个元素下的指定选择器的元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.find=function find( selector )
{
    if( selector == null )
    {
        throw new TypeError("selector is null or is undefined");
    }
    var resutls = [];
    if( typeof selector === "function" )
    {
        resutls= Array.prototype.filter.call( this.slice(0), function(elem){
            this.current(elem);
            return selector.call(this,elem);
        },this);

    }else
    {
        this.forEach(function (elem) {
            if (elem === selector) {
                resutls = [elem];
                return elem;
            }
            resutls = [].concat.apply(resutls, querySelector(selector, elem));
        });
    }
    return makeElement( new Element() , resutls );
};

/**
 * 查找所有匹配元素的父级元素或者指定selector的父级元素（不包括祖辈元素）
 * @param selector
 * @returns {Element}
 */
Element.prototype.parent=function parent( selector )
{
    return makeElement( new Element() , recursion.call(this,"parentNode",selector) );
};

/**
 * 查找所有匹配元素的祖辈元素或者指定 selector 的祖辈元素。
 * 如果指定了 selector 则返回最近的祖辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.parents=function parents( selector )
{
    return makeElement( new Element() , recursion.call(this,"parentNode",selector,true,document.body) );
};

/**
 * 获取所有匹配元素向上的所有同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prevAll=function prevAll( selector )
{
    return makeElement( new Element() , recursion.call(this,"previousSibling",selector,true) );
};

/**
 * 获取所有匹配元素紧邻的上一个同辈元素,或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.prev=function prev( selector )
{
    return makeElement( new Element() ,recursion.call(this,"previousSibling",selector) );
};

/**
 * 获取所有匹配元素向下的所有同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.nextAll=function nextAll( selector )
{
    return makeElement(new Element() ,recursion.call(this,"nextSibling",selector, true));
};

/**
 * 获取每一个匹配元素紧邻的下一个同辈元素或者指定selector的同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.next=function next(selector )
{
    return makeElement( new Element() ,recursion.call(this,"nextSibling",selector) );
};

/**
 * 获取每一个匹配元素的所有同辈元素
 * @param selector
 * @returns {Element}
 */
Element.prototype.siblings=function siblings( selector )
{
    var instance = makeElement( new Element(),recursion.call(this,"previousSibling",selector,true) );
    makeElement(instance,recursion.call(this,"nextSibling",selector,true),instance.length);
    return instance;
};

/**
 * 查找所有匹配元素的所有子级元素，不包括孙元素
 * @param selector 如果是 * 返回包括文本节点的所有元素。不指定返回所有HTMLElement元素。
 * @returns {Element}
 */
Element.prototype.children=function children( selector )
{
    var results=[];
    this.forEach(function(elem)
    {
        results = results.concat( getChildNodes( elem ) );
    });
    if( typeof selector === "function" )
    {
        results = Array.prototype.filter.call(results,selector);
    }else if( selector ) {
        results = querySelector(selector,null,null,results);
    }
    return makeElement( new Element(), results );
};

//========================操作元素===========================

/**
 * 获取或者设置 html
 * @param htmlObject
 * @returns {string | Element}
 */
Element.prototype.html=function html( htmlObject )
{
    var outer = htmlObject === true;
    var write= !outer && typeof htmlObject !== "undefined";
    if( !write && this.length < 1 ) return '';
    var is = false;
    if( write && htmlObject )
    {
        if( typeof htmlObject === "string" )
        {
            htmlObject = System.trim( htmlObject ).replace(/[\r\n\t]+/g,'');

        }else if( htmlObject instanceof Element )
        {
            htmlObject = htmlObject.current();
            is = true;
        }else if( Element.isNodeElement(htmlObject) )
        {
            is = true;
        }
    }
    return this.forEach(function(elem)
    {
        if( !write )
        {
            htmlObject=elem.innerHTML;
            if( outer )
            {
                if( typeof elem.outerHTML==='string' )
                {
                    htmlObject=elem.outerHTML;
                }else
                {
                    var cloneElem=cloneNode( elem, true);
                    if( cloneElem )
                    {
                        htmlObject=document.createElement( 'div' ).appendChild( cloneElem ).innerHTML;
                    }
                }
            }
            return htmlObject;
        }

        //清空所有的子节点
        while( elem.hasChildNodes() )
        {
            this.removeChild( elem.childNodes.item(0) );
        }
        
        //如果是一个节点对象
        if(is)
        {
            return this.addChild( htmlObject );
        }
        try
        {
            elem.innerHTML = htmlObject;
            if( System.env.platform(System.env.BROWSER_IE,8) )
            {
               switch ( Element.getNodeName(elem) ){
                   case "thead" :
                   case "tbody":
                   case "tfoot":
                   case "table":
                   case "tr":
                   case "th":
                   case "td":
                       this[ this.indexOf( elem ) ] = replaceHtmlElement(elem, htmlObject);
               }
            }

        } catch (e)
        {
            this[ this.indexOf( elem ) ] = replaceHtmlElement(elem, htmlObject);
        }
    });
};

/**
 * 替换一个html元素
 * @param elem
 * @param htmlObject
 * @return {Node}
 */
function replaceHtmlElement(elem, htmlObject )
{
    var nodename = Element.getNodeName(elem);
    if ( !( new RegExp("^<" + nodename,'i').exec(htmlObject) ) )
    {
        htmlObject ="<"+nodename+">"+htmlObject+"</"+nodename+">";
    }

    var child = createElement(htmlObject,false,true);

    //thead,tbody,tfoot,tr,th,td
    if( Element.getNodeName(child.childNodes[0]) === nodename )
    {
        child = child.childNodes[0];
        child.parentNode.removeChild( child );
    }

    mergeAttributes(child, elem);
    var parent = elem.parentNode;
    if( !parent ){
        parent = document.createElement("div");
        parent.appendChild( elem );
        parent.replaceChild(child, elem);
        parent.removeChild(child);
    }else {
        parent.replaceChild(child, elem);
    }
    return child;
}

/**
 * 添加子级元素（所有已匹配的元素）
 * @param childElemnet
 * @returns {Element}
 */
Element.prototype.addChild=function addChild(childElemnet)
{
    return this.addChildAt(childElemnet,-1);
};

/**
 * 在指定位置加子级元素（所有已匹配的元素）。
 * 如果 childElemnet 是一个已存在的元素，那么会先删除后再添加到当前匹配的元素中后返回，后续匹配的元素不会再添加此元素。
 * @param childElemnet 要添加的子级元素
 * @param index | refChild | fn(node,index,parent)  要添加到的索引位置
 * @returns {Element}
 */
Element.prototype.addChildAt=function addChildAt( childElemnet, index )
{
     if( System.isNaN(index) )throw new Error('Invalid param the index in addChildAt');
     if( System.instanceOf(childElemnet,Element) )
     {
         childElemnet.forEach(function(child,at) {
             this.addChildAt(child, !isNaN(at) ? at+index : index );
         },this);
         return childElemnet;
     }
     if( !Element.isNodeElement( childElemnet ) )
     {
         throw new TypeError('is not Element in addChildAt');
     }
     var parent = this.current();
     if( !Element.isHTMLElement( parent ) )
     {
        throw new Error('parent is null of child elemnet in addChildAt');
     }

    var refChild=index===-1 ? null : this.getChildAt(index);
    if( childElemnet.parentNode )this.removeChild( childElemnet );
    parent.insertBefore( childElemnet , refChild || null );
    if( Element.getNodeName(childElemnet)==="#document-fragment" )
    {
        childElemnet['parent-element'] = parent;
    }
    dispatchEvent( new EventDispatcher( childElemnet ) ,ElementEvent.ADD, parent, childElemnet );
    dispatchEvent( new EventDispatcher( parent ) , ElementEvent.CHANGE, parent, childElemnet );
    if( this.isNodeInDocumentChain() ){
        dispatchAddToDocumentEvent(parent,childElemnet );
    }
    return childElemnet;
};

/**
 * 触发元素已经添加到文档中事件
 * @param parent
 * @param child
 */
function dispatchAddToDocumentEvent( parent, child )
{
    dispatchEvent( new EventDispatcher( child ) , ElementEvent.ADD_TO_DOCUMENT, parent, child);
    if( child.hasChildNodes() && child.childNodes.length > 0 )
    {
        for(var i=0; i<child.childNodes.length;i++)
        {
            dispatchAddToDocumentEvent( child, child.childNodes.item(i) )
        }
    }
}

/**
 * 返回指定索引位置的子级元素( 匹配选择器的第一个元素 )
 * 此方法只会计算节点类型为1的元素。
 * @param index | refChild | fn(node,index,parent)
 * @returns {Node|null}
 */
Element.prototype.getChildAt=function getChildAt( index )
{
    if( typeof index !== 'number' )throw new TypeError("index is not Number");
    var elem = this.current();
    if( !elem || !elem.hasChildNodes() )return null;
    var childNodes = getChildNodes(elem);
    index=index < 0 ? index+childNodes.length : index;
    return index >= 0 && index < childNodes.length ? childNodes[index] : null;
};

/**
 * 返回子级元素相对于父元素的索引位置( 匹配选择器的第一个元素 )
 * @param childElemnet | selector
 * @returns {Number}
 */
Element.prototype.getChildIndex=function getChildIndex( childElemnet )
{
    if( childElemnet instanceof Element )
    {
        childElemnet = childElemnet.current();
    }
    if( !Element.isNodeElement(childElemnet)  )
    {
        throw new TypeError('is not HTMLElement in getChildIndex');
    }
    var parent = childElemnet.parentNode;
    if( !parent || !parent.hasChildNodes() )return -1;
    var childNodes = getChildNodes(parent);
    return Array.prototype.indexOf.call( childNodes, childElemnet);
};

/**
 * 移除指定的子级元素
 * @param childElemnet|selector
 * @returns {Element}
 */
Element.prototype.removeChild=function removeChild( childElemnet )
{
    if( System.instanceOf(childElemnet,Element) )
    {
        childElemnet = childElemnet.current();
    }
    if( !Element.isNodeElement(childElemnet) )
    {
        throw new TypeError('is not HTMLElement in removeChild');
    }

    var parent = childElemnet.parentNode;
    if( !parent && Element.getNodeName(childElemnet)==="#document-fragment" )
    {
        parent = childElemnet['parent-element'];
        if( parent )
        {
            var elem = new Element( parent )
            while ( parent.childNodes.length > 0 )
            {
               elem.removeChild( parent.childNodes[0] );
            }
        }
        return childElemnet;
    }
    if( parent === this.current() )
    {
        var nodeChild=parent.removeChild(childElemnet);
        dispatchEveryRemoveEvent(parent, childElemnet);
        dispatchEvent( new EventDispatcher( parent ) , ElementEvent.CHANGE, parent, childElemnet );
        nodeChild = null;
    }
    return childElemnet;
};

/**
 * 触发每一个元素的删除事件
 * @param parent
 * @param child
 */
function dispatchEveryRemoveEvent( parent, child )
{
    dispatchEvent( new EventDispatcher( child ) , ElementEvent.REMOVE, parent, child);
    if(child.hasChildNodes() && child.childNodes.length > 0 )
    {
        for(var i=0; i<child.childNodes.length;i++)
        {
            dispatchEveryRemoveEvent( child, child.childNodes.item(i) )
        }
    }
}

/**
 * 移除子级元素
 * @param childElemnet|index|fn  允许是一个节点元素或者是相对于节点列表中的索引位置（不包括文本节点）。
 *        也可以是一个回调函数过滤要删除的子节点元素。
 * @returns {Element}
 */
Element.prototype.removeChildAt=function removeChildAt( index )
{
    var child= this.getChildAt( index );
    if( !child )
    {
        throw new Error('Not found child. in removeChildAt');
    }
    return this.removeChild( child );
};

/**
 * 判断是否这空的集合
 * @returns {boolean}
 */
Element.prototype.isEmpty=function isEmpty()
{
    return !(this.length > 0);
}

/**
 * 判断当前元素节点是否在文档链中
 * @returns {boolean}
 */
Element.prototype.isNodeInDocumentChain=function isNodeInDocumentChain()
{
    var node = this.current();
    return node && Element.contains(document.documentElement, node);
}

/**
 * 测试指定的元素（或者是一个选择器）是否为当前元素的子级
 * @param parent
 * @param child
 * @returns {boolean}
 */
Element.contains=function contains(parent,child)
{
    if( !parent || !child )return false;
    if( parent instanceof Element )parent = parent.current();
    if( child instanceof Element )child = child.current();
    if( Element.isWindow(parent) )
    {
        parent = document.documentElement;
    }
    if( Element.isNodeElement(child) && Element.isNodeElement(parent) )
    {
        if('contains' in parent){
            return parent.contains( child ) && parent !== child;
        }
        if( parent.compareDocumentPosition )
        {
            return !!(parent.compareDocumentPosition(child) & 16) && parent !== child;
        }
    }
    return querySelector( child, parent ).length > 0;
};

/**
 * 判断两个元素是否一致
 * 如果指定的是一个元素对象（Element）， 那么会检查每一个元素都相等，只有所有的元素集都一致才会返回 true 反之 false。
 * 如果指定的参数为同一个对象也会返回true。
 * 此方法主要是比较集合元素，并非是元素对象(Element)
 * @param a
 * @param b
 */
Element.equal=function equal( a, b )
{
    if( a === b )return true;
    if( !a || !b )return false;
    var a1 = a instanceof Element ? a.slice(0) : [a];
    var b1 = b instanceof Element ? b.slice(0) : [b];
    if( a1.length != b1.length )return false;
    var i=0;
    var items = a1.concat(b1);
    var len   = items.length;
    for(;i<len;i++)
    {
        if( Element.isNodeElement( items[i] ) )
        {
            if( a1.indexOf(items[i]) < 0 || b1.indexOf(items[i]) < 0 )
            {
                return false;
            }
        }
    }
    return true;
}

/**
 * @private
 * @type {boolean}
 */
var ishtmlobject = typeof HTMLElement==='object';

/**
 * 判断是否为一个HtmlElement类型元素,document 不属性于 HtmlElement
 * @returns {boolean}
 */
Element.isHTMLElement=function isHTMLElement( elem )
{
    if( !elem )return false;
    return ishtmlobject ? elem instanceof HTMLElement : ( (elem.nodeType === 1 || elem.nodeType === 11) && typeof elem.nodeName === "string" );
};


/**
 * 判断是否为一个表单元素
 * @returns {boolean}
 */
Element.isForm=function isForm(elem, exclude)
{
    if( elem )
    {
        var nodename = Element.getNodeName(elem);
        switch ( nodename )
        {
            case 'select'   :
            case 'input'    :
            case 'textarea' :
            case 'button'   :
                return exclude && typeof exclude === 'string' ? exclude.toLowerCase() !== nodename : true;
        }
    }
    return false;
};

/**
 * 判断是否为一个节点类型元素
 * document window 不属于节点类型元素
 * @returns {boolean}
 */
var hasNode= typeof Node !== "undefined";
Element.isNodeElement=function isNodeElement( elem )
{
    if( !elem || typeof elem !== "object" ) return false;
    return hasNode ? elem instanceof Node : elem.nodeType && (typeof elem.nodeName === "string" || typeof elem.tagName === "string" || elem.nodeName==="#document-fragment");
};


/**
 * 判断是否为一个html容器元素。
 * HTMLElement和document属于Html容器
 * @param element
 * @returns {boolean|*|boolean}
 */
Element.isHTMLContainer=function isHTMLContainer( elem )
{
    return elem && ( Element.isHTMLElement(elem) || Element.isDocument(elem) );
};

/**
 * 判断是否为一个事件元素
 * @param element
 * @returns {boolean}
 */
Element.isEventElement=function isEventElement( elem )
{
    return elem && ( typeof elem.addEventListener === "function" || typeof elem.attachEvent=== "function" || typeof elem.onreadystatechange !== "undefined" );
};

/**
 * 判断是否为窗口对象
 * @param obj
 * @returns {boolean}
 */
Element.isWindow=function isWindow( elem )
{
    return elem && elem == Element.getWindow(elem);
};

/**
 * 决断是否为文档对象
 * @returns {*|boolean}
 */
Element.isDocument=function isDocument( elem )
{
    return elem && elem.nodeType===9;
};

/**
 * 判断是否为一个框架元素
 * @returns {boolean}
 */
Element.isFrame=function isFrame( elem )
{
    var nodename = Element.getNodeName(elem);
    return (nodename === 'iframe' || nodename === 'frame');
};


/**
 * 获取元素所在的窗口对象
 * @param elem
 * @returns {window|null}
 */
Element.getWindow=function getWindow( elem )
{
    if( elem && typeof elem === "object" )
    {
        elem = elem.ownerDocument || elem;
        return elem.window || elem.defaultView || elem.contentWindow || elem.parentWindow || window || null;
    }
    return null;
};

/**
 * 以小写的形式返回元素的节点名
 * @returns {string}
 */
Element.getNodeName = function getNodeName( elem )
{
    return elem && elem.nodeName && typeof elem.nodeName=== "string" ? elem.nodeName.toLowerCase() : '';
};


// fix style name add prefix
if( System.env.platform( System.env.BROWSER_FIREFOX ) && System.env.version(4) )
{
    fix.cssPrefixName='-moz-';
}else if( System.env.platform( System.env.BROWSER_SAFARI )  || System.env.platform( System.env.BROWSER_CHROME ) )
{
    fix.cssPrefixName='-webkit-';
}else if( System.env.platform(System.env.BROWSER_OPERA) )
{
    fix.cssPrefixName='-o-';
}else if( System.env.platform(System.env.BROWSER_IE) && System.env.version(9,'>=') )
{
    fix.cssPrefixName='-ms-';
}

if( fix.cssPrefixName==="-webkit-" && typeof Event !== "undefined" )
{
    Event.fix.cssprefix="webkit";
}

//set hooks for userSelect style
fix.cssHooks.userSelect={
    get: function( style )
    {
        return style[ getStyleName('userSelect') ] || '';
    },
    set: function( style, value )
    {
        style[ getStyleName('userSelect') ] = value;
        style['-moz-user-fetch'] = value;
        style['-webkit-touch-callout'] = value;
        style['-khtml-user-fetch'] = value;
        return true;
    }
};

//set hooks for radialGradient and linearGradient style
fix.cssHooks.radialGradient=fix.cssHooks.linearGradient={

    get: function( style, name )
    {
        return storage(this, name ) || '';
    },
    set: function( style, value, name )
    {
        value = System.trim(value);
        storage(this, name , value);
        if( ( System.env.platform(System.env.BROWSER_SAFARI) && System.env.version(5.1,'<') )  ||
            ( System.env.platform(System.env.BROWSER_CHROME) && System.env.version(10,'<') ) )
        {
            var position='';
            var deg= 0;
            if(name==='radialGradient')
            {
                position=value.match(/([^\#]*)/);
                if( position ){
                    position = position[1].replace(/\,\s*$/,'');
                    value=value.replace(/([^\#]*)/,'')
                }
                value = value.split(',');
            }else
            {
                var deg = value.match(/^(\d+)deg/);
                value = value.split(',');
                if( deg )
                {
                    deg = deg[1];
                    value.splice(0,1);
                }
                deg=System.parseFloat(deg) || 0;
            }
            var color = [];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                if( i===0 )color.push("from("+item[0]+")");
                if( !(i===0 || i===value.length-1 ) || typeof item[1] !== "undefined"  )
                {
                    var num = (item[1]>>0) / 100;
                    color.push( "color-stop("+num+","+item[0]+")" );
                }
                if( i===value.length-1 )
                    color.push("to("+item[0]+")");
            }

            var width= fix.getsizeval.call(this,'Width');
            var height= fix.getsizeval.call(this,'Height');
            if(name==='radialGradient')
            {
                position = position.split(/\,/,2);
                var point = System.trim(position[0]).split(/\s+/,2);
                if(point.length===1)point.push('50%');
                var point = point.join(' ');
                position=point+',0, '+point+', '+width/2;
                value=System.sprintf("%s,%s,%s",'radial',position,color.join(',') );

            }else{

                var x1=Math.cos(  deg*(Math.PI/180) );
                var y1=Math.sin(  deg*(Math.PI/180) );
                value=System.sprintf("%s,0% 0%,%s %s,%s",'linear',Math.round(x1*width),Math.round(y1*height),color.join(',') );
            }
            name='gradient';

        }else if( !value.match(/^(left|top|right|bottom|\d+)/) && name==='linearGradient' )
        {
            value= '0deg,'+value;

        }else if( name==='linearGradient' )
        {
            value= value.replace(/^(\d+)(deg)?/,'$1deg')
        }

        var prop = 'background-image';
        if( System.env.platform(System.env.BROWSER_IE,9) )
        {
            value=value.split(',');
            var deg = value.splice(0,1).toString();
            deg = parseFloat( deg ) || 0;
            var color=[];
            for(var i=0; i<value.length; i++)
            {
                var item = System.trim(value[i]).split(/\s+/,2);
                color.push( i%1===1 ? "startColorstr='"+item[0]+"'" :  "endColorstr='"+item[0]+"'" );
            }
            var type = deg % 90===0 ? '1' : '0';
            var linear = name==='linearGradient' ? '1' : '2';
            value = 'alpha(opacity=100 style='+linear+' startx=0,starty=5,finishx=90,finishy=60);';
            value= style.filter || '';
            value += System.sprintf(";progid:DXImageTransform.Microsoft.gradient(%s, GradientType=%s);",color.join(','), type );
            value += "progid:DXImageTransform.Microsoft.gradient(enabled = false);";
            prop='filter';

        }else
        {
            value= System.sprintf('%s(%s)', getStyleName( name ) , value ) ;
        }
        style[ prop ] = value ;
        return true;
    }
};

//@internal Element.fix;
Element.fix = fix;
Element.createElement = createElement;
Element.querySelector=querySelector;

/**
 * @private
 */
var animationSupport=null;

/**
 * 判断是否支持css3动画
 * @returns {boolean}
 */
Element.isAnimationSupport = function isAnimationSupport()
{
    if( animationSupport === null )
    {
        var prefix = fix.cssPrefixName;
        var div = Element.createElement('div');
        var prop = prefix+'animation-play-state';
        div.style[prop] = 'paused';
        animationSupport = div.style[prop] === 'paused';
    }
    return animationSupport;
};

var createdAnimationHash = {};

/**
 * 生成css3样式动画
 * properties={
*    '0%':'left:10px;',
*    '100%':'left:100px;'
* }
 */
Element.createAnimationStyleSheet=function(stylename, properties)
{
    if( !Element.isAnimationSupport() )return false;
    stylename = stylename.replace(".","_");
    var css=["{"];
    if( createdAnimationHash[stylename] ===true )
    {
        return stylename;
    }
    createdAnimationHash[stylename] = true;
    for( var i in properties )
    {
        css.push( i + ' {');
        if( System.isObject(properties[i]) )
        {
            css.push( System.serialize( properties[i], 'style' ) );
        }else
        {
            css.push( properties[i] );
        }
        css.push( '}' );
    }
    css.push('}');

    if( Element.addStyleSheet( '@'+fix.cssPrefixName+'keyframes '+stylename, css.join("\r\n") ) )
    {
        return stylename;
    }
    return null;
};

/**
 * @private
 */
var headStyle =null;

/**
 * @param string style
 */
Element.addStyleSheet=function addStyleSheet(styleName, StyleSheetObject)
{
    if( headStyle=== null )
    {
        var head = document.getElementsByTagName('head')[0];
        headStyle = document.createElement('style');
        head.appendChild( headStyle );
    }

    if( System.isObject(StyleSheetObject) )
    {
        StyleSheetObject= formatStyleSheet(StyleSheetObject,'object');
    }else {
        StyleSheetObject = formatStyleSheet( System.trim(StyleSheetObject) ,'string');
    }

    if( System.env.platform( System.env.BROWSER_IE, 8 ) )
    {
        var styleName = styleName.split(',');
        var styleSheet = headStyle.styleSheet;
        StyleSheetObject = StyleSheetObject.replace(/^\{/,'').replace(/\}$/,'');
        try {
            for (var i = 0; i < styleName.length; i++) {
                if (styleSheet.insertRule) {
                    styleSheet.insertRule(styleName + '{' + StyleSheetObject + '}', styleSheet.cssRules.length);
                }
                else {
                    styleSheet.addRule(styleName[i], StyleSheetObject, -1);
                }
            }
        }catch (e){}

    }else
    {
        if (StyleSheetObject.charAt(0) !== '{')
        {
            StyleSheetObject = '{' + StyleSheetObject + '}';
        }
        headStyle.appendChild( document.createTextNode(styleName + StyleSheetObject ) );
    }
    return true;
};
if( System.env.platform('IE',8) )
{
    var fix =  Element.fix;
    var cssOpacity = /opacity=([^)]*)/;
    var cssAalpha = /alpha\([^)]*\)/i;
    fix.cssMap['alpha'] = 'opacity';
    fix.cssHooks.opacity = {
        get: function (style) {
            return cssOpacity.test(style.filter || "") ? parseFloat(RegExp.$1) / 100 : 1;
        },
        set: function (style, value) {
            value = isNaN(value) ? 1 : Math.max(( value > 1 ? ( Math.min(value, 100) / 100 ) : value ), 0);
            var opacity = "alpha(opacity=" + (value * 100) + ")",
                filter = style.filter || "";
            style.zoom = 1;
            style.filter = System.trim(filter.replace(cssAalpha, '') + " " + opacity);
            return true;
        }
    };
}
},

/***** Class es/events/ApplicationEvent.es *****/

"es/events/ApplicationEvent.es": function(module,require){
var ApplicationEvent=function ApplicationEvent(){
constructor.apply(this,arguments);
};
module.exports=ApplicationEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"container":undefined}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.ApplicationEvent",15);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ApplicationEvent",15);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ApplicationEvent",15);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.ApplicationEvent").valueOf();
var method={"FETCH_ROOT_CONTAINER":{"value":'applicationFetchRootContainer',"type":16}
};
for(var prop in method){
	Object.defineProperty(ApplicationEvent, prop, method[prop]);
}
var proto={"constructor":{"value":ApplicationEvent},"getContainer":{"value":function(){
	return this[__PRIVATE__].container;
},"type":2},"setContainer":{"value":function(val){
	return this[__PRIVATE__].container=val;
},"type":2}};
ApplicationEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/ApplicationEvent.es",ApplicationEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"ApplicationEvent",
	"uri":["o8","K9","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/interfaces/IDisplay.es *****/

"es/interfaces/IDisplay.es": function(module,require){
var IDisplay=function IDisplay(){
throw new TypeError("\"es.interfaces.IDisplay\" is not constructor.");
};
module.exports=IDisplay;
var es_internal=require("es/core/es_internal.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.interfaces.IDisplay").valueOf();
Internal.defineClass("es/interfaces/IDisplay.es",IDisplay,{
	"package":"es.interfaces",
	"classname":"IDisplay"
},2);

},

/***** Class es/core/View.es *****/

"es/core/View.es": function(module,require){
var View=function View(){
constructor.apply(this,arguments);
};
module.exports=View;
var Application=require("es/core/Application.es");
var Skin=require("es/core/Skin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Event=require("system/Event.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(context){
	Object.defineProperty(this,__PRIVATE__,{value:{"_context":undefined}});

	if(!System.is(context, Application))throw new TypeError("type does not match. must be Application","es.core.View",33);
	Skin.call(this,context.getContainer());
	this[__PRIVATE__]._context=context;
};
var __PRIVATE__=Symbol("es.core.View").valueOf();
var method={"CHARSET_GB2312":{"value":'GB2312',"type":16}
,"CHARSET_GBK":{"value":'GBK',"type":16}
,"CHARSET_UTF8":{"value":'UTF-8',"type":16}
};
for(var prop in method){
	Object.defineProperty(View, prop, method[prop]);
}
var proto={"constructor":{"value":View},"a14__context":{"writable":true,"value":undefined,"type":8}
,"getContext":{"value":function context(){
	return this[__PRIVATE__]._context;
},"type":2},"getTitle":{"value":function title(){
	return this[__PRIVATE__]._context.getTitle();
},"type":2},"setTitle":{"value":function title(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.View",58);
	this[__PRIVATE__]._context.setTitle(value);
},"type":4},"display":{"value":function display(){
	var init=this.L15_getInitialized();
	var elem=Skin.prototype.display.call(this);
	if(!init&&this.hasEventListener("INTERNAL_BEFORE_CHILDREN")){
		this.dispatchEvent(new Event("INTERNAL_BEFORE_CHILDREN"));
	}
	return elem;
},"type":1}
};
View.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/core/View.es",View,{
	"extends":Skin,
	"package":"es.core",
	"classname":"View",
	"uri":["a14","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/Skin.es *****/

"es/core/Skin.es": function(module,require){
var Skin=function Skin(){
constructor.apply(this,arguments);
};
module.exports=Skin;
var SkinComponent=require("es/components/SkinComponent.es");
var Container=require("es/core/Container.es");
var SkinEvent=require("es/events/SkinEvent.es");
var State=require("es/core/State.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IContainer=require("es/interfaces/IContainer.es");
var IBindable=require("es/interfaces/IBindable.es");
var es_internal=require("es/core/es_internal.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Bindable=require("system/Bindable.es");
var ReferenceError=require("system/ReferenceError.es");
var EventDispatcher=require("system/EventDispatcher.es");
var ElementEvent=require("system/ElementEvent.es");
var Function=require("system/Function.es");
var Dictionary=require("system/Dictionary.es");
var RangeError=require("system/RangeError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(name,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_bindable":null,"_currentStateGroup":null,"initialized":false,"invalidate":false,"bindEventMaps":{},"elementMaps":{},"timeoutId":null,"callback":null,"_dataset":{},"_installer":null,"_dictionary":null,"_children":[],"statesGroup":{},"_currentState":null}});

	if(attr === undefined ){attr=null;}
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",27);
	var elem=null;
	if(System.typeOf(name)==="string"){
		elem=new Element(document.createElement(name));
	}
	else if(System.instanceOf(name, Element)){
		elem=Reflect.type(name,Element);
	}
	else if(Element.isNodeElement(name)){
		elem=new Element(name);
	}
	else if(System.is(name, IDisplay)){
		elem=Reflect.type(name,IDisplay).getElement();
	}
	Container.call(this,elem,attr);
};
var __PRIVATE__=Symbol("es.core.Skin").valueOf();
var method={};
var proto={"constructor":{"value":Skin},"L15_render":{"value":function render(){
	return this.getChildren().slice(0);
},"type":1}
,"m16__bindable":{"writable":true,"value":null,"type":8}
,"L15_getBindable":{"value":function bindable(){
	var value=this[__PRIVATE__]._bindable;
	if(!value){
		value=new Bindable(this,"*");
		this[__PRIVATE__]._bindable=value;
	}
	return value;
},"type":2},"m16__currentStateGroup":{"writable":true,"value":null,"type":8}
,"L15_getCurrentStateGroup":{"value":function getCurrentStateGroup(){
	var p;
	var currentState=this[__PRIVATE__]._currentState;
	if(!currentState){
		throw new ReferenceError('State is not define.',"es.core.Skin","92:64");
	}
	if(this[__PRIVATE__]._currentStateGroup){
		return this[__PRIVATE__]._currentStateGroup;
	}
	var state=null;
	var statesGroup=this[__PRIVATE__].statesGroup;
	if(statesGroup.hasOwnProperty(currentState)){
		state=Reflect.type(statesGroup[currentState],State);
		this[__PRIVATE__]._currentStateGroup=state;
		return state;
	}
	for(p in statesGroup){
		state=Reflect.type(statesGroup[p],State);
		if(state.includeIn(currentState)){
			this[__PRIVATE__]._currentStateGroup=state;
			return state;
		}
	}
	throw new ReferenceError('"'+currentState+'"'+' is not define',"es.core.Skin","117:81");
},"type":1}
,"L15_initializing":{"value":function initializing(){
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
},"type":1}
,"L15_getInitialized":{"value":function(){
	return this[__PRIVATE__].initialized;
},"type":2},"L15_setInitialized":{"value":function(val){
	return this[__PRIVATE__].initialized=val;
},"type":2},"m16_invalidate":{"writable":true,"value":false,"type":8}
,"L15_createChildren":{"value":function createChildren(){
	var e;
	var nodes;
	if(this[__PRIVATE__].invalidate===false){
		if(this[__PRIVATE__].timeoutId){
			System.clearTimeout(Reflect.type(this[__PRIVATE__].timeoutId,Number));
			this[__PRIVATE__].timeoutId=null;
		}
		this[__PRIVATE__].invalidate=true;
		nodes=this.L15_render();
		this.L15_updateChildren(this,nodes);
		this.m16_updateInstallState();
		this.L15_updateDisplayList();
		if(this.hasEventListener(SkinEvent.UPDATE_DISPLAY_LIST)){
			e=new SkinEvent(SkinEvent.UPDATE_DISPLAY_LIST);
			e.setChildren(nodes);
			this.dispatchEvent(e);
		}
	}
},"type":1}
,"m16_bindEventMaps":{"writable":true,"value":{},"type":8}
,"L15_bindEvent":{"value":function bindEvent(index,uniqueKey,target,events){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",184);
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",184);
	if(!System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",184);
	var p;
	var uukey=Reflect.type((index+""+uniqueKey),String);
	var data=this[__PRIVATE__].bindEventMaps[uukey];
	if(!data){
		data={"items":{},"origin":target};
		this[__PRIVATE__].bindEventMaps[uukey]=data;
		if(System.instanceOf(target, EventDispatcher)){
			data.eventTarget=target;
		}
		else {
			data.eventTarget=new EventDispatcher(target);
		}
	}
	for(p in events){
		if(Reflect.get(Skin,data.items,p)!==events[p]){
			if(Reflect.get(Skin,data.items,p)){
				Reflect.call(Skin,data.eventTarget,"removeEventListener",[p,Reflect.get(Skin,data.items,p)]);
			}
			if(events[p]){
				Reflect.set(Skin,data.items,p,events[p]);
				Reflect.call(Skin,data.eventTarget,"addEventListener",[p,events[p],false,0,this]);
			}
		}
	}
},"type":1}
,"m16_elementMaps":{"writable":true,"value":{},"type":8}
,"L15_createElement":{"value":function createElement(index,uniqueKey,name,children,attrs,update,events){
	if(events === undefined ){events=null;}
	if(update === undefined ){update=null;}
	if(attrs === undefined ){attrs=null;}
	if(children === undefined ){children=null;}
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",232);
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",232);
	if(attrs!==null && !System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	if(update!==null && !System.is(update, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	if(events!==null && !System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",232);
	var uukey=Reflect.type((uniqueKey+''+index),String);
	var obj=Reflect.type(this[__PRIVATE__].elementMaps[uukey],Node);
	if(!obj){
		obj=document.createElement(name);
		this[__PRIVATE__].elementMaps[uukey]=obj;
		if(attrs){
			this.attributes(obj,attrs);
		}
	}
	if(children){
		if(System.typeOf(children)==="object"){
			if(!(System.instanceOf(children, Array))){
				children=[children];
			}
			this.L15_updateChildren(obj,children);
		}
		else {
			obj.textContent=children+"";
		}
	}
	if(update){
		this.attributes(obj,update);
	}
	if(events){
		this.L15_bindEvent(index,uniqueKey,obj,events);
	}
	return obj;
},"type":1}
,"L15_createComponent":{"value":function createComponent(index,uniqueKey,classTarget,tagName,children,attrs,update,events){
	if(events === undefined ){events=null;}
	if(update === undefined ){update=null;}
	if(attrs === undefined ){attrs=null;}
	if(children === undefined ){children=null;}
	if(tagName === undefined ){tagName=null;}
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",282);
	if(!System.is(classTarget, "class"))throw new TypeError("type does not match. must be Class","es.core.Skin",282);
	if(tagName!==null && !System.is(tagName, String))throw new TypeError("type does not match. must be String","es.core.Skin",282);
	if(attrs!==null && !System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	if(update!==null && !System.is(update, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	if(events!==null && !System.is(events, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",282);
	var uukey=Reflect.type((uniqueKey+''+index),String);
	var obj=Reflect.type(this[__PRIVATE__].elementMaps[uukey],IDisplay);
	if(!obj){
		if(tagName){
			obj=Reflect.type(new classTarget(new Element(Element.createElement(tagName))),IDisplay);
		}
		else {
			obj=Reflect.type(new classTarget(uukey),IDisplay);
		}
		this[__PRIVATE__].elementMaps[uukey]=obj;
		if(attrs){
			this.attributes(obj.getElement(),attrs);
		}
	}
	if(children){
		if(!(System.instanceOf(children, Array))){
			children=[System.typeOf(children)==="object"?children:children+""];
		}
		if(System.instanceOf(obj, SkinComponent)){
			Reflect.type(obj,SkinComponent).setChildren(children);
		}
		else {
			this.L15_updateChildren(obj,children);
		}
	}
	if(update){
		this.attributes(obj.getElement(),update);
	}
	if(events){
		this.L15_bindEvent(index,uniqueKey,obj,events);
	}
	return obj;
},"type":1}
,"L15_updateChildren":{"value":function updateChildren(parentNode,children,index,total){
	if(total === undefined ){total=NaN;}
	if(index === undefined ){index=0;}
	if(!System.is(parentNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",338);
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",338);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be int","es.core.Skin",338);
	if(!System.is(total, Number))throw new TypeError("type does not match. must be int","es.core.Skin",338);
	var e;
	var childDisplay;
	var childItems;
	var owner;
	var elem;
	var isDisplay;
	var childItem;
	var oldNode;
	var newNode;
	if(!parentNode)return ;
	var parentDisplay=null;
	if(System.instanceOf(parentNode, SkinComponent)){
		Reflect.type(parentNode,SkinComponent).setChildren(children);
		return ;
	}
	else if(System.is(parentNode, IDisplay)){
		parentDisplay=Reflect.type(parentNode,IDisplay);
		parentNode=Reflect.type(parentNode,IDisplay).getElement().current();
	}
	var parent=Reflect.type(parentNode,Node);
	var totalNodes=parent.childNodes.length;
	var totalChilds=children.length;
	var len=System.isNaN(total)?Math.max(totalChilds,totalNodes):total;
	var i=index;
	var offset=0;
	while(i<len&&(i-index<totalChilds||i<totalNodes)){
		newNode=null;
		oldNode=Reflect.type(Reflect.get(Skin,parent.childNodes,i-offset),Node);
		childItem=children[i-index];
		isDisplay=System.is(childItem, IDisplay);
		if(isDisplay){
			elem=Reflect.type(childItem,IDisplay).display();
			owner=Reflect.type(childItem,IDisplay).getOwner();
			if(owner){
				this.m16_installer(Reflect.type(childItem,IDisplay),owner);
				offset++;
				i++;
				continue ;
			}
			else {
				newNode=Reflect.type(elem.current(),Node);
			}
		}
		else {
			if(System.typeOf(childItem)==="string"){
				if(Element.getNodeName(oldNode)==="text"){
					if(oldNode.textContent!==childItem){
						oldNode.textContent=Reflect.type(childItem,String);
					}
					i++;
					continue ;
				}
				else {
					newNode=Element.createElement("text");
					newNode.textContent=Reflect.type(childItem,String);
				}
			}
			else if(System.instanceOf(childItem, Array)){
				childItems=childItem;
				this.L15_updateChildren(parentNode,childItems,i,childItems.length+len);
				i+=childItems.length;
				len+=childItems.length;
				index+=childItems.length;
				i++;
				continue ;
			}
			else {
				newNode=Reflect.type(childItem,Node);
			}
		}
		if(newNode!==oldNode){
			if(newNode&&oldNode){
				parent.replaceChild(newNode,oldNode);
				this.m16_removeEvent(parent,oldNode);
			}
			else {
				if(oldNode){
					parent.removeChild(oldNode);
					this.m16_removeEvent(parent,oldNode);
					i++;
					continue ;
				}
				if(newNode){
					parent.appendChild(newNode);
				}
			}
			if(newNode&&isDisplay){
				childDisplay=Reflect.type(childItem,IDisplay);
				if(parentDisplay){
					childDisplay.s3_setParentDisplay(Reflect.type(parentDisplay,IContainer));
				}
				e=new ElementEvent(ElementEvent.ADD);
				e.parent=parentDisplay||parent;
				e.child=newNode;
				childDisplay.getElement().dispatchEvent(e);
			}
		}
		i++;
	}
},"type":1}
,"m16_removeEvent":{"value":function removeEvent(parentNode,childNode){
	if(!System.is(parentNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",465);
	if(!System.is(childNode, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",465);
	var e=new ElementEvent(ElementEvent.REMOVE);
	e.parent=parentNode;
	e.child=childNode;
	(new EventDispatcher(childNode)).dispatchEvent(e);
},"type":1}
,"m16_timeoutId":{"writable":true,"value":null,"type":8}
,"m16_callback":{"writable":true,"value":null,"type":8}
,"L15_nowUpdate":{"value":function nowUpdate(delay){
	if(delay === undefined ){delay=200;}
	if(!System.is(delay, Number))throw new TypeError("type does not match. must be int","es.core.Skin",484);
	this[__PRIVATE__].invalidate=false;
	if(this[__PRIVATE__].timeoutId){
		System.clearTimeout(Reflect.type(this[__PRIVATE__].timeoutId,Number));
	}
	var callback=this[__PRIVATE__].callback;
	if(!callback){
		callback=this.L15_createChildren.bind(this);
		this[__PRIVATE__].callback=callback;
	}
	this[__PRIVATE__].timeoutId=System.setTimeout(callback,delay);
},"type":1}
,"assign":{"value":function assign(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",506);
	var dataset=this[__PRIVATE__]._dataset;
	if(value===null){
		return dataset[name];
	}
	if(dataset[name]!==value){
		dataset[name]=value;
		if(this.L15_getInitialized()){
			this.L15_nowUpdate();
		}
	}
	return value;
},"type":1}
,"m16__dataset":{"writable":true,"value":{},"type":8}
,"getDataset":{"value":function dataset(){
	return this[__PRIVATE__]._dataset;
},"type":2},"setDataset":{"value":function dataset(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",540);
	this[__PRIVATE__]._dataset=value;
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
},"type":4},"attributes":{"value":function attributes(target,attrs){
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",554);
	if(!System.is(attrs, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",554);
	if(target==null)return ;
	var isElem=System.instanceOf(target, Element);
	Object.forEach(attrs,function(value,name){
		if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",558);
		var prop;
		var elem;
		if(isElem){
			elem=Reflect.type(target,Element);
			if(name==="content"&&elem.text()!==value){
				elem.text(value);
			}
			else if(name==="innerHTML"&&target.innerHTML!==value){
				elem.html(Reflect.type(value,String));
			}
			else if(elem.property(name)!=value){
				elem.property(name,value);
			}
		}
		else {
			if(name==="content"){
				prop=System.typeOf(target.textContent)==="string"?"textContent":"innerText";
				if(target[prop]!==value){
					target[prop]=value;
				}
			}
			else if(name==="innerHTML"&&target.innerHTML!==value){
				target.innerHTML=Reflect.type(value,String);
			}
			else if(name==="class"||name==="className"){
				if(target.className!==attrs[name]){
					target.className=attrs[name];
				}
			}
			else if(Reflect.call(Skin,target,"getAttribute",[name])!=attrs[name]){
				Reflect.call(Skin,target,"setAttribute",[name,attrs[name]]);
			}
		}
	});
},"type":1}
,"m16__installer":{"writable":true,"value":null,"type":8}
,"m16_installer":{"value":function installer(child,viewport){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",613);
	if(!System.is(viewport, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Skin",613);
	var map=this[__PRIVATE__]._installer;
	if(map===null){
		map=new Dictionary();
		this[__PRIVATE__]._installer=map;
	}
	var install=map.get(child);
	if(!install){
		install={"viewport":viewport};
		map.set(child,install);
	}
	if(!install.state){
		viewport.addChild(child);
	}
	install.state=true;
},"type":1}
,"m16_updateInstallState":{"value":function updateInstallState(){
	var map=this[__PRIVATE__]._installer;
	if(map){
		Object.forEach(map.getAll(),function(item){
			if(!System.is(item, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",643);
			if(Reflect.get(Skin,item.value,"state")!==true&&Reflect.type(item.key,IDisplay).getParent()){
				Reflect.type(Reflect.get(Skin,item.value,"viewport"),IContainer).removeChild(Reflect.type(item.key,IDisplay));
			}
			Reflect.set(Skin,item.value,"state",false);
		});
	}
},"type":1}
,"m16__dictionary":{"writable":true,"value":null,"type":8}
,"m16_getDictionary":{"value":function dictionary(){
	var dict=this[__PRIVATE__]._dictionary;
	if(dict===null){
		dict=new Dictionary();
		this[__PRIVATE__]._dictionary=dict;
	}
	return dict;
},"type":2},"watch":{"value":function watch(name,target,propName,sourceTarget){
	if(sourceTarget === undefined ){sourceTarget=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",680);
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",680);
	if(!System.is(propName, String))throw new TypeError("type does not match. must be String","es.core.Skin",680);
	if(sourceTarget!==null && !System.is(sourceTarget, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",680);
	var dict;
	var bindable=this.L15_getBindable();
	if(sourceTarget){
		dict=this.m16_getDictionary();
		bindable=Reflect.type(dict.get(sourceTarget),Bindable);
		if(!bindable){
			bindable=new Bindable(sourceTarget,"*");
			dict.set(sourceTarget,bindable);
		}
	}
	bindable.bind(target,propName,name);
},"type":1}
,"unwatch":{"value":function unwatch(target,propName,sourceTarget){
	if(sourceTarget === undefined ){sourceTarget=null;}
	if(propName === undefined ){propName=null;}
	if(!System.is(target, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",700);
	if(propName!==null && !System.is(propName, String))throw new TypeError("type does not match. must be String","es.core.Skin",700);
	if(sourceTarget!==null && !System.is(sourceTarget, Object))throw new TypeError("type does not match. must be Object","es.core.Skin",700);
	var bindable;
	var bind;
	var dict;
	if(sourceTarget){
		dict=this.m16_getDictionary();
		bind=Reflect.type(dict.get(sourceTarget),Bindable);
		if(bind){
			bind.unbind(target,propName);
			dict.remove(sourceTarget);
		}
	}
	else {
		bindable=this.L15_getBindable();
		bindable.unbind(target,propName);
	}
},"type":1}
,"m16__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	return this[__PRIVATE__]._children.slice(0);
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",737);
	this[__PRIVATE__]._children=value.slice(0);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",750);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!children[index]){
		throw new RangeError('The index out of range',"es.core.Skin","756:62");
	}
	return Reflect.type(Reflect.get(Skin,children[index],"target"),IDisplay);
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",766);
	var children=this[__PRIVATE__]._children;
	var len=children.length;
	var index=0;
	for(;index<len;index++){
		if(Reflect.get(Skin,children[index],"target")===child){
			return index;
		}
	}
	return -1;
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",787);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",787);
	var parent=child.getParent();
	if(parent){
		parent.removeChild(child);
	}
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length+1:index;
	children.splice(index,0,child);
	child.s3_setParentDisplay(this);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
	return child;
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Skin",809);
	var children=this[__PRIVATE__]._children;
	var index=Reflect.type(this.getChildIndex(child),Number);
	if(index>=0){
		return this.removeChildAt(index);
	}
	else {
		throw new ReferenceError('The child is not added.',"es.core.Skin","817:67");
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Skin",826);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!(children.length>index)){
		throw new RangeError('The index out of range',"es.core.Skin","832:62");
	}
	var child=Reflect.type(children[index],IDisplay);
	children.splice(index,1);
	if(child.getParent()){
		child.getParent().removeChild(child);
	}
	child.s3_setParentDisplay(null);
	if(this.L15_getInitialized()){
		this.L15_nowUpdate();
	}
	return child;
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	var len=this[__PRIVATE__]._children.length;
	while(len>0){
		this.removeChildAt(--len);
	}
},"type":1}
,"m16_statesGroup":{"writable":true,"value":{},"type":8}
,"setStates":{"value":function states(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Skin",873);
	var name;
	var stateObj;
	var len=value.length;
	var i=0;
	var statesGroup=this[__PRIVATE__].statesGroup;
	for(;i<len;i++){
		stateObj=Reflect.type(value[i],State);
		name=stateObj.getName();
		if(!name)throw new TypeError('name is not define in Skin.states',"es.core.Skin","882:83");
		if(statesGroup.hasOwnProperty(name)){
			throw new TypeError('"'+name+'" has already been declared in Skin.states',"es.core.Skin","885:94");
		}
		statesGroup[name]=stateObj;
	}
},"type":4},"m16__currentState":{"writable":true,"value":null,"type":8}
,"getCurrentState":{"value":function currentState(){
	return this[__PRIVATE__]._currentState;
},"type":2},"setCurrentState":{"value":function currentState(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Skin",899);
	var current=this[__PRIVATE__]._currentState;
	if(current!==name){
		this[__PRIVATE__]._currentState=name;
		this[__PRIVATE__]._currentStateGroup=null;
		if(this.L15_getInitialized()){
			this.L15_nowUpdate();
		}
	}
},"type":4},"display":{"value":function display(){
	if(this.L15_getInitialized()===false){
		this.L15_setInitialized(true);
		this.L15_initializing();
	}
	Container.prototype.display.call(this);
	this.L15_nowUpdate(0);
	return this.getElement();
},"type":1}
};
Skin.prototype=Object.create( Container.prototype , proto);
Internal.defineClass("es/core/Skin.es",Skin,{
	"extends":Container,
	"package":"es.core",
	"classname":"Skin",
	"implements":[IBindable],
	"uri":["m16","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/Container.es *****/

"es/core/Container.es": function(module,require){
var Container=function Container(){
constructor.apply(this,arguments);
};
module.exports=Container;
var Display=require("es/core/Display.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var IContainer=require("es/interfaces/IContainer.es");
var es_internal=require("es/core/es_internal.es");
var BaseLayout=require("es/core/BaseLayout.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Object=require("system/Object.es");
var Array=require("system/Array.es");
var Reflect=require("system/Reflect.es");
var RangeError=require("system/RangeError.es");
var ReferenceError=require("system/ReferenceError.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(element,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_children":[],"_layout":null}});

	if(attr === undefined ){attr=null;}
	if(!System.is(element, Element))throw new TypeError("type does not match. must be Element","es.core.Container",22);
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Container",22);
	if(!Element.isHTMLContainer(element[0])){
		throw new TypeError("Invalid container element","es.core.Container","26:64");
	}
	Display.call(this,element,attr);
};
var __PRIVATE__=Symbol("es.core.Container").valueOf();
var method={};
var proto={"constructor":{"value":Container},"z17__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	return this[__PRIVATE__]._children.slice(0);
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.Container",51);
	this.removeAllChild();
	var len=value.length;
	var index=0;
	for(;index<len;index++){
		if(System.is(value[0], IDisplay)){
			this.addChild(Reflect.type(value[0],IDisplay));
		}
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",70);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	var result=Reflect.type(children[index],IDisplay);
	if(result==null){
		throw new RangeError('The index out of range',"es.core.Container","77:62");
	}
	return result;
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",87);
	var children=this[__PRIVATE__]._children;
	return children.indexOf(child);
},"type":1}
,"addChild":{"value":function addChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",98);
	return this.addChildAt(child,-1);
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",109);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",109);
	var parent=child.getParent();
	if(parent){
		parent.removeChild(child);
	}
	var children=this[__PRIVATE__]._children;
	var at=index<0?index+children.length+1:index;
	children.splice(at,0,child);
	child.s3_setParentDisplay(this);
	this.getElement().addChildAt(child.getElement(),index);
	return child;
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",129);
	var index=Reflect.type(this.getChildIndex(child),Number);
	if(index>=0){
		return this.removeChildAt(index);
	}
	else {
		throw new ReferenceError('The child is not added.',"es.core.Container","136:67");
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.core.Container",145);
	var children=this[__PRIVATE__]._children;
	index=index<0?index+children.length:index;
	if(!(children.length>index)){
		throw new RangeError('The index out of range',"es.core.Container","151:62");
	}
	var child=Reflect.type(children[index],IDisplay);
	children.splice(index,1);
	this.getElement().removeChild(child.getElement());
	child.s3_setParentDisplay(null);
	return child;
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	var len=this[__PRIVATE__]._children.length;
	while(len>0){
		this.removeChildAt(--len);
	}
	this.getElement().html('');
},"type":1}
,"contains":{"value":function contains(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.Container",179);
	return Element.contains(this.getElement(),child.getElement());
},"type":1}
,"z17__layout":{"writable":true,"value":null,"type":8}
,"getLayout":{"value":function layout(){
	return this[__PRIVATE__]._layout;
},"type":2},"setLayout":{"value":function layout(value){
	if(!System.is(value, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.Container",194);
	value.setTarget(this);
	this[__PRIVATE__]._layout=value;
},"type":4}};
Container.prototype=Object.create( Display.prototype , proto);
Internal.defineClass("es/core/Container.es",Container,{
	"extends":Display,
	"package":"es.core",
	"classname":"Container",
	"implements":[IContainer],
	"uri":["z17","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/Display.es *****/

"es/core/Display.es": function(module,require){
var Display=function Display(){
constructor.apply(this,arguments);
};
module.exports=Display;
var Element=require("system/Element.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var es_internal=require("es/core/es_internal.es");
var IContainer=require("es/interfaces/IContainer.es");
var EventDispatcher=require("system/EventDispatcher.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(element,attr){
	Object.defineProperty(this,__PRIVATE__,{value:{"_element":undefined,"_width":NaN,"_height":NaN,"_visible":false,"_visibleFlag":false,"parentDisplay":null,"_owner":null}});

	if(attr === undefined ){attr=null;}
	if(!System.is(element, Element))throw new TypeError("type does not match. must be Element","es.core.Display",26);
	if(attr!==null && !System.is(attr, Object))throw new TypeError("type does not match. must be Object","es.core.Display",26);
	if(element==null||element.length!=1){
		throw new TypeError("The selector elements can only is a single element","es.core.Display","30:89");
	}
	if(!Element.isNodeElement(element[0])){
		throw new TypeError("Invalid node element","es.core.Display","34:58");
	}
	this[__PRIVATE__]._element=element;
	if(attr){
		if(attr.innerHTML){
			element.html(attr.innerHTML);
			delete attr.innerHTML;
		}
		else if(attr.content){
			element.text(attr.content);
			delete attr.content;
		}
		element.properties(attr);
	}
	EventDispatcher.call(this,element);
};
var __PRIVATE__=Symbol("es.core.Display").valueOf();
var method={};
var proto={"constructor":{"value":Display},"U18__element":{"writable":true,"value":undefined,"type":8}
,"getElement":{"value":function element(){
	return this[__PRIVATE__]._element;
},"type":2},"U18__width":{"writable":true,"value":NaN,"type":8}
,"getWidth":{"value":function width(){
	return System.isNaN(this[__PRIVATE__]._width)?this[__PRIVATE__]._element.width():this[__PRIVATE__]._width;
},"type":2},"setWidth":{"value":function width(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.core.Display",80);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._width=value;
		this[__PRIVATE__]._element.width(value);
	}
},"type":4},"U18__height":{"writable":true,"value":NaN,"type":8}
,"getHeight":{"value":function height(){
	return System.isNaN(this[__PRIVATE__]._height)?this[__PRIVATE__]._element.height():this[__PRIVATE__]._height;
},"type":2},"setHeight":{"value":function height(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.core.Display",107);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._height=value;
		this[__PRIVATE__]._element.height(value);
	}
},"type":4},"U18__visible":{"writable":true,"value":false,"type":8}
,"U18__visibleFlag":{"writable":true,"value":false,"type":8}
,"getVisible":{"value":function visible(){
	if(this[__PRIVATE__]._visibleFlag===false){
		return !(this[__PRIVATE__]._element.style("display")==="none");
	}
	return this[__PRIVATE__]._visible;
},"type":2},"setVisible":{"value":function visible(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Display",126);
	this[__PRIVATE__]._visible=flag;
	this[__PRIVATE__]._visibleFlag=true;
	flag===false?this[__PRIVATE__]._element.hide():this[__PRIVATE__]._element.show();
},"type":4},"property":{"value":function property(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Display",152);
	return this[__PRIVATE__]._element.property(name,value);
},"type":1}
,"style":{"value":function style(name,value){
	if(value === undefined ){value=null;}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.Display",163);
	return this[__PRIVATE__]._element.style(name,value);
},"type":1}
,"getScrollTop":{"value":function scrollTop(){
	return this[__PRIVATE__]._element.scrollTop();
},"type":2},"setScrollTop":{"value":function scrollTop(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",181);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.scrollTop(value);
	}
},"type":4},"getScrollLeft":{"value":function scrollLeft(){
	return this[__PRIVATE__]._element.scrollTop();
},"type":2},"setScrollLeft":{"value":function scrollLeft(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",202);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.scrollTop(value);
	}
},"type":4},"getScrollWidth":{"value":function scrollWidth(){
	return this[__PRIVATE__]._element.scrollWidth();
},"type":2},"getScrollHeight":{"value":function scrollHeight(){
	return this[__PRIVATE__]._element.scrollHeight();
},"type":2},"getBoundingRect":{"value":function getBoundingRect(global){
	if(global === undefined ){global=false;}
	if(!System.is(global, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.Display",234);
	return this[__PRIVATE__]._element.getBoundingRect(global);
},"type":1}
,"getLeft":{"value":function left(){
	return this[__PRIVATE__]._element.left();
},"type":2},"setLeft":{"value":function left(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",252);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.left(value);
	}
},"type":4},"getTop":{"value":function top(){
	return this[__PRIVATE__]._element.top();
},"type":2},"setTop":{"value":function top(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",272);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.top(value);
	}
},"type":4},"getRight":{"value":function right(){
	return this[__PRIVATE__]._element.right();
},"type":2},"setRight":{"value":function right(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",292);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.right(value);
	}
},"type":4},"getBottom":{"value":function bottom(){
	return this[__PRIVATE__]._element.bottom();
},"type":2},"setBottom":{"value":function bottom(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.Display",312);
	if(!System.isNaN(value)){
		this[__PRIVATE__]._element.bottom(value);
	}
},"type":4},"localToGlobal":{"value":function localToGlobal(left,top){
	if(!System.is(left, Number))throw new TypeError("type does not match. must be int","es.core.Display",326);
	if(!System.is(top, Number))throw new TypeError("type does not match. must be int","es.core.Display",326);
	return this[__PRIVATE__]._element.localToGlobal(left,top);
},"type":1}
,"globalToLocal":{"value":function globalToLocal(left,top){
	if(!System.is(left, Number))throw new TypeError("type does not match. must be int","es.core.Display",337);
	if(!System.is(top, Number))throw new TypeError("type does not match. must be int","es.core.Display",337);
	return this[__PRIVATE__]._element.globalToLocal(left,top);
},"type":1}
,"U18_parentDisplay":{"writable":true,"value":null,"type":8}
,"s3_setParentDisplay":{"value":function setParentDisplay(value){
	if(value === undefined ){value=null;}
	if(value!==null && !System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Display",350);
	this[__PRIVATE__].parentDisplay=value;
},"type":1}
,"getParent":{"value":function parent(){
	return this[__PRIVATE__].parentDisplay;
},"type":2},"inDocumentChain":{"value":function inDocumentChain(){
	return Element.contains(document,this[__PRIVATE__]._element[0]);
},"type":1}
,"display":{"value":function display(){
	return this[__PRIVATE__]._element;
},"type":1}
,"U18__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.Display",401);
	this[__PRIVATE__]._owner=value;
},"type":4}};
Display.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/Display.es",Display,{
	"extends":null,
	"package":"es.core",
	"classname":"Display",
	"implements":[IDisplay],
	"uri":["U18","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/es_internal.es *****/

"es/core/es_internal.es": function(module,require){
var es_internal=function es_internal(prefix,uri){
Namespace.call(this,prefix,uri);
};
module.exports=es_internal;
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var Namespace=require("system/Namespace.es");
Object.defineProperty(es_internal, "valueOf", {value:function valueOf(){
return "es.core/public:es_internal";
}});
Internal.defineClass("es/core/es_internal.es",es_internal,{
	"ns":"s3",
	"package":"es.core",
	"classname":"es_internal"
},3);

},

/***** Class es/interfaces/IContainer.es *****/

"es/interfaces/IContainer.es": function(module,require){
var IContainer=function IContainer(){
throw new TypeError("\"es.interfaces.IContainer\" is not constructor.");
};
module.exports=IContainer;
var IDisplay=require("es/interfaces/IDisplay.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.interfaces.IContainer").valueOf();
Internal.defineClass("es/interfaces/IContainer.es",IContainer,{
	"package":"es.interfaces",
	"classname":"IContainer"
},2);

},

/***** System system/RangeError.es *****/

"system/RangeError.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Error,Object;
 */
function RangeError( message , filename, line)
{
    Error.call(this,  message , filename, line);
};

module.exports =RangeError;
var Error =require("system/Error.es");
var Object =require("system/Object.es");

RangeError.prototype = Object.create( Error.prototype ,{
    "constructor":{value:RangeError}
});
RangeError.prototype.name='RangeError';
},

/***** Class es/core/BaseLayout.es *****/

"es/core/BaseLayout.es": function(module,require){
var BaseLayout=function BaseLayout(){
constructor.apply(this,arguments);
};
module.exports=BaseLayout;
var IDisplay=require("es/interfaces/IDisplay.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var Event=require("system/Event.es");
var Element=require("system/Element.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var ElementEvent=require("system/ElementEvent.es");
var StyleEvent=require("system/StyleEvent.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"_target":null,"_children":[],"_parent":null,"_viewport":null,"_gap":0}});

	EventDispatcher.call(this);
};
var __PRIVATE__=Symbol("es.core.BaseLayout").valueOf();
var method={"a21_rootLayouts":{"writable":true,"value":[],"type":8}
,"a21_initialize":{"writable":true,"value":false,"type":8}
,"a21_initRootLayout":{"value":function initRootLayout(){
	if(BaseLayout.a21_initialize===false){
		BaseLayout.a21_initialize=true;
		System.getGlobalEvent().addEventListener(Event.INITIALIZE_COMPLETED,BaseLayout.a21_nowUpdateLayout);
		System.getGlobalEvent().addEventListener(Event.RESIZE,BaseLayout.a21_nowUpdateLayout);
	}
},"type":1}
,"a21_nowUpdateLayout":{"value":function nowUpdateLayout(){
	var layout;
	var len=BaseLayout.a21_rootLayouts.length;
	var index=0;
	for(;index<len;index++){
		layout=BaseLayout.a21_rootLayouts[index];
		layout.M22_nowUpdateChildren(parseInt(layout.getViewport().width()),parseInt(layout.getViewport().height()));
	}
},"type":1}
,"a21_findLayoutByTarget":{"value":function findLayoutByTarget(children,target){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",55);
	var layout;
	var item;
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		item=children[i];
		if(item.getTarget()===target){
			return item;
		}
		layout=BaseLayout.a21_findLayoutByTarget(item[__PRIVATE__]._children,target);
		if(layout){
			return layout;
		}
	}
	return null;
},"type":1}
,"a21_findParentLayout":{"value":function findParentLayout(children,elem){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",80);
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",80);
	var parent;
	var item;
	var len=children.length;
	var i=0;
	for(;i<len;i++){
		item=children[i];
		parent=BaseLayout.a21_findParentLayout(item[__PRIVATE__]._children,elem);
		if(parent){
			return parent;
		}
		if(Element.contains(item.getTarget().getElement(),elem)){
			return item;
		}
	}
	return null;
},"type":1}
,"a21_findChildrenLayout":{"value":function findChildrenLayout(children,elem){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",106);
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",106);
	var item;
	var len=children.length;
	var i=0;
	var results=[];
	for(;i<len;i++){
		item=children[i];
		if(Element.contains(elem,item.getTarget().getElement())){
			results.push(item);
		}
	}
	return results;
},"type":1}
,"a21_assignParentForLayoutChildren":{"value":function assignParentForLayoutChildren(layoutChildren,parent){
	if(!System.is(layoutChildren, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",128);
	if(!System.is(parent, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",128);
	var i;
	var children=BaseLayout.a21_findChildrenLayout(layoutChildren,parent.getTarget().getElement());
	if(children.length>0){
		for(i=0;i<children.length;i++){
			layoutChildren.splice(layoutChildren.indexOf(children[i]),1);
			parent[__PRIVATE__]._children.push(children[i]);
			children[i][__PRIVATE__]._parent=parent;
		}
		return true;
	}
	return false;
},"type":1}
,"a21_addLayout":{"value":function addLayout(layout){
	if(!System.is(layout, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",148);
	var parent=BaseLayout.a21_findParentLayout(BaseLayout.a21_rootLayouts,layout.getTarget().getElement());
	if(parent){
		BaseLayout.a21_assignParentForLayoutChildren(parent[__PRIVATE__]._children,layout);
		if(parent[__PRIVATE__]._children.indexOf(layout)<0){
			parent[__PRIVATE__]._children.push(layout);
			layout[__PRIVATE__]._parent=parent;
		}
	}
	else {
		BaseLayout.a21_assignParentForLayoutChildren(BaseLayout.a21_rootLayouts,layout);
		if(BaseLayout.a21_rootLayouts.indexOf(layout)<0){
			BaseLayout.a21_rootLayouts.push(layout);
		}
	}
	BaseLayout.a21_initRootLayout();
},"type":1}
,"a21_removeLayout":{"value":function removeLayout(layout){
	if(!System.is(layout, BaseLayout))throw new TypeError("type does not match. must be BaseLayout","es.core.BaseLayout",172);
	var layoutChildren=BaseLayout.a21_rootLayouts;
	if(layout[__PRIVATE__]._parent){
		layoutChildren=layout[__PRIVATE__]._parent[__PRIVATE__]._children;
	}
	var index=layoutChildren.indexOf(layout);
	if(index>=0){
		delete layoutChildren.splice;
	}
},"type":1}
,"a21_updateRootLayout":{"value":function updateRootLayout(children){
	if(!System.is(children, Array))throw new TypeError("type does not match. must be Array","es.core.BaseLayout",190);
	var bElement;
	var bLayout;
	var index;
	var aElement;
	var aLayout;
	var seek=0;
	while(children.length>1&&seek<children.length){
		aLayout=children[seek];
		aElement=aLayout[__PRIVATE__]._target.getElement();
		index=Reflect.type(seek+1,Number);
		for(;index<children.length;index++){
			bLayout=children[index];
			bElement=bLayout[__PRIVATE__]._target.getElement();
			if(Element.contains(aElement,bElement)){
				aLayout[__PRIVATE__]._children.push(bLayout);
				bLayout[__PRIVATE__]._parent=aLayout;
				children.splice(index,1);
				index--;
				BaseLayout.a21_updateRootLayout(aLayout[__PRIVATE__]._children);
			}
			else if(Element.contains(bElement,aElement)){
				bLayout[__PRIVATE__]._children.push(aLayout);
				aLayout[__PRIVATE__]._parent=bLayout;
				children.splice(seek,1);
				BaseLayout.a21_updateRootLayout(bLayout[__PRIVATE__]._children);
				break ;
			}
		}
		seek++;
	}
},"type":1}
,"a21_rectangle":{"writable":true,"value":["Top","Bottom","Left","Right"],"type":8}
};
for(var prop in method){
	Object.defineProperty(BaseLayout, prop, method[prop]);
}
var proto={"constructor":{"value":BaseLayout},"a21__target":{"writable":true,"value":null,"type":8}
,"a21__children":{"writable":true,"value":[],"type":8}
,"a21__parent":{"writable":true,"value":null,"type":8}
,"getTarget":{"value":function target(){
	return this[__PRIVATE__]._target;
},"type":2},"setTarget":{"value":function target(value){
	if(!System.is(value, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.core.BaseLayout",250);
	var self;
	var layoutTarget;
	if(value!==this[__PRIVATE__]._target){
		if(this[__PRIVATE__]._target){
			layoutTarget=BaseLayout.a21_findLayoutByTarget(BaseLayout.a21_rootLayouts,this[__PRIVATE__]._target);
			if(layoutTarget){
				BaseLayout.a21_removeLayout(layoutTarget);
			}
		}
		self=this;
		value.getElement().addEventListener(ElementEvent.ADD,function(e){
			if(!System.is(e, ElementEvent))throw new TypeError("type does not match. must be ElementEvent","es.core.BaseLayout",263);
			if(Reflect.call(BaseLayout,this,"style",['position'])==="static"){
				Reflect.call(BaseLayout,this,"style",['position','relative']);
			}
			BaseLayout.a21_addLayout(self);
		});
		value.getElement().removeEventListener(ElementEvent.REMOVE,function(e){
			if(!System.is(e, ElementEvent))throw new TypeError("type does not match. must be ElementEvent","es.core.BaseLayout",270);
			Reflect.call(BaseLayout,this,"removeEventListener",[ElementEvent.REMOVE]);
			BaseLayout.a21_removeLayout(self);
		});
		this[__PRIVATE__]._target=value;
	}
},"type":4},"a21__viewport":{"writable":true,"value":null,"type":8}
,"getViewport":{"value":function viewport(){
	if(this[__PRIVATE__]._viewport===null){
		this[__PRIVATE__]._viewport=this[__PRIVATE__]._target.getElement().parent();
		this.a21_styleChange(this[__PRIVATE__]._viewport);
	}
	return this[__PRIVATE__]._viewport;
},"type":2},"setViewport":{"value":function viewport(value){
	if(!System.is(value, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",297);
	this[__PRIVATE__]._viewport=value;
	this.a21_styleChange(this[__PRIVATE__]._viewport);
},"type":4},"a21_styleChange":{"value":function styleChange(target){
	if(!System.is(target, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",321);
	var self=this;
	var oldWidth=NaN;
	var oldHeight=NaN;
	target.addEventListener(StyleEvent.CHANGE,function(e){
		if(!System.is(e, StyleEvent))throw new TypeError("type does not match. must be StyleEvent","es.core.BaseLayout",326);
		var width=Reflect.type(target.width(),Number);
		var height=Reflect.type(target.height(),Number);
		if(oldWidth!==width||oldHeight!==height){
			oldWidth=width;
			oldHeight=height;
			self.M22_nowUpdateChildren(width,height);
		}
	});
},"type":1}
,"M22_getChildByNode":{"value":function getChildByNode(nodeElement){
	var item;
	var len=this[__PRIVATE__]._children.length;
	var i=0;
	for(;i<len;i++){
		item=this[__PRIVATE__]._children[i];
		if(Reflect.get(BaseLayout,item.getTarget().getElement(),0)===nodeElement){
			return item;
		}
	}
	return null;
},"type":1}
,"a21__gap":{"writable":true,"value":0,"type":8}
,"getGap":{"value":function gap(){
	return this[__PRIVATE__]._gap;
},"type":2},"setGap":{"value":function gap(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",367);
	this[__PRIVATE__]._gap=value;
},"type":4},"M22_calculateWidth":{"value":function calculateWidth(elem,baseWidth){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",388);
	if(!System.is(baseWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",388);
	var cssWidth;
	var currentElem;
	if(!elem.hasProperty("init-layout-width")){
		if(!elem.hasProperty("percentWidth")&&!elem.hasProperty("explicitWidth")){
			currentElem=elem.current();
			cssWidth=Reflect.type(Reflect.get(BaseLayout,(currentElem.currentStyle||currentElem.style),"width"),String);
			if(cssWidth&&cssWidth.charAt(cssWidth.length-1)==="%"){
				elem.property("percentWidth",parseInt(cssWidth));
			}
			else {
				elem.property("explicitWidth",parseInt(elem.width()));
			}
		}
		elem.property("init-layout-width",1);
	}
	var value=0;
	if(elem.hasProperty("explicitWidth")){
		value=parseInt(elem.property("explicitWidth"));
	}
	else if(elem.hasProperty("percentWidth")){
		value=Reflect.type(parseInt(elem.property("percentWidth")),Number);
		value=Reflect.type(value>0?value*baseWidth/100:0,Number);
	}
	var maxWidth=1000000;
	var minWidth=0;
	if(elem.hasProperty("maxWidth")){
		maxWidth=parseInt(elem.property("maxWidth"));
	}
	if(elem.hasProperty("minWidth")){
		minWidth=parseInt(elem.property("minWidth"));
	}
	return Math.max(Math.min(value,maxWidth),minWidth);
},"type":1}
,"M22_calculateHeight":{"value":function calculateHeight(elem,baseWidth){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",438);
	if(!System.is(baseWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",438);
	var cssHeight;
	var currentElem;
	if(!elem.hasProperty("init-layout-height")){
		if(!elem.hasProperty("percentHeight")&&!elem.hasProperty("explicitHeight")){
			currentElem=elem.current();
			cssHeight=Reflect.type(Reflect.get(BaseLayout,(currentElem.currentStyle||currentElem.style),"height"),String);
			if(cssHeight&&cssHeight.charAt(cssHeight.length-1)==="%"){
				elem.property("percentHeight",parseInt(cssHeight));
			}
			else {
				elem.property("explicitHeight",parseInt(elem.height()));
			}
		}
		elem.property("init-layout-height",1);
	}
	var value=0;
	if(elem.hasProperty("explicitHeight")){
		value=parseInt(elem.property("explicitHeight"));
	}
	else if(elem.hasProperty("percentHeight")){
		value=parseInt(elem.property("percentHeight"));
		value=Reflect.type(value>0?value*baseWidth/100:0,Number);
	}
	var maxHeight=1000000;
	var minHeight=0;
	if(elem.hasProperty("maxHeight")){
		maxHeight=parseInt(elem.property("maxHeight"));
	}
	if(elem.hasProperty("minHeight")){
		minHeight=parseInt(elem.property("minHeight"));
	}
	return Math.max(Math.min(value,maxHeight),minHeight);
},"type":1}
,"M22_getRectangleBox":{"value":function getRectangleBox(elem){
	if(!System.is(elem, Element))throw new TypeError("type does not match. must be Element","es.core.BaseLayout",491);
	var lName;
	var uName;
	var value={};
	var i=0;
	for(;i<4;i++){
		uName=Reflect.type(BaseLayout.a21_rectangle[i],String);
		lName=uName.toLowerCase();
		value[lName]=parseInt(elem.property(lName));
		value['margin'+uName]=parseInt(elem.style('margin'+uName));
	}
	return value;
},"type":1}
,"M22_setLayoutSize":{"value":function setLayoutSize(width,height){
	if(!System.is(width, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",510);
	if(!System.is(height, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",510);
	this.getTarget().getElement().style('cssText',{"width":width,"height":height});
},"type":1}
,"M22_nowUpdateChildren":{"value":function nowUpdateChildren(width,height){
	if(!System.is(width, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",523);
	if(!System.is(height, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",523);
	var j;
	var isChild;
	var childNode;
	var layout;
	width=this.M22_calculateWidth(this.getTarget().getElement(),width);
	height=this.M22_calculateHeight(this.getTarget().getElement(),height);
	var len=this[__PRIVATE__]._children.length;
	var index=0;
	var parentNode=Reflect.type(this.getTarget().getElement().current(),Node);
	for(;index<len;index++){
		layout=this[__PRIVATE__]._children[index];
		childNode=Reflect.type(layout.getTarget().getElement().current(),Node);
		isChild=false;
		if(parentNode.hasChildNodes()){
			j=0;
			for(;j<parentNode.childNodes.length;j++){
				if(parentNode.childNodes.item(j)===childNode){
					isChild=true;
					break ;
				}
			}
		}
		if(isChild){
			layout.M22_nowUpdateChildren(width,height);
		}
		else {
			layout.M22_nowUpdateChildren(layout.getViewport().width(),layout.getViewport().height());
		}
	}
	this.M22_calculateChildren(width,height);
},"type":1}
,"M22_calculateChildren":{"value":function calculateChildren(parentWidth,parentHeight){
	if(!System.is(parentWidth, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",560);
	if(!System.is(parentHeight, Number))throw new TypeError("type does not match. must be int","es.core.BaseLayout",560);
},"type":1}
};
BaseLayout.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/BaseLayout.es",BaseLayout,{
	"extends":null,
	"package":"es.core",
	"classname":"BaseLayout",
	"uri":["a21","M22","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/interfaces/IBindable.es *****/

"es/interfaces/IBindable.es": function(module,require){
var IBindable=function IBindable(){
throw new TypeError("\"es.interfaces.IBindable\" is not constructor.");
};
module.exports=IBindable;
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.interfaces.IBindable").valueOf();
Internal.defineClass("es/interfaces/IBindable.es",IBindable,{
	"package":"es.interfaces",
	"classname":"IBindable"
},2);

},

/***** System system/Dictionary.es *****/

"system/Dictionary.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Symbol,Object
 */


/**
 * 可以使用非字符串作为键值的存储表
 * @constructor
 */
function Dictionary()
{
    if( !(this instanceof Dictionary) )
        return new Dictionary();
    storage(this,true,{map:[]});
}

module.exports = Dictionary;
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var Symbol =require("system/Symbol.es");
var storage=Internal.createSymbolStorage( Symbol('dictionary') );

function indexByKey(map,key)
{
    var i = 0,len=map.length
    for(; i<len; i++)
    {
        if( map[i].key===key )
        {
            return i;
        }
    }
    return -1;
};

Dictionary.prototype = Object.create( Object.prototype, {

/**
 * 设置指定键值的数据,如果相同的键值则会覆盖之前的值。
 * @param key
 * @param value
 * @returns {Dictionary}
 */
"set":{value:function set(key,value)
{
    var map =  storage(this,'map');
    var index = indexByKey(map,key);
    if( index < 0 )
    {
        map.push({'key':key,'value':value});
    }else
    {
        map[index].value=value;
    }
    return value;
}},

/**
 * 获取已设置的值
 * @param key
 * @returns {*}
 */
"get":{value:function get( key , defualt)
{
    var map =  storage(this,'map');
    var index = indexByKey(map,key);
    if( index >= 0 )
    {
       return map[index].value;

    }else if( typeof defualt !== "undefined" )
    {
        map.push({'key':key,'value':defualt});
        return defualt;
    }
    return undefined;
}},

/**
 * 返回所有已设置的数据
 * 数组中的每个项是一个对象
 * @returns {Array}
 */
"getAll":{value:function getAll()
{
    return storage(this,'map');
}},

/**
 * 返回有的key值
 * @returns {Array}
 */
"keys":{value:function keys()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].key);
    }
    return value;
}},

/**
 * 返回有键的值
 * @returns {Array}
 */
"values":{value:function values()
{
    var map = storage(this,'map');
    var value=[],i;
    for( i in map )
    {
        value.push(map[i].value);
    }
    return value;
}},

/**
 * 删除已设置过的对象,并返回已删除的值（如果存在）否则为空。
 * @param key
 * @returns {*}
 */
"remove":{value:function remove( key )
{
    var map = storage(this,'map');
    var index = indexByKey(map,key);
    if( index >=0 )
    {
        return map.splice(index,1);
    }
    return null;
}},

/**
 * 返回已设置数据的总数
 * @returns {Number}
 */
"count":{value:function count()
{
    var map = storage(this,'map');
    return map.length;
}}

});

},

/***** System system/Bindable.es *****/

"system/Bindable.es": function(module,require){
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Symbol,Reflect,Element,EventDispatcher,SyntaxError,ReferenceError
 */

/**
 * 提交属性到每个绑定的对象
 * @private
 * @param property
 * @param newValue
 */
function commitProperties(event)
{
    var property = Reflect.get(null,event,'property');
    var binding = storage(this,'binding');
    var hash = storage(this,'hash');
    var bind =  binding[ property ];
    
    if( bind )
    {
        var newValue = Reflect.get(null,event, 'newValue');

        //相同的属性值不再提交
        if (typeof newValue !== "undefined" && newValue !== hash[property] )
        {
            hash[property] = newValue;
            var i,item;
            for( i in bind )
            {
                item=bind[i];
                setProperty(item.item.element, item.name, newValue );
            }
        }
    }
}
/**
 * 设置属性值
 * @param object
 * @param prop
 * @param newValue
 */
function setProperty(object, prop, newValue )
{
    if( object instanceof Bindable )
    {
        Bindable.prototype.property.call(object,prop,newValue);

    }else if( Element.isNodeElement(object) )
    {
        if( typeof object[ prop ] !== "undefined"  )object[ prop ] = newValue;

    }else if( object instanceof Element )
    {
        if( typeof object[prop] === "function" )
        {
            object[prop]( newValue );
        }else
        {
            Element.prototype.property.call(object,prop,newValue);
        }

    }else if( Reflect.has(null, object, prop) )
    {
        Reflect.set(null, object, prop, newValue );
    }
}

function getProperty(object, prop )
{
    if( object instanceof Bindable )
    {
        return Bindable.prototype.property.call(object,prop);

    }else if( Element.isNodeElement(object) )
    {
       return object[ prop ];

    }else if( object instanceof Element )
    {
        if( typeof object[prop] === "function" )
        {
            return object[prop]();
        }else {
            return Element.prototype.property.call(object, prop);
        }

    }else if( Reflect.has(null, object, prop) )
    {
        return Reflect.get(null, object, prop );
    }
    return undefined;
}

/**
 * 数据双向绑定器
 * @param source 数据源对象。
 * 如果是一个EventDispatcher对象，则该对象上的所有 PropertyEvent.CHANGE 事件都会反应到此绑定器中
 * 如果是一个DOM元素则会监听当前元素的属性变更并反应到此绑定器中。
 * @param type 监听的事件类型, 默认为 PropertyEvent.CHANGE
 * @constructor
 */
function Bindable(source,properties)
{
    if( !(this instanceof Bindable) )
        return new Bindable( source );
    EventDispatcher.call(this , source );
    if( typeof properties === "string" )
    {
        properties = [ properties ];
    }
    if( !System.isArray(properties) )
    {
        throw new TypeError('Invalid properties must is be String or Array. in Bindable');
    }
    storage(this,true,{"source":source,"properties":properties,"hash":{},"subscriber":new Dictionary(),"binding":{}});
    this.addEventListener(PropertyEvent.CHANGE,commitProperties);
}

module.exports = Bindable;
var EventDispatcher =require("system/EventDispatcher.es");
var Object =require("system/Object.es");
var PropertyEvent =require("system/PropertyEvent.es");
var Symbol =require("system/Symbol.es");
var Dictionary =require("system/Dictionary.es");
var Symbol =require("system/Symbol.es");
var Element =require("system/Element.es");
var Reflect =require("system/Reflect.es");
var Internal =require("system/Internal.es");
var storage=Internal.createSymbolStorage( Symbol('Bindable') );


Bindable.prototype=Object.create( EventDispatcher.prototype,{
   "constructor":{value:Bindable}
});

/**
 * 指定对象到当前绑定器。
 * @param object target 绑定的目标对象。
 * @param string property 绑定目标对象的属性名。当绑定器中有属性变更时会更新这个属性名的值。
 * @param string name 绑定数据源中(source)的属性名。
 * @param boolean flag 一个布尔值， 如果为 false 此目标对象的属性发生变化时不会通知到此绑定器，默认为 true 通知。
 * @returns {Bindable}
 */
Bindable.prototype.bind=function bind(target, property, name, flag)
{
    var subscriber = storage(this,'subscriber');
    var properties = storage(this,'properties');
    var binding = storage(this,'binding');
    var item = subscriber.get(target,{binding:{},dispatcher:null,handle:null,element:target});
    var dispatch = flag !== false;
    name = name || property;
    if( typeof property !== "string" )
    {
        throw new TypeError("Invalid property must is be a String in Bindable.bind");
    }
    if( !(properties[0] ==='*' || properties.indexOf(name) >= 0) )
    {
        throw new TypeError("No binding source property name. in Bindable.bind");
    }

    //是否启用双向绑定
    if( dispatch && item.handle === null )
    {
        //创建一个可派发事件的对象
        if( !item.dispatcher )
        {
            dispatch = target;
            if( target instanceof Element ){

                item.element = target;
                dispatch = item.element;

            }else if( Element.isNodeElement(target) )
            {
                item.element = new Element(target);
                dispatch = item.element;
            }
            if( dispatch === target && !(target instanceof EventDispatcher) )dispatch = null;
            if( dispatch )item.dispatcher = dispatch;
        }

        //如果是一个可派发事件的对象，才能启用双向绑定
        if( item.dispatcher )
        {
            item.handle = function (event)
            {
                var property = Reflect.get(null,event,'property');
                var newValue = Reflect.get(null,event,'newValue');
                var oldValue = Reflect.get(null,event,'oldValue');
                if( property && typeof newValue !== "undefined" && newValue!==oldValue && item.binding.hasOwnProperty(property) )
                {
                    this.property( item.binding[ property ] , newValue );
                }
            };
            //如果目标对象的属性发生变化
            Reflect.call(null,item.dispatcher,'addEventListener',[PropertyEvent.CHANGE,item.handle,false,0,this] );
        }
    }

    if( !item.binding[ property ] )
    {
        item.binding[property] = name;
        ( binding[name] || (binding[name] = []) ).push({"name": property, "item": item});
    }
    var source = storage(this,'source');
    if( source )
    {
        if( !Reflect.has(null,source, name) )
        {
            throw new TypeError("target source property is not exists for '"+name+"'");
        }
        var value = Reflect.get(null,source, name);
        if( value )
        {
            setProperty(item.element, property, value );
        }
    }
    return this;
};

/**
 * 解除绑定(取消订阅)
 * @public
 * @param object target 数据对象，允许是一个 DOM元素、EventDispatcher、Object
 * @param string property 需要绑定的属性名
 * @returns {boolean}
 */
Bindable.prototype.unbind=function unbind(target,property)
{
    var subscriber = storage(this,'subscriber');
    var item=subscriber.get( target );
    var binding = storage(this,'binding');
    var bind;
    if( typeof property ==='string' )
    {
        if( item )
        {
            if( item.binding.hasOwnProperty( property ) )
            {
                var name = item.binding[property];
                if( binding[name] )
                {
                    removeItem(binding[name],item,property);
                    delete item.binding[property];
                    if( System.isEmpty(item.binding) )
                    {
                        item.dispatcher.removeEventListener(PropertyEvent.CHANGE,item.handle);
                    }
                    return true;
                }
            }
        }
        return false;
    }
    if( item )
    {
        for( var p in binding )
        {
            bind = binding[ p ];
            removeItem(bind,item);
        }
        item.dispatcher.removeEventListener(PropertyEvent.CHANGE,item.handle);
    }
    return !!subscriber.remove( target );
};

function removeItem( bind ,item, name )
{
    var index=0;
    for( ; index<bind.length; index++ )
    {
        if( bind[index].item === item && (!name || bind[index].name === name ) )
        {
            bind.splice(index--, 1);
        }
    }
}

/**
 * 提交属性的值到绑定器。
 * 调用此方法成功后会传递当前改变的值到绑定的对象中。
 * @param string name
 * @param void value
 */
Bindable.prototype.property=function property(name,value)
{
    if( typeof name === "string" )
    {
        var hash = storage(this,'hash');
        var old = hash[name];
        var source = storage(this, 'source');
        if (typeof value !== 'undefined' && old !== value )
        {
            //如果目标源属性没有定义
            if( !this.hasProperty(name) )return false;
            setProperty( source, name, value);
            var ev = new PropertyEvent(PropertyEvent.CHANGE);
            ev.property = name;
            ev.newValue = value;
            ev.oldValue = old;
            this.dispatchEvent(ev);
            return true;
        }
        return typeof old === "undefined" ? getProperty( source, name ) : old;
    }
    return false;
};

/**
 * 检查是否有指定的属性名
 * @param string name
 * @returns {boolean}
 */
Bindable.prototype.hasProperty=function hasProperty(name)
{
    var properties = storage(this,'properties');
    if( properties[0] === '*' )
    {
        return Reflect.has(null,storage(this,'source'),name);
    }
    return properties.indexOf(name) >= 0;
};

},

/***** Class es/core/State.es *****/

"es/core/State.es": function(module,require){
var State=function State(){
constructor.apply(this,arguments);
};
module.exports=State;
var EventDispatcher=require("system/EventDispatcher.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(name){
	Object.defineProperty(this,__PRIVATE__,{value:{"_name":'',"_stateGroup":[]}});

	EventDispatcher.call(this);
	if(name === undefined ){name='';}
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.core.State",14);
	this[__PRIVATE__]._name=name;
};
var __PRIVATE__=Symbol("es.core.State").valueOf();
var method={};
var proto={"constructor":{"value":State},"R25__name":{"writable":true,"value":'',"type":8}
,"R25__stateGroup":{"writable":true,"value":[],"type":8}
,"getName":{"value":function name(){
	return this[__PRIVATE__]._name;
},"type":2},"setName":{"value":function name(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.State",18);
	this[__PRIVATE__]._name=value;
},"type":4},"getStateGroup":{"value":function stateGroup(){
	return this[__PRIVATE__]._stateGroup;
},"type":2},"setStateGroup":{"value":function stateGroup(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.core.State",26);
	this[__PRIVATE__]._stateGroup=value;
},"type":4},"includeIn":{"value":function includeIn(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.core.State",34);
	return value===this[__PRIVATE__]._name||this[__PRIVATE__]._stateGroup.indexOf(value)>=0;
},"type":1}
};
State.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/State.es",State,{
	"extends":null,
	"package":"es.core",
	"classname":"State",
	"uri":["R25","f26","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/events/SkinEvent.es *****/

"es/events/SkinEvent.es": function(module,require){
var SkinEvent=function SkinEvent(){
constructor.apply(this,arguments);
};
module.exports=SkinEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"children":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.SkinEvent",13);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.SkinEvent",13);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.SkinEvent",13);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.SkinEvent").valueOf();
var method={"UPDATE_DISPLAY_LIST":{"value":'skinUpdateDisplayList',"type":16}
};
for(var prop in method){
	Object.defineProperty(SkinEvent, prop, method[prop]);
}
var proto={"constructor":{"value":SkinEvent},"getChildren":{"value":function(){
	return this[__PRIVATE__].children;
},"type":2},"setChildren":{"value":function(val){
	return this[__PRIVATE__].children=val;
},"type":2}};
SkinEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/SkinEvent.es",SkinEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"SkinEvent",
	"uri":["J27","V28","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/components/SkinComponent.es *****/

"es/components/SkinComponent.es": function(module,require){
var SkinComponent=function SkinComponent(){
constructor.apply(this,arguments);
};
module.exports=SkinComponent;
var Component=require("es/components/Component.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var es_internal=require("es/core/es_internal.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var PropertyEvent=require("system/PropertyEvent.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var Array=require("system/Array.es");
var ReferenceError=require("system/ReferenceError.es");
var Function=require("system/Function.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Event=require("system/Event.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_componentId":undefined,"_async":true,"_skin":null,"_skinClass":null,"properties":{},"_parent":null,"_children":[],"events":{},"_owner":null}});

	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",23);
	Component.call(this);
	if(System.isDefined(SkinComponent.L29_componentIdHash[componentId])){
	}
	SkinComponent.L29_componentIdHash[componentId]=true;
	this[__PRIVATE__]._componentId=componentId;
};
var __PRIVATE__=Symbol("es.components.SkinComponent").valueOf();
var method={"L29_componentIdHash":{"writable":true,"value":{},"type":8}
};
for(var prop in method){
	Object.defineProperty(SkinComponent, prop, method[prop]);
}
var proto={"constructor":{"value":SkinComponent},"L29__componentId":{"writable":true,"value":undefined,"type":8}
,"getComponentId":{"value":function getComponentId(prefix){
	if(prefix === undefined ){prefix="";}
	if(!System.is(prefix, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",38);
	return prefix?prefix+'-'+this[__PRIVATE__]._componentId:this[__PRIVATE__]._componentId;
},"type":1}
,"L29__async":{"writable":true,"value":true,"type":8}
,"getAsync":{"value":function async(){
	return true;
},"type":2},"setAsync":{"value":function async(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",53);
	this[__PRIVATE__]._async=flag;
},"type":4},"isNeedCreateSkin":{"value":function isNeedCreateSkin(){
	return true;
},"type":1}
,"L29__skin":{"writable":true,"value":null,"type":8}
,"getSkin":{"value":function skin(){
	var skin;
	var skinClass;
	if(this[__PRIVATE__]._skin===null){
		skinClass=this.getSkinClass();
		if(skinClass===null){
			throw new TypeError("the \""+System.getQualifiedObjectName(this)+"\" skinClass is not defined.","es.components.SkinComponent","106:95");
		}
		skin=Reflect.type(new skinClass(this),Skin);
		this[__PRIVATE__]._skin=skin;
	}
	return this[__PRIVATE__]._skin;
},"type":2},"setSkin":{"value":function skin(skinObj){
	if(!System.is(skinObj, Skin))throw new TypeError("type does not match. must be Skin","es.components.SkinComponent",119);
	var event;
	var old=this[__PRIVATE__]._skin;
	this[__PRIVATE__]._skin=skinObj;
	if(this.k30_getInitialized()&&old&&skinObj!==old){
		if(this.hasEventListener(PropertyEvent.CHANGE)){
			event=new PropertyEvent(PropertyEvent.CHANGE);
			event.oldValue=old;
			event.newValue=skinObj;
			event.property='skin';
			this.dispatchEvent(event);
		}
		this.L29_installChildren();
		this.k30_commitProperty();
		this.k30_commitPropertyAndUpdateSkin();
	}
},"type":4},"L29__skinClass":{"writable":true,"value":null,"type":8}
,"getSkinClass":{"value":function skinClass(){
	return this[__PRIVATE__]._skinClass;
},"type":2},"setSkinClass":{"value":function skinClass(value){
	if(!System.is(value, "class"))throw new TypeError("type does not match. must be Class","es.components.SkinComponent",156);
	var event;
	var skin;
	var old=this[__PRIVATE__]._skinClass;
	if(old!==value){
		this[__PRIVATE__]._skinClass=value;
		if(this.k30_getInitialized()){
			skin=Reflect.type(new value(this),Skin);
			this[__PRIVATE__]._skin=skin;
			this.L29_installChildren();
			this.k30_commitProperty();
			this.k30_commitPropertyAndUpdateSkin();
			if(this.hasEventListener(PropertyEvent.CHANGE)){
				event=new PropertyEvent(PropertyEvent.CHANGE);
				event.oldValue=old;
				event.newValue=value;
				event.property='skinClass';
				this.dispatchEvent(event);
			}
		}
	}
},"type":4},"k30_getProperties":{"value":function(){
	return this[__PRIVATE__].properties;
},"type":2},"k30_setProperties":{"value":function(val){
	return this[__PRIVATE__].properties=val;
},"type":2},"getHeight":{"value":function height(){
	if(this.k30_getInitialized()){
		return this.getSkin().getHeight();
	}
	return Reflect.type(this.k30_getProperties().height,Number);
},"type":2},"setHeight":{"value":function height(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.components.SkinComponent",202);
	if(this.k30_getInitialized()){
		this.getSkin().setHeight(value);
	}
	this.k30_getProperties().height=value;
},"type":4},"getWidth":{"value":function width(){
	if(this.k30_getInitialized()){
		return this.getSkin().getWidth();
	}
	return Reflect.type(this.k30_getProperties().width,Number);
},"type":2},"setWidth":{"value":function width(value){
	if(!(value>=0) && !System.isNaN(value))throw new TypeError("type does not match. must be uint","es.components.SkinComponent",226);
	if(this.k30_getInitialized()){
		this.getSkin().setWidth(value);
	}
	this.k30_getProperties().width=value;
},"type":4},"getElement":{"value":function element(){
	if(this.k30_getInitialized()){
		return this.getSkin().getElement();
	}
	return null;
},"type":2},"getVisible":{"value":function visible(){
	if(this.k30_getInitialized()){
		return this.getSkin().getVisible();
	}
	return !!this.k30_getProperties().visible;
},"type":2},"setVisible":{"value":function visible(flag){
	if(!System.is(flag, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",251);
	if(this.k30_getInitialized()){
		this.getSkin().setVisible(flag);
	}
	this.k30_getProperties().visible=flag;
},"type":4},"getLeft":{"value":function left(){
	if(this.k30_getInitialized()){
		return this.getSkin().getLeft();
	}
	return Reflect.type(this.k30_getProperties().left,Number);
},"type":2},"setLeft":{"value":function left(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",288);
	if(this.k30_getInitialized()){
		this.getSkin().setLeft(value);
	}
	this.k30_getProperties().left=value;
},"type":4},"getTop":{"value":function top(){
	if(this.k30_getInitialized()){
		return this.getSkin().getTop();
	}
	return Reflect.type(this.k30_getProperties().top,Number);
},"type":2},"setTop":{"value":function top(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",313);
	if(this.k30_getInitialized()){
		this.getSkin().setTop(value);
	}
	this.k30_getProperties().top=value;
},"type":4},"getRight":{"value":function right(){
	if(this.k30_getInitialized()){
		return this.getSkin().getRight();
	}
	return Reflect.type(this.k30_getProperties().right,Number);
},"type":2},"setRight":{"value":function right(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",338);
	if(this.k30_getInitialized()){
		this.getSkin().setRight(value);
	}
	this.k30_getProperties().right=value;
},"type":4},"getBottom":{"value":function bottom(){
	if(this.k30_getInitialized()){
		return this.getSkin().getBottom();
	}
	return Reflect.type(this.k30_getProperties().bottom,Number);
},"type":2},"setBottom":{"value":function bottom(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",364);
	if(this.k30_getInitialized()){
		this.getSkin().setBottom(value);
	}
	this.k30_getProperties().bottom=value;
},"type":4},"L29__parent":{"writable":true,"value":null,"type":8}
,"s3_setParentDisplay":{"value":function setParentDisplay(value){
	if(value === undefined ){value=null;}
	if(value!==null && !System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.SkinComponent",381);
	if(this.k30_getInitialized()){
		this.getSkin().s3_setParentDisplay(value);
	}
	this[__PRIVATE__]._parent=value;
},"type":1}
,"getParent":{"value":function parent(){
	if(this.k30_getInitialized()){
		return this.getSkin().getParent();
	}
	return this[__PRIVATE__]._parent;
},"type":2},"L29__children":{"writable":true,"value":[],"type":8}
,"getChildren":{"value":function children(){
	if(this.k30_getInitialized()){
		return this.getSkin().getChildren();
	}
	else {
		return this[__PRIVATE__]._children.slice(0);
	}
},"type":2},"setChildren":{"value":function children(value){
	if(!System.is(value, Array))throw new TypeError("type does not match. must be Array","es.components.SkinComponent",427);
	if(this.k30_getInitialized()){
		this.getSkin().setChildren(value);
	}
	else {
		this[__PRIVATE__]._children=value.slice(0);
	}
},"type":4},"getChildAt":{"value":function getChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",442);
	if(this.k30_getInitialized()){
		return this.getSkin().getChildAt(index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		return Reflect.type(this[__PRIVATE__]._children[index],IDisplay);
	}
},"type":1}
,"getChildIndex":{"value":function getChildIndex(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",460);
	if(this.k30_getInitialized()){
		return this.getSkin().getChildIndex(child);
	}
	else {
		return this[__PRIVATE__]._children.indexOf(child);
	}
},"type":1}
,"addChild":{"value":function addChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",474);
	if(this.k30_getInitialized()){
		return this.getSkin().addChild(child);
	}
	else {
		this[__PRIVATE__]._children.push(child);
		return child;
	}
},"type":1}
,"addChildAt":{"value":function addChildAt(child,index){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",491);
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",491);
	if(this.k30_getInitialized()){
		return this.getSkin().addChildAt(child,index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		this[__PRIVATE__]._children.splice(index,0,child);
		return child;
	}
},"type":1}
,"removeChild":{"value":function removeChild(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",511);
	var index;
	if(this.k30_getInitialized()){
		return this.getSkin().removeChild(child);
	}
	else {
		index=this[__PRIVATE__]._children.indexOf(child);
		if(index>=0){
			this.removeChildAt(index);
		}
		else {
			throw new ReferenceError("child is not exists.","es.components.SkinComponent","523:68");
		}
	}
},"type":1}
,"removeChildAt":{"value":function removeChildAt(index){
	if(!System.is(index, Number))throw new TypeError("type does not match. must be Number","es.components.SkinComponent",533);
	if(this.k30_getInitialized()){
		return this.getSkin().removeChildAt(index);
	}
	else {
		if(index<0){
			index=index+this[__PRIVATE__]._children.length;
		}
		if(this[__PRIVATE__]._children[index]){
			return Reflect.type(this[__PRIVATE__]._children.splice(index,1),IDisplay);
		}
		throw new ReferenceError("Index is out of range","es.components.SkinComponent","546:65");
	}
},"type":1}
,"removeAllChild":{"value":function removeAllChild(){
	if(this.k30_getInitialized()){
		this.getSkin().removeAllChild();
	}
	else {
		this[__PRIVATE__]._children=[];
	}
},"type":1}
,"contains":{"value":function contains(child){
	if(!System.is(child, IDisplay))throw new TypeError("type does not match. must be IDisplay","es.components.SkinComponent",570);
	if(!this.k30_getInitialized()){
		return false;
	}
	else {
		return this.getSkin().contains(child);
	}
},"type":1}
,"L29_events":{"writable":true,"value":{},"type":8}
,"addEventListener":{"value":function addEventListener(type,callback,useCapture,priority,reference){
	if(reference === undefined ){reference=null;}
	if(priority === undefined ){priority=0;}
	if(useCapture === undefined ){useCapture=false;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",590);
	if(!System.is(callback, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",590);
	if(!System.is(useCapture, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.SkinComponent",590);
	if(!System.is(priority, Number))throw new TypeError("type does not match. must be int","es.components.SkinComponent",590);
	if(reference!==null && !System.is(reference, Object))throw new TypeError("type does not match. must be Object","es.components.SkinComponent",590);
	if(this.k30_getInitialized()){
		this.getSkin().addEventListener(type,callback,useCapture,priority,reference);
	}
	else {
		Component.prototype.addEventListener.call(this,type,callback,useCapture,priority,reference);
	}
	if(!this[__PRIVATE__].events.hasOwnProperty(type)){
		this[__PRIVATE__].events[type]=[];
	}
	Reflect.call(SkinComponent,this[__PRIVATE__].events[type],"push",[{"callback":callback,"useCapture":useCapture,"priority":priority,"reference":reference}]);
	return this;
},"type":1}
,"removeEventListener":{"value":function removeEventListener(type,listener){
	if(listener === undefined ){listener=null;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",618);
	if(listener!==null && !System.is(listener, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",618);
	if(this.k30_getInitialized()){
		return this.getSkin().removeEventListener(type,listener);
	}
	else {
		Component.prototype.removeEventListener.call(this,type,listener);
	}
	if(!this[__PRIVATE__].events.hasOwnProperty(type)){
		return false;
	}
	if(!listener){
		delete this[__PRIVATE__].events[type];
		return true;
	}
	var map=Reflect.type(this[__PRIVATE__].events[type],Array);
	var len=map.length;
	for(;len>0;){
		if(Reflect.get(SkinComponent,map[--len],"callback")===listener){
			map.splice(len,1);
			return true;
		}
	}
	return false;
},"type":1}
,"dispatchEvent":{"value":function dispatchEvent(event){
	if(!System.is(event, Event))throw new TypeError("type does not match. must be Event","es.components.SkinComponent",657);
	if(this.k30_getInitialized()){
		return this.getSkin().dispatchEvent(event);
	}
	else {
		return Component.prototype.dispatchEvent.call(this,event);
	}
},"type":1}
,"hasEventListener":{"value":function hasEventListener(type,listener){
	if(listener === undefined ){listener=null;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",673);
	if(listener!==null && !System.is(listener, Function))throw new TypeError("type does not match. must be Function","es.components.SkinComponent",673);
	if(this.k30_getInitialized()){
		return this.getSkin().hasEventListener(type,listener);
	}
	else {
		return Component.prototype.hasEventListener.call(this,type,listener);
	}
},"type":1}
,"display":{"value":function display(){
	if(!this.k30_getInitialized()){
		this.k30_initializing();
		this.k30_commitPropertyAndUpdateSkin();
	}
	return this.getSkin().getElement();
},"type":1}
,"k30_initializing":{"value":function initializing(){
	Component.prototype.k30_initializing.call(this);
	this.L29_installChildren();
	this.k30_commitProperty();
},"type":1}
,"L29_installChildren":{"value":function installChildren(){
	if(this[__PRIVATE__]._children.length>0){
		this.getSkin().setChildren(this[__PRIVATE__]._children);
	}
},"type":1}
,"k30_commitProperty":{"value":function commitProperty(){
	var skin=this.getSkin();
	Object.forEach(this.k30_getProperties(),function(value,name){
		if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",730);
		if(Reflect.has(SkinComponent,skin,name)){
			Reflect.set(SkinComponent,skin,name,value);
		}
	});
	Object.forEach(this[__PRIVATE__].events,function(listener,type){
		if(!System.is(listener, Array))throw new TypeError("type does not match. must be Array","es.components.SkinComponent",736);
		if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",736);
		var item;
		var len=listener.length;
		var index=0;
		for(;index<len;index++){
			item=listener[index];
			skin.removeEventListener(type,item.callback);
			skin.addEventListener(type,item.callback,item.useCapture,item.priority,item.reference);
			Component.prototype.removeEventListener.call(this,type,item.callback);
		}
	},this);
	if(this[__PRIVATE__]._parent){
		skin.s3_setParentDisplay(this[__PRIVATE__]._parent);
	}
},"type":1}
,"k30_commitPropertyAndUpdateSkin":{"value":function commitPropertyAndUpdateSkin(){
	if(this.k30_getInitialized()){
		this.k30_nowUpdateSkin();
	}
},"type":1}
,"k30_nowUpdateSkin":{"value":function nowUpdateSkin(){
	var skin=this.getSkin();
	skin.display();
},"type":1}
,"k30_push":{"value":function push(name,value){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",794);
	this.k30_getProperties()[name]=value;
},"type":1}
,"k30_pull":{"value":function pull(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.components.SkinComponent",804);
	return this.k30_getProperties()[name];
},"type":1}
,"L29__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.SkinComponent",827);
	this[__PRIVATE__]._owner=value;
},"type":4}};
SkinComponent.prototype=Object.create( Component.prototype , proto);
Internal.defineClass("es/components/SkinComponent.es",SkinComponent,{
	"extends":Component,
	"package":"es.components",
	"classname":"SkinComponent",
	"implements":[IDisplay,IContainer],
	"uri":["L29","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/components/Component.es *****/

"es/components/Component.es": function(module,require){
var Component=function Component(){
constructor.apply(this,arguments);
};
module.exports=Component;
var ComponentEvent=require("es/events/ComponentEvent.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(){
	Object.defineProperty(this,__PRIVATE__,{value:{"initialized":false}});

	EventDispatcher.call(this);
};
var __PRIVATE__=Symbol("es.components.Component").valueOf();
var method={};
var proto={"constructor":{"value":Component},"k30_getInitialized":{"value":function(){
	return this[__PRIVATE__].initialized;
},"type":2},"k30_setInitialized":{"value":function(val){
	return this[__PRIVATE__].initialized=val;
},"type":2},"k30_initializing":{"value":function initializing(){
	if(this.k30_getInitialized()===false){
		this.k30_setInitialized(true);
		if(this.hasEventListener(ComponentEvent.INITIALIZING)){
			this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZING));
		}
	}
},"type":1}
};
Component.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/components/Component.es",Component,{
	"extends":null,
	"package":"es.components",
	"classname":"Component",
	"uri":["s32","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/events/ComponentEvent.es *****/

"es/events/ComponentEvent.es": function(module,require){
var ComponentEvent=function ComponentEvent(){
constructor.apply(this,arguments);
};
module.exports=ComponentEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"hostComponent":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.ComponentEvent",15);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ComponentEvent",15);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.ComponentEvent",15);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.ComponentEvent").valueOf();
var method={"INITIALIZING":{"value":'componentInitializing',"type":16}
,"INITIALIZED":{"value":'componentInitialized',"type":16}
};
for(var prop in method){
	Object.defineProperty(ComponentEvent, prop, method[prop]);
}
var proto={"constructor":{"value":ComponentEvent},"getHostComponent":{"value":function(){
	return this[__PRIVATE__].hostComponent;
},"type":2},"setHostComponent":{"value":function(val){
	return this[__PRIVATE__].hostComponent=val;
},"type":2}};
ComponentEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/ComponentEvent.es",ComponentEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"ComponentEvent",
	"uri":["V33","I34","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/Interaction.es *****/

"es/core/Interaction.es": function(module,require){
var Interaction=function Interaction(){
throw new TypeError("\"es.core.Interaction\" is not constructor.");
};
module.exports=Interaction;
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.core.Interaction").valueOf();
var method={"key":{"writable":true,"value":"FJH9-H3EW-8WI0-YT2D","type":8}
,"D35_properties":{"writable":true,"value":{},"type":8}
,"getProperties":{"value":function getProperties(){
	return Interaction.D35_properties;
},"type":1}
,"D35_initialized":{"writable":true,"value":false,"type":8}
,"pull":{"value":function pull(key){
	if(!System.is(key, String))throw new TypeError("type does not match. must be String","es.core.Interaction",46);
	if(Interaction.D35_initialized===false){
		Interaction.D35_initialized=true;
		if(System.isObject(Reflect.get(Interaction,window,Interaction.key))){
			Interaction.D35_properties=Reflect.type(Reflect.get(Interaction,window,Interaction.key),Object);
		}
	}
	return System.isDefined(Interaction.D35_properties[key])?Interaction.D35_properties[key]:null;
},"type":1}
,"push":{"value":function push(key,data){
	if(!System.is(key, String))throw new TypeError("type does not match. must be String","es.core.Interaction",66);
	if(!System.is(data, Object))throw new TypeError("type does not match. must be Object","es.core.Interaction",66);
	if(System.isDefined(Interaction.D35_properties[key])){
		Interaction.D35_properties[key]=Object.merge(Interaction.D35_properties[key],data);
	}
	else {
		Interaction.D35_properties[key]=data;
	}
},"type":1}
};
for(var prop in method){
	Object.defineProperty(Interaction, prop, method[prop]);
}
var proto={};
Object.defineProperty(Interaction,"prototype",{value:{}});
Internal.defineClass("es/core/Interaction.es",Interaction,{
	"package":"es.core",
	"classname":"Interaction",
	"uri":["D35","K36","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/interfaces/IListIterator.es *****/

"es/interfaces/IListIterator.es": function(module,require){
var IListIterator=function IListIterator(){
throw new TypeError("\"es.interfaces.IListIterator\" is not constructor.");
};
module.exports=IListIterator;
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var __PRIVATE__=Symbol("es.interfaces.IListIterator").valueOf();
Internal.defineClass("es/interfaces/IListIterator.es",IListIterator,{
	"package":"es.interfaces",
	"classname":"IListIterator"
},2);

},

/***** System system/Console.es *****/

"system/Console.es": function(module,require){
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,SyntaxError
 */
function Console()
{
   throw new SyntaxError('console object is not constructor or function');
}

module.exports = Console;
var Internal =require("system/Internal.es");
var System =require("system/System.es");
var SyntaxError =require("system/SyntaxError.es");
var Function =require("system/Function.es");
var call = Function.prototype.call;
var output = Internal.$console;

function toString( args )
{
    var str=[ output ];
    for(var i=0; i<args.length; i++)
    {
        if( args[i] && ( System.isObject(args[i],true) || typeof args[i] ==="function" ) )
        {
            str.push( args[i].valueOf() );
        }else
        {
            str.push( args[i] );
        }
    }
    return str;
}

Console.log=function log(){
    call.apply(output.log, toString( arguments ) );
};
Console.info =function info(){
    call.apply(output.info, toString( arguments ) );
};
Console.trace = function trace(){
    call.apply(output.trace, toString( arguments ) );
};
Console.warn = function warn(){
    call.apply(output.warn, toString( arguments ) );
};
Console.error = function error(){
    call.apply(output.error, toString( arguments ) );
};
Console.dir = function dir(){
    call.apply(output.dir, toString( arguments ) );
};
Console.assert = function assert(){
    call.apply(output.assert, toString( arguments ) );
};
Console.time = function time(){
    call.apply(output.time, toString( arguments ) );
};
Console.timeEnd = function timeEnd(){
    call.apply(output.timeEnd, toString( arguments ) );
};
if(!window.console)
{
    (function ()
    {
        var __container__ = null;
        var Element = require("./Element.js");
        var EventDispatcher = require("./EventDispatcher.js");
        var Event = require("./Event.js");
        var Array = require("./Array.js");
        function panel()
        {
            if( Element && !__container__ )
            {
                var container = Element('<div />');
                container.style('border', 'solid 1px #ccc');
                container.width('100%');
                container.height(200);
                container.style('position', 'absolute');
                container.style('background', '#ffffff');
                container.style('left', '0px');
                container.style('bottom', '0px');
                container.style('overflow', 'auto');
                // container.bottom(0);
                // container.left(0);
                __container__ = container;
                EventDispatcher(document).addEventListener( Event.READY, function (e) 
                {
                    Element(document.body).addChild(container);
                })
            }
            return __container__;
        }

        Console.log=function log()
        {
            var container = panel();
            if (container) {
               var p = Element.createElement('<p style="line-height: 12px; font-size:12px;color:#333333; font-family: Arial; padding: 5px 0px;margin: 0px;">' + Array.prototype.slice.call(arguments, 0).join(' ') + '</p>')
                container.addChild( p );
            }
        }

        Console.info=function info()
        {
            Console.log.apply(this, arguments);
        }
        Console.trace=function trace()
        {
            Console.log.apply(this, arguments);
        }
        Console.warn=function warn()
        {
            Console.log.apply(this, arguments);
        }
        Console.error=function error()
        {
            Console.log.apply(this, arguments);
        }
        Console.dir=function dir()
        {
        }
        Console.assert=function assert()
        {
        }
        Console.time=function time()
        {
        }
        Console.timeEnd=function timeEnd()
        {
        }
    }());
}

},

/***** Class es/components/Navigate.es *****/

"es/components/Navigate.es": function(module,require){
var Navigate=function Navigate(){
constructor.apply(this,arguments);
};
module.exports=Navigate;
var SkinComponent=require("es/components/SkinComponent.es");
var NavigateEvent=require("es/events/NavigateEvent.es");
var Skin=require("es/core/Skin.es");
var Display=require("es/core/Display.es");
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var ApplicationEvent=require("es/events/ApplicationEvent.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Locator=require("system/Locator.es");
var EventDispatcher=require("system/EventDispatcher.es");
var Function=require("system/Function.es");
var Object=require("system/Object.es");
var Array=require("system/Array.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_dataProfile":'datalist',"_radius":5,"_rowHeight":25,"_current":null,"_target":true,"_transition":null,"frameHash":{},"_viewport":null}});

	if(componentId === undefined ){componentId="10";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.Navigate",22);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.Navigate").valueOf();
var method={"d44_loadContentMap":{"writable":true,"value":{},"type":8}
};
for(var prop in method){
	Object.defineProperty(Navigate, prop, method[prop]);
}
var proto={"constructor":{"value":Navigate},"d44__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	var dataSource=this[__PRIVATE__]._dataSource;
	if(dataSource===null){
		dataSource=new DataSource();
		this[__PRIVATE__]._dataSource=dataSource;
	}
	return dataSource;
},"type":2},"setDataSource":{"value":function dataSource(value){
	if(!System.is(value, DataSource))throw new TypeError("type does not match. must be DataSource","es.components.Navigate",47);
	this[__PRIVATE__]._dataSource=value;
},"type":4},"getSource":{"value":function source(){
	return this.getDataSource().source();
},"type":2},"setSource":{"value":function source(data){
	this.getDataSource().source(data);
},"type":4},"d44__dataProfile":{"writable":true,"value":'datalist',"type":8}
,"getDataProfile":{"value":function dataProfile(){
	return this[__PRIVATE__]._dataProfile;
},"type":2},"setDataProfile":{"value":function dataProfile(profile){
	if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Navigate",82);
	this[__PRIVATE__]._dataProfile=profile;
},"type":4},"d44__radius":{"writable":true,"value":5,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.Navigate",101);
	this[__PRIVATE__]._radius=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"d44__rowHeight":{"writable":true,"value":25,"type":8}
,"getRowHeight":{"value":function rowHeight(){
	return this[__PRIVATE__]._rowHeight;
},"type":2},"setRowHeight":{"value":function rowHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.Navigate",125);
	this[__PRIVATE__]._rowHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"d44__current":{"writable":true,"value":null,"type":8}
,"getCurrent":{"value":function current(){
	if(this[__PRIVATE__]._current===null){
		return System.environments("HTTP_ROUTE_PATH")||0;
	}
	return this[__PRIVATE__]._current;
},"type":2},"setCurrent":{"value":function current(value){
	if(this[__PRIVATE__]._current!=value){
		this[__PRIVATE__]._current=value;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"d44__target":{"writable":true,"value":true,"type":8}
,"getTarget":{"value":function target(){
	return this[__PRIVATE__]._target;
},"type":2},"setTarget":{"value":function target(value){
	if(!System.is(value, Boolean))throw new TypeError("type does not match. must be Boolean","es.components.Navigate",184);
	this[__PRIVATE__]._target=value;
},"type":4},"d44__transition":{"writable":true,"value":null,"type":8}
,"getTransition":{"value":function transition(){
	return this[__PRIVATE__]._transition;
},"type":2},"setTransition":{"value":function transition(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.Navigate",207);
	this[__PRIVATE__]._transition=value;
},"type":4},"d44_frameHash":{"writable":true,"value":{},"type":8}
,"k30_createFrame":{"value":function createFrame(url){
	if(!System.is(url, String))throw new TypeError("type does not match. must be String","es.components.Navigate",222);
	var elem;
	if(System.typeOf(this[__PRIVATE__].frameHash[url])==="undefined"){
		elem=new Element("<iframe />");
		elem.property("src",url);
		elem.style("width","100%");
		this[__PRIVATE__].frameHash[url]=elem;
	}
	return this[__PRIVATE__].frameHash[url];
},"type":1}
,"k30_loadContent":{"value":function loadContent(content){
	var controller;
	var HTTP_DISPATCHER;
	var fn;
	var doc;
	var provider;
	var segment;
	var isUrl;
	var event=new NavigateEvent(NavigateEvent.LOAD_CONTENT_BEFORE);
	event.setViewport(this.getViewport());
	event.setContent(content);
	if(!this.dispatchEvent(event)||!(event.getViewport()&&event.getContent()))return false;
	var viewport=event.getViewport();
	var child=null;
	content=event.getContent();
	if(System.instanceOf(content, "class")){
		child=Reflect.type(new Reflect.type(content,"class")(this),IDisplay);
	}
	else if(System.isFunction(content)){
		child=Reflect.type(content(),IDisplay);
	}
	else if(System.isString(content)){
		content=System.trim(content);
		isUrl=/^https?/i.test(content);
		segment=Locator.create(content);
		provider=Locator.match(segment);
		if(isUrl&&!provider){
			return false;
		}
		if(provider){
			if(!Navigate.d44_loadContentMap[provider]){
				doc=new EventDispatcher(document);
				fn=function(e){
					if(!System.is(e, ApplicationEvent))throw new TypeError("type does not match. must be ApplicationEvent","es.components.Navigate",273);
					e.preventDefault();
					e.setContainer(viewport);
					doc.removeEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER,fn);
				};
				doc.addEventListener(ApplicationEvent.FETCH_ROOT_CONTAINER,fn);
				Navigate.d44_loadContentMap[provider]=child;
				HTTP_DISPATCHER=Reflect.type(System.environments("HTTP_DISPATCHER"),Function);
				controller=provider.split("@");
				HTTP_DISPATCHER(controller[0],controller[1]);
				return true;
			}
			else {
				child=Reflect.type(Navigate.d44_loadContentMap[provider],IDisplay);
			}
		}
		else {
			child=new Display(new Element(Element.createElement(content)));
		}
	}
	viewport.setChildren([child]);
	return true;
},"type":1}
,"k30_initializing":{"value":function initializing(){
	SkinComponent.prototype.k30_initializing.call(this);
	var hostComponent=this;
	var dataProfile=this.getDataProfile();
	var container=this.getSkin();
	container.assign(dataProfile,[]);
	container.assign("openTarget",this.getTarget());
	container.assign("match",function(item,key){
		if(!System.is(item, Object))throw new TypeError("type does not match. must be Object","es.components.Navigate",312);
		var str;
		var matched=false;
		var current=hostComponent.getCurrent();
		if(System.typeOf(current)==="function"){
			matched=!!current(item,key);
		}
		else if(current==key||current===item.link||item["label"]===current){
			matched=true;
		}
		else if(current){
			str=Reflect.type(current,String);
			matched=(new RegExp(str.replace(/([\/\?\:\.])/g,'\\$1'))).test(Reflect.type(item.link,String));
		}
		;
		if(matched&&System.isDefined(item.content)){
			hostComponent.k30_loadContent(item.content);
		}
		return matched;
	});
	this.getDataSource().addEventListener(DataSourceEvent.SELECT,function(event){
		if(!System.is(event, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.components.Navigate",329);
		if(!event.waiting){
			container.assign(dataProfile,event.data);
		}
	});
	this.getDataSource().select(1);
},"type":1}
,"d44__viewport":{"writable":true,"value":null,"type":8}
,"getViewport":{"value":function viewport(){
	return this[__PRIVATE__]._viewport;
},"type":2},"setViewport":{"value":function viewport(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.components.Navigate",348);
	if(this[__PRIVATE__]._viewport===null){
		this.addEventListener(NavigateEvent.URL_JUMP_BEFORE,function(e){
			if(!System.is(e, NavigateEvent))throw new TypeError("type does not match. must be NavigateEvent","es.components.Navigate",352);
			var provider;
			var segment;
			var isUrl;
			var content=e.getContent()||(e.getItem()&&e.getItem().link);
			if(System.typeOf(content)==="string"){
				isUrl=/^https?/i.test(Reflect.type(content,String));
				segment=Locator.create(Reflect.type(content,String));
				provider=Locator.match(segment);
				if(isUrl&&!provider){
					return ;
				}
			}
			if(e.getItem()&&e.getItem().content){
				e.preventDefault();
				Reflect.set(Navigate,this,"current",content);
			}
		},false,0,this);
	}
	this[__PRIVATE__]._viewport=value;
},"type":4}};
Navigate.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/Navigate.es",Navigate,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"Navigate",
	"uri":["d44","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** System system/DataArray.es *****/

"system/DataArray.es": function(module,require){
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array,ReferenceError
 */
function DataArray()
{
    if( !System.instanceOf(this,DataArray) )
    {
        return Array.apply( Object.create( DataArray.prototype ), Array.prototype.slice.call(arguments,0) );
    }
    if( arguments.length === 1 && System.instanceOf(arguments[0],Array) )
    {
        Array.apply(this, arguments[0]);
    }else{
        Array.apply(this, Array.prototype.slice.call(arguments,0) );
    }
    return this;
}

module.exports = DataArray;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Array =require("system/Array.es");
var ReferenceError =require("system/ReferenceError.es");

DataArray.DESC='desc';
DataArray.ASC='asc';
DataArray.prototype= Object.create( Array.prototype,{
    "constructor":{value:DataArray},
    /**
     * 返回此对象的字符串
     * @returns {*}
     */
    "toString":{value:function toString()
    {
        if( this.constructor === DataArray )
        {
            return "[object DataArray]";
        }
        return Array.prototype.toString.call(this);
    }},

    /**
     * 根据指定的列进行排序
     * @param column
     * @param type
     * @returns {DataArray}
     */
    "orderBy":{value:function orderBy(column,type)
    {
        if( this.length < 2 )return this;
        if( (column === DataArray.DESC || column === DataArray.ASC || column==null) && type==null )
        {
            if( typeof this[0] === "object" )
            {
                throw new ReferenceError('Missing column name.');
            }
            this.sort(function (a,b) {
                return column === DataArray.DESC ? System.compare(b,a) : System.compare(a,b);
            });
            return this;
        }

        var field=column,orderby=['var a=arguments[0],b=arguments[1],s=0,cp=arguments[2];'];
        if( typeof column !== "object" )
        {
            field={};
            field[ column ] = type;
        }
        for(var c in field )
        {
            type = DataArray.DESC === field[c].toLowerCase() ?  DataArray.DESC :  DataArray.ASC;
            orderby.push( type===DataArray.DESC ? "cp(b['"+c+"'],a['"+c+"']):s;" : "cp(a['"+c+"'],b['"+c+"']):s;");
        }
        orderby = orderby.join("s=s==0?");
        orderby+="return s;";
        var fn = new Function( orderby );
        this.sort(function (a,b) {
            return fn(a,b,System.compare);
        });
        return this;
    }},

    /**
     * 统计数组中所有值的和
     * @param function callback 回调函数，返回每个项的值。
     * @returns {number}
     * @public
     */
    "sum":{value:function sum( callback )
    {
        var result = 0;
        var type = typeof callback;
        var index=0,len=this.length >> 0;
        if( len===0 )return 0;
        if( type !== "function" ){
            if( type === "string" ){
                var field = callback;
                if( typeof this[0][ field ] === "undefined" )
                {
                    throw new ReferenceError('assign field does not define. for "'+type+'"');
                }
                callback = function( value ){return value[field]>>0;}
            }else
            {
                if( typeof this[0] === "object" )
                {
                    throw new ReferenceError('Missing field name.');
                }
                callback = function( value ){return System.isNaN(value) ? 0 : value>>0;}
            }
        }
        for(;index<len;index++)
        {
            result+=callback.call(this,this[index])>>0;
        }
        return result;
    }}
});



},

/***** System system/HttpEvent.es *****/

"system/HttpEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Event,Object
 */
function HttpEvent( type, bubbles,cancelable ){
    if( !(this instanceof HttpEvent) )return new HttpEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
};

module.exports = HttpEvent;
var Object =require("system/Object.es");
var Event =require("system/Event.es");

HttpEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:HttpEvent},
    "toString":{value:function toString(){
        return '[object HttpEvent]';
    }},
    "valueOf":{value:function valueOf(){
        return '[object HttpEvent]';
    }}
});
HttpEvent.prototype.data=null;
HttpEvent.prototype.url=null;
HttpEvent.prototype.loaded = 0;
HttpEvent.prototype.total = 0;
HttpEvent.LOAD_START = 'httpLoadStart';
HttpEvent.SUCCESS = 'httpSuccess';
HttpEvent.PROGRESS = 'httpProgress';
HttpEvent.ERROR   = 'httpError';
HttpEvent.CANCELED  = 'httpCanceled';
HttpEvent.TIMEOUT = 'httpTimeout';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof HttpEvent )return originalEvent;
});
},

/***** System system/Http.es *****/

"system/Http.es": function(module,require){
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
var Object =require("system/Object.es");
var EventDispatcher =require("system/EventDispatcher.es");
var System =require("system/System.es");
var JSON =require("system/JSON.es");
var HttpEvent =require("system/HttpEvent.es");
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
},

/***** System system/DataSourceEvent.es *****/

"system/DataSourceEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */

function DataSourceEvent(type, bubbles,cancelable)
{
    if( !System.instanceOf(this,DataSourceEvent) )return new DataSourceEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
    return this;
}

module.exports = DataSourceEvent;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Event =require("system/Event.es");


DataSourceEvent.prototype= Object.create(Event.prototype,{
    "constructor":{value:DataSourceEvent}
});
DataSourceEvent.prototype.condition=null;
DataSourceEvent.prototype.index=NaN;
DataSourceEvent.prototype.data=null;
DataSourceEvent.prototype.oldValue=null;
DataSourceEvent.prototype.newValue=null;
DataSourceEvent.prototype.current = NaN;
DataSourceEvent.prototype.offset = NaN;
DataSourceEvent.prototype.waiting=false;
DataSourceEvent.prototype.totalSize=NaN;
DataSourceEvent.prototype.pageSize=NaN;
DataSourceEvent.prototype.totalSize=NaN;

DataSourceEvent.APPEND='dataSourceAppend';
DataSourceEvent.REMOVE='dataSourceRemove';
DataSourceEvent.UPDATE='dataSourceUpdate';
DataSourceEvent.SELECT ='dataSourceSelect';
DataSourceEvent.CHANGED='dataSourceChanged';

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof DataSourceEvent )return originalEvent;
    switch ( type ){
        case DataSourceEvent.APPEND :
        case DataSourceEvent.REMOVE :
        case DataSourceEvent.UPDATE :
        case DataSourceEvent.SELECT :
        case DataSourceEvent.CHANGED :
            return new DataSourceEvent( type );
    }
});
},

/***** System system/DataGrep.es *****/

"system/DataGrep.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Object,Array,Function,Error,Symbol
 */

/**
 * 筛选条件组合
 * @param column
 * @param value
 * @param operational
 * @param logic
 * @returns {DataGrep}
 */
function strainer( column , value, operational, logic ,type )
{
    logic = logic==='or' ? '||' : '&&';
    this[ this.length ]= {'logic':logic,'column':column,'value':value,'operational':operational,'type':type};
    this.length++;
    return this;
};

/**
 * 根据据指定的条件生成筛选器
 * @returns {Function|*}
 */
function createFilter()
{
    var i=0, item,type,value,refvalue,command=[];
    for( ; i < this.length ; i++ )
    {
        item =  this[i];
        command.length===0 || command.push(item.logic);
        type = typeof item.value;
        value = 'this[' + i + '].value';

        if( item.value instanceof DataGrep )
        {
            command.push( '!!this[' + i + '].value.filter().call(this[' + i + '].value,arguments[0])' );

        }else if( type === "function" )
        {
            command.push( 'this[' + i + '].value.call(this,arguments[0])' );

        }else if( item.operational=='index' || item.operational=='notindex')
        {
            var index= "arguments[1]";
            var flag = item.operational === 'notindex' ? '!' : '';
            value = value.split(',');
            command.push( flag+"("+value[0]+" >= "+index+" && "+value[1]+" <= "+index+")" );

        }else
        {
            refvalue= "arguments[0][\"" + item.column + "\"]";
            if( item.operational==='like' || item.operational==='notlike' )
            {
                var flag = item.operational === 'notlike' ? '!' : '';
                if( item.type === 'right' )
                {
                    command.push(flag+"new RegExp('^'+"+value+" ).test("+refvalue+")");
                }else if( item.type === 'left' )
                {
                    command.push(flag+"new RegExp("+value+"+'$' ).test("+refvalue+")");
                }else
                {
                    command.push(flag+"new RegExp( "+value+" ).test("+refvalue+")");
                }

            }else if( item.operational=='range' || item.operational=='notrange')
            {
                var flag = item.operational === 'notrange' ? '!' : '';
                value = value.split(',');
                command.push( flag+"("+value[0]+" >= "+refvalue+" && "+value[1]+" <= "+refvalue+")" );

            }else
            {
                command.push( refvalue + item.operational + value);
            }
        }
    }
    if( command.length === 0 )
    {
        return null;
    }
    return new Function('return ( '+command.join(' ')+' )' );
};


/**
 * @returns {DataGrep}
 * @constructor
 */
function DataGrep( dataItems )
{
    if( !(System.instanceOf(this,DataGrep)) )return new DataGrep( dataItems );
    if( !System.instanceOf( dataItems, Array ) )throw new Error('error','Invalid data list');
    storage(this,true,{
        'dataItems':dataItems,
        'filter':dataItems
    });
    Object.defineProperty(this,"length", {value:0,writable:true});
}

module.exports = DataGrep;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var Array =require("system/Array.es");
var Function =require("system/Function.es");
var Symbol =require("system/Symbol.es");
var Error =require("system/Error.es");
var storage=Internal.createSymbolStorage( Symbol('DataGrep') );

DataGrep.prototype = Object.create( Object.prototype,{
    "constructor":{value:DataGrep},
    
/**
 * 获取设置过滤器
 * @param condition
 * @returns {*}
 */
"filter":{value:function filter( condition )
{
    if( typeof condition === "undefined" )
    {
        storage(this,"filter", createFilter.call(this) );

    }else if( typeof condition === 'function' )
    {
        storage(this,"filter",condition);

    }else if ( typeof condition === 'string' && condition!='' )
    {
        var old = condition;
        condition = condition.replace(/(\w+)\s*([\>\<\=\!])/g,function(a, b, c)
        {
            c = c.length==1 && c=='=' ? '==' : c;
            return "arguments[0]['"+b+"']" + c;

        }).replace(/(not[\s]*)?(index)\(([\d\,\s]+)\)/ig,function(a,b,c,d)
        {
            var value = d.split(',');
            var start =value[0]>>0;
            var end = Math.max(value[1]>>0,1);
            var flag = typeof b=== "undefined" ? '' : '!';
            return flag+"( arguments[1] >= "+start+" && arguments[1] < "+end+") ";

        }).replace(/(\w+)\s+(not[\s]*)?(like|range|in)\(([^\)]*?)\)/ig,function(a,b,c,d,e)
        {
            var flag = typeof c=== "undefined" ? '' : '!';
            var refvalue = "arguments[0]['"+b+"']";
            if( /like/i.test(d) )
            {
                e= e.replace(/(%)?([^%]*?)(%)?/,function(a,b,c,d){
                    return typeof b==='undefined' ? '^'+c : typeof d==='undefined' ? c+'$' : c;
                });
                e = flag+"new RegExp('"+e+"').test("+refvalue+")";

            }else if( /in/i.test(d) )
            {
                e = flag+"( ["+e+"].indexOf("+refvalue+") >=0 )";

            }else
            {
                var value = e.split(',');
                e = flag+"("+refvalue+" >= "+value[0]+" && "+refvalue+" < "+value[1]+")";
            }
            return e;

        }).replace(/\s+(or|and)\s+/gi,function(a,b)
        {
            return b.toLowerCase()=='or' ? ' || ' : ' && ';
        });
        storage(this,"filter",new Function('try{ return !!('+condition+') }catch(e){ throw new SyntaxError("is not grep:'+old+'");}') );

    }else if( condition === null )
    {
        storage(this,"filter",null);
    }
    return storage(this,"filter");
}},

/**
 * @returns {DataGrep}
 */
"clean":{value:function clean()
{
    for(var i=0; i<this.length; i++)
    {
        delete this[i];
    }
    storage(this,"filter",null);
    this.length=0;
    return this;
}},

/**
 * 查询数据
 * @param data
 * @param filter
 * @returns {*}
 */
"execute":{value:function execute(filter)
{
    var data=storage(this,"dataItems");
    filter = this.filter( filter );
    if( !filter )return data;
    var result=[];
    for(var i=0; i<data.length; i++ ) if( !!filter.call(this, data[i], i) )
    {
        result.push( data[i] );
    }
    return result;
}},

/**
 * 指定范围
 * @param column
 * @param start
 * @param end
 * @param logic
 * @returns {*}
 */
"range":{value:function range(column, start, end, logic)
{
    if(  start >= 0 || end > 0 )
    {
        strainer.call(this,column,start+','+end,'range',logic);
    }
    return this;
}},


/**
 * 指定数据索引范围
 * @param column
 * @param start
 * @param end
 * @param logic
 * @returns {DataGrep}
 */
"index":{value:function index(start, end, logic)
{
    if( start >= 0 || end > 0 )
    {
        end =  parseInt(end) || 1 ;
        start =  parseInt(start) || 0;
        strainer.call(this,'index',start+','+start+end,'index',logic);
    }
    return this;
}},

/**
 * 筛选等于指定列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"eq":{value:function eq(column, value, logic)
{
    strainer.call(this,column,value,'==',logic);
    return this;
}},

/**
 * 筛选不等于指定列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"not":{value:function not(column, value, logic)
{
    strainer.call(this,column,value,'!=',logic);
    return this;
}},

/**
 * 筛选大于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"gt":{value:function gt(column, value, logic)
{
    strainer.call(this,column,value,'>',logic);
    return this;
}},

/**
 * 筛选小于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"lt":{value:function lt(column, value, logic)
{
    strainer.call(this,column,value,'<',logic);
    return this;
}},

/**
 * 筛选大于等于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"egt":{value:function egt(column, value, logic)
{
    strainer.call(this,column,value,'>=',logic);
    return this;
}},

/**
 * 筛选小于等于列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"elt":{value:function elt(column, value, logic)
{
    strainer.call(this,column,value,'<=',logic);
    return this;
}},

/**
 * 筛选模糊匹配列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"like":{value:function like(column, value, type, logic)
{
    strainer.call(this,column,value,'like',logic,type);
    return this;
}},

/**
 * 筛选排除模糊匹配列的值
 * @param column
 * @param value
 * @param logic
 * @returns {DataGrep}
 */
"notLike":{value:function notLike(column, value, type, logic)
{
    strainer.call(this,column,value,'notlike',logic,type);
    return this;
}}

});

DataGrep.LIKE_LEFT='left';
DataGrep.LIKE_RIGHT='right';
DataGrep.LIKE_BOTH='both';

},

/***** System system/DataSource.es *****/

"system/DataSource.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Symbol,Array,DataArray,Object,EventDispatcher,Http,HttpEvent,PropertyEvent,DataSourceEvent,DataGrep
 */

function DataSource()
{
    if( !System.instanceOf(this,DataSource) )return new DataSource();
    EventDispatcher.call(this);
    storage(this,true,{
        "options":{
            'method': Http.METHOD_GET,
            'dataType':Http.TYPE_JSON,
            'timeout':30,
            'param':{},
            'url':null,
            //服务器响应后的json对象
            'responseProfile':{
                'data':'data',     //数据集
                'total':'total',   //数据总数
                'code': 'code',    //状态码
                'error': 'error',  //错误消息
                "successCode" : 0  //成功时的状态码
            },
            //向服务器请求时需要添加的参数
            'requestProfile':{
                'offset':'offset', //数据偏移量
                'rows'  :'rows' //每次获取取多少行数据
            }
        }
        ,"items":new Array()
        ,"cached":{
            'queues':new Array()
            ,'lastSegments':null
            ,"loadSegments":new Array()
        }
        ,"isRemote":false
        ,"source":null
        ,"nowNotify":false
        ,"loading":false
        ,"loadCompleted":false
        ,"pageSize":20
        ,"current":1
        ,"buffer":3
        ,"totalSize":NaN
        ,"grep":null
    });
}

module.exports = DataSource;
var System =require("system/System.es");
var Object =require("system/Object.es");
var Internal =require("system/Internal.es");
var Array =require("system/Array.es");
var Symbol =require("system/Symbol.es");
var Error =require("system/Error.es");
var DataArray =require("system/DataArray.es");
var EventDispatcher =require("system/EventDispatcher.es");
var Http =require("system/Http.es");
var HttpEvent =require("system/HttpEvent.es");
var PropertyEvent =require("system/PropertyEvent.es");
var DataSourceEvent =require("system/DataSourceEvent.es");
var DataGrep =require("system/DataGrep.es");
var storage=Internal.createSymbolStorage( Symbol('DataSource') );

/**
 * @private
 * @param name
 * @param value
 * @returns {*}
 */
function access( name, value)
{
    var options = storage(this,"options");
    if( value == null ){
        return options[ name ];
    }
    options[name] = value;
    if( this.isRemote() )
    {
        var source = storage(this,"source");
        if ( source instanceof Http )
        {
            source.option( name, value )
        }
    }
    return this;
}



/**
 * @private
 * 数据加载成功时的回调
 * @param event
 */
function success(event)
{
    var options = storage(this,'options');
    var data = null;
    var total = 0;
    var status=0;
    var successCode = 200;
    if( typeof options.responseProfile === "function" )
    {
        var profile = Array.prototype.map.call(["data","total","status","successCode"],function (name) {
            return options.responseProfile(event.data,name);
        });
        data = profile[0];
        total = profile[1];
        status = profile[2];
        successCode = profile[3];
        if ( status != successCode )
        {
            throw new Error('Loading data failed. current status:' + status);
        }

    }else
    {
        var totalProfile = options.responseProfile.total;
        var dataProfile = options.responseProfile.data;
        var stateProfile = options.responseProfile.code;
        if (event.data[stateProfile] != options.responseProfile.successCode) {
            throw new Error('Loading data failed. current status:' + event.data[options.responseProfile.error]);
        }
        if (!System.isArray(event.data))
        {
            if ((dataProfile && typeof event.data[dataProfile] === 'undefined') || (totalProfile && event.data[totalProfile] === 'undefined')) {
                throw new Error('Response data profile fields is not correct.');
            }
            total = totalProfile ? event.data[totalProfile] >> 0 : 0;
            data = event.data[dataProfile];
            if (total === 0 && data) total = data.length >> 0;
        } else {
            data = event.data[dataProfile];
            total = data.length >> 0;
        }
    }

    //必须是返回一个数组
    if( !System.isArray(data) )throw new Error('Response data set must be an array');

    //当前获取到数据的长度
    var len = data.length >> 0;
    total = Math.max( total, len );

    //先标记为没有数据可加载了
    storage(this,'loadCompleted', true);

    //标没有在加载
    storage(this,'loading', false);

    //预计总数据量
    storage(this,'totalSize', total);
    var rows = this.pageSize();
    var cached = storage(this,'cached');
    var items =  storage(this,'items');
    var current = this.current();

    //当前加载分页数的偏移量
    var offset = Array.prototype.indexOf.call(cached.loadSegments, cached.lastSegments) * rows;

    //合并数据项
    Array.prototype.splice.apply( items , [offset, 0].concat( data ) );

    //发送数据
    if( storage(this,'nowNotify')  &&  Array.prototype.indexOf.call( cached.loadSegments,current) >=0 )
    {
        nowNotify.call(this,current, offset, rows);
    }
    //还有数据需要加载
    if( items.length < total )
    {
        storage(this,'loadCompleted', false);

        //继续载数据
        doload.call(this);
    }

}

function isload( cached, page )
{
    return cached.lastSegments != page && cached.loadSegments.indexOf(page) < 0 && cached.queues.indexOf(page) < 0;
}

/**
 * 向远程服务器开始加载数据
 */
function doload()
{
    var loading = storage(this,'loading');
    var isRemote = storage(this,'isRemote');
    var loadCompleted = storage(this,'loadCompleted');
    if( !isRemote || loadCompleted )return;
    var page = this.current();
    var cached= storage(this,'cached');
    var queue = cached.queues;
    var rows = this.pageSize();
    var buffer = this.maxBuffer();
    if( isload( cached, page ) )
    {
        queue.unshift( page );

    }else if( queue.length === 0 )
    {
        var p = 1;
        var t = this.totalPage();
        while( buffer > p )
        {
            var next = page+p;
            var prev = page-p;
            if( next <= t && isload( cached, next ) )
            {
                queue.push( next );
            }
            if(  prev > 0 && isload( cached, prev ) )
            {
                queue.push( prev );
            }
            p++;
        }
    }

    if( !loading && queue.length > 0 )
    {
        storage(this,'loading', true);
        page = queue.shift();
        cached.lastSegments = page;
        cached.loadSegments.push(page);
        if (cached.loadSegments.length > 1)cached.loadSegments.sort(function (a, b) {
            return a - b;
        });
        var start = ( page - 1 ) * rows;
        var source = storage(this,'source');
        var options = storage(this,'options');
        var param = Object.merge({}, options.param);
        param[options.requestProfile.offset] = start;
        param[options.requestProfile.rows] = rows;
        source.load(options.url, param, options.method);
    }
}
/**
 * 发送数据通知
 * @private
 */
function nowNotify(current, start, rows )
{
    if( storage(this,'nowNotify') !==true )return;
    var result = this.grep().execute();
    var end = Math.min(start + rows, this.realSize() );
    var data  = result.slice(start, end);
    var event = new DataSourceEvent(DataSourceEvent.SELECT);
    event.current = current;
    event.offset = start;
    event.data = data;
    event.waiting = false;
    event.pageSize = this.pageSize();
    event.totalPage = this.totalPage();
    event.totalSize = this.totalSize();
    storage(this,'nowNotify', false);
    this.dispatchEvent(event);
}

DataSource.prototype = Object.create( EventDispatcher.prototype,{
    "constructor":{value:DataSource},
        
    /**
     * 是否为一个远程数据源
     * @returns {boolean}
     */
    "isRemote":{value:function isRemote()
    {
        return storage(this,"isRemote");
    }},

    /**
     * 获取或者设置数据选项
     * @param object options
     * @returns {*}
     */
    "options":{value:function options( opt )
    {
        if( System.isObject(opt) )
        {
            Object.merge( storage(this,"options") , opt);
        }
        return this;
    }},

    /**
     * 设置数据的响应类型
     * @param value
     * @returns {*}
     */
    "dataType":{value:function dataType( value )
    {
        return access.call(this,'dataType', value);
    }},

    /**
     * 设置数据的请求方法
     * @param value
     * @returns {*}
     */
    "method":{value:function method( value )
    {
        return access.call(this,'method', value);
    }},

    /**
     * 设置请求超时
     * @param value
     * @returns {*}
     */
    "timeout":{value:function timeout( value )
    {
        return access.call(this,'timeout', value);
    }},

    /**
     * 设置请求的参数对象
     * @param value
     * @returns {*}
     */
    "parameter":{value:function parameter( value )
    {
        return access.call(this,'param', value);
    }},

    /**
     * 设置获取数据源
     * 允许是一个数据数组或者是一个远程请求源
     * @param Array source | String url | Http httpObject
     * @returns {DataSource}
     */
    "source":{value:function source( resource )
    {
        var old_source = storage(this,"source");
        if( old_source === resource )return this;

        var options = storage(this,"options");
        if( typeof resource === "undefined" )
        {
            return storage(this,"isRemote") ? options.url : old_source;
        }

        //本地数据源数组
        if( System.instanceOf(resource, Array) )
        {
            storage(this,"items", resource.slice(0) );
            storage(this,"source", resource );
            storage(this,"isRemote", false );
            if( storage(this,'selected')===true )
            {
                storage(this, "grep", null);
                this.select();
            }
        }
        //远程数据源
        else if( resource )
        {
            if( typeof resource === 'string' )
            {
                options.url = resource;
                resource = new Http( options );
            }
            if ( resource instanceof Http )
            {
                storage(this,"source", resource );
                storage(this,"isRemote", true );
                //请求远程数据源侦听器
                resource.addEventListener( HttpEvent.SUCCESS, success , false,0, this);
            }
        }

        //清空数据源
        if( resource === null )
        {
            var items = storage(this,"items");
            var cached = storage(this,"cached");
            items.splice(0, items.length);
            cached.lastSegments=null;
            cached.loadSegments=new Array();
            cached.queues      =new Array();
            storage(this,"nowNotify",false);
            storage(this,"loadCompleted",false);
            return this;
        }

        var source = storage(this,"source");

        //移除加载远程数据侦听事件
        if ( !storage(this,"isRemote") && System.is(source ,Http) )
        {
            source.removeEventListener(HttpEvent.SUCCESS,success);
        }
        return this;
    }},

    /**
     * 每页需要显示数据的行数
     * @param number rows
     * @returns {DataSource}
     */
    "pageSize":{value:function pageSize( size )
    {
        var old = storage(this,"pageSize");
        if( size >= 0 && old !== size )
        {
            storage(this,"pageSize", size);
            var event = new PropertyEvent( PropertyEvent.CHANGE );
            event.property = 'pageSize';
            event.newValue = size;
            event.oldValue = old;
            this.dispatchEvent( event );
            if( storage(this,"selected")  )
            {
                var items = storage(this,"items");
                var cached = storage(this,"cached");
                items.splice(0, items.length);
                cached.lastSegments=null;
                cached.loadSegments=new Array();
                cached.queues      =new Array();
                storage(this,"nowNotify",false);
                storage(this,"loadCompleted",false);
                this.select();
            }
            return this;
        }
        return old;
    }},

    /**
     * 获取当前分页数
     * @param num
     * @returns {*}
     */
    "current":{value:function current()
    {
        return storage(this,"current");
    }},

    /**
     * 获取总分页数。
     * 如果是一个远程数据源需要等到请求响应后才能得到正确的结果,否则返回 NaN
     * @return number
     */
    "totalPage":{value:function totalPage()
    {
        return this.totalSize() > 0 ? Math.max( Math.ceil( this.totalSize() / this.pageSize() ) , 1) : NaN;
    }},

    /**
     * 最大缓冲几个分页数据。有效值为1-10
     * @param Number num
     * @returns {DataSource}
     */
    "maxBuffer":{value:function maxBuffer(num )
    {
        if( num > 0 )
        {
            storage(this,"buffer", Math.min(10, num) );
            return this;
        }
        return  storage(this,"buffer");
    }},

    /**
     * 获取实际数据源的总数
     * 如果是一个远程数据源，每请求成功后都会更新这个值。
     * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 总数 )do load...
     * @param number num
     * @returns {DataSource}
     */
    "realSize":{value:function realSize()
    {
        return storage(this,"items").length;
    }},

    /**
     * @private
     */
    "__totalSize__":{value:0},

    /**
     * 预计数据源的总数
     * 如果是一个远程数据源，每请求成功后都会更新这个值。
     * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 预计总数 )do load...
     * @param number num
     * @returns {DataSource}
     */
    "totalSize":{value:function totalSize()
    {
        return Math.max( storage(this,"totalSize"), this.realSize() );
    }},

    /**
     * 获取数据检索对象
     * @returns {*|DataGrep}
     */
    "grep":{value:function grep()
    {
        return storage(this,"grep") || storage(this,"grep", new DataGrep( storage(this,"items") ) );
    }},

    /**
     * 设置筛选数据的条件
     * @param condition
     * @returns {DataSource}
     */
    "filter":{value:function filter( condition )
    {
        this.grep().filter( condition );
        return this;
    }},

    /**
     * 对数据进行排序。
     * 只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
     * @param column 数据字段
     * @param type   排序类型
     */
    "orderBy":{value:function orderBy(column,type)
    {
        var orderObject = storage(this,"order") || storage(this,"order",{});
        var t = typeof column;
        if( t === "undefined" )
        {
            return orderObject;
        }
        if( t === "object" )
        {
            orderObject = storage(this,"order",column);

        }else if( t === "string" )
        {
            orderObject[ column ] = type || DataArray.ASC;
        }
        DataArray.prototype.orderBy.call( storage(this,"items"), orderObject );
        return this;
    }},

    /**
     * 当前页的索引值在当前数据源的位置
     * @param index 位于当前页的索引值
     * @returns {number}
     */
    "offsetAt":{value:function offsetAt( index )
    {
        var index = index>>0;
        if( isNaN(index) )return index;
        return ( this.current()-1 ) * this.pageSize() + index;
    }},

    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {DataSource}
     */
    "append":{value:function append(item,index)
    {
        index = typeof index === 'number' ? index : this.realSize();
        index = index < 0 ? index + this.realSize()+1 : index;
        index = Math.min( this.realSize(), Math.max( index, 0 ) );
        item = System.instanceOf(item, Array) ? item : [item];
        var ret = [];
        var e;
        for(var i=0;i<item.length;i++)
        {
            e = new DataSourceEvent( DataSourceEvent.CHANGED );
            e.index = index+i;
            e.newValue=item[i];
            if( this.dispatchEvent( e ) )
            {
                Array.prototype.splice.call(this.__items__, e.index, 0, item[i]);
                ret.push( item[i] );
            }
        }
        e = new DataSourceEvent( DataSourceEvent.APPEND );
        e.index = index;
        e.data  = ret;
        this.dispatchEvent( e );
        return ret.length;
    }},

    /**
     * 移除指定索引下的数据项
     * @param condition
     * @returns {boolean}
     */
    "remove":{value:function remove( condition )
    {
        var index;
        var result = this.grep().execute( condition );
        var e;
        var data=[];
        for (var i = 0; i < result.length; i++)
        {
            index = Array.prototype.indexOf.call(result,result[i]);
            if (index >= 0)
            {
                e = new DataSourceEvent( DataSourceEvent.CHANGED );
                e.index = index;
                e.oldValue=result[i];
                if( this.dispatchEvent( e ) )
                {
                    data.push( Array.prototype.splice.call(this.__items__, e.index, 1) );
                }
            }
        }
        if( data.length > 0 )
        {
            e = new DataSourceEvent(DataSourceEvent.REMOVE);
            e.condition = condition;
            e.data = data;
            this.dispatchEvent(e);
        }
        return data.length;
    }},

    /**
     * 修改数据
     * @param value 数据列对象 {'column':'newValue'}
     * @param condition
     * @returns {boolean}
     */
    "update":{value:function update( value, condition)
    {
        var result = this.grep().execute( condition );
        var data=[];
        var flag=false;
        var e;
        for (var i = 0; i < result.length; i++)
        {
            flag=false;
            var newValue = Object.merge({}, result[i] );
            for(var c in value)
            {
                if ( typeof newValue[c] !== "undefined" && newValue[c] != value[c] )
                {
                    newValue[c] = value[c];
                    flag=true;
                }
            }
            if( flag )
            {
                e = new DataSourceEvent(DataSourceEvent.CHANGED);
                e.newValue = newValue;
                e.oldValue = result[i];
                if( this.dispatchEvent(e) )
                {
                    Object.merge(result[i], newValue);
                    data.push( result[i] );
                }
            }
        }
        e = new DataSourceEvent( DataSourceEvent.UPDATE );
        e.data=data;
        e.condition = condition;
        e.newValue=value;
        this.dispatchEvent( e );
        return data.length;
    }},

    /**
     * 获取指定索引的元素
     * @param index
     * @returns {*}
     */
    "itemByIndex":{value:function itemByIndex( index )
    {
        if( typeof index !== 'number' || index < 0 || index >= this.realSize() )return null;
        return storage(this,'items')[index] || null;
    }},

    /**
     * 获取指定元素的索引
     * 如果不存在则返回 -1
     * @param item
     * @returns {Object}
     */
    "indexByItem":{value:function indexByItem( item )
    {
        return storage(this,'items').indexOf(item);
    }},

    /**
     * 获取指定索引范围的元素
     * @param start 开始索引
     * @param end   结束索引
     * @returns {Array}
     */
    "range":{value:function range( start, end )
    {
        return storage(this,'items').slice(start, end);
    }},

    /**
     * 选择数据集
     * @param Number segments 选择数据的段数, 默认是1
     * @returns {DataSource}
     */
    "select":{value:function select( page )
    {
        var total = this.totalPage();
        page = page > 0 ? page : this.current();
        page = Math.min( page , isNaN(total)?page:total );
        storage(this,'current', page );
        var rows  = this.pageSize();
        var start=( page-1 ) * rows;
        var cached = storage(this,'cached');
        var loadCompleted = storage(this,'loadCompleted');
        var isRemote = storage(this,'isRemote');
        var items = storage(this,'items');
        var index = !loadCompleted && isRemote ? cached.loadSegments.indexOf(page) : page-1;
        var waiting = index < 0 || ( items.length < (index*rows+rows) );

        //数据准备好后需要立即通知
        storage(this,'nowNotify', true);
        storage(this,'selected', true);

        //需要等待加载数据
        if( isRemote && waiting && !loadCompleted )
        {
            var event = new DataSourceEvent( DataSourceEvent.SELECT );
            event.current = page;
            event.offset = start;
            event.data=null;
            event.waiting = true;
            this.dispatchEvent(event);

        }else
        {
            nowNotify.call(this,page,index*rows,rows);
        }
        //加载数据
        if( isRemote )
        {
            doload.call(this);
        }
        return this;
    }}
});
},

/***** Class es/events/NavigateEvent.es *****/

"es/events/NavigateEvent.es": function(module,require){
var NavigateEvent=function NavigateEvent(){
constructor.apply(this,arguments);
};
module.exports=NavigateEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"item":null,"viewport":null,"content":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.NavigateEvent",18);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.NavigateEvent",18);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.NavigateEvent",18);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.NavigateEvent").valueOf();
var method={"LOAD_CONTENT_BEFORE":{"value":'navigateLoadContentBefore',"type":16}
,"URL_JUMP_BEFORE":{"value":'navigateUrlJumpBefore',"type":16}
};
for(var prop in method){
	Object.defineProperty(NavigateEvent, prop, method[prop]);
}
var proto={"constructor":{"value":NavigateEvent},"getItem":{"value":function(){
	return this[__PRIVATE__].item;
},"type":2},"setItem":{"value":function(val){
	return this[__PRIVATE__].item=val;
},"type":2},"getViewport":{"value":function(){
	return this[__PRIVATE__].viewport;
},"type":2},"setViewport":{"value":function(val){
	return this[__PRIVATE__].viewport=val;
},"type":2},"getContent":{"value":function(){
	return this[__PRIVATE__].content;
},"type":2},"setContent":{"value":function(val){
	return this[__PRIVATE__].content=val;
},"type":2}};
NavigateEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/NavigateEvent.es",NavigateEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"NavigateEvent",
	"uri":["I45","M46","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** System system/Locator.es *****/

"system/Locator.es": function(module,require){
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
var Object =require("system/Object.es");
var TypeError =require("system/TypeError.es");
var System =require("system/System.es");
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

var cached={};

/**
 * 创建一个指定的url的分段信息
 * @param url  一个完整的url信息
 * @param name 返回指定的段名部分
 * @return {}
 */
Locator.create=function create(url,name){
    if( typeof url !== "string" )return false;
    url = System.trim(url);
    if( !/^(https?|file)\:\/\//i.test(url) )
    {
        var http = location.protocol+"//"+location.hostname+(location.port ? ":"+location.port : "");
        url = url.charAt(0) === "/" || url.charAt(0) === "?" ? http+url : http+"/"+url;
    }

    var segments = cached[ url ];
    if( !segments )
    {
        var match= url.match(/^((https?)\:\/\/)([\w\.\-]+)(\:(\d+))?(((\/([a-zA-Z]+[\w+](\.[a-zA-Z]+[\w+])?)*)+)?(\?(&?\w+\=?[^&#=]*)+)?(#[\w\,\|\-\+]*)?)?$/i);
        if( !match && /^file\:\/\//i.test(url) )
        {
            match= url.match(/^((file)\:\/\/\/)([a-zA-Z]+\:)(\:(\d+))?(((\/([a-zA-Z]+[\w+](\.[a-zA-Z]+[\w+])?)*)+)?(\?(&?\w+\=?[^&#=]*)+)?(#[\w\,\|\-\+]*)?)?$/i);
        }

        if( !match )return null;
        segments={
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
        cached[ url ] = segments;
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
},

/***** Class es/skins/NavigateSkin.es *****/

"es/skins/NavigateSkin.es": function(module,require){
var NavigateSkin=function NavigateSkin(){
constructor.apply(this,arguments);
};
module.exports=NavigateSkin;
var Skin=require("es/core/Skin.es");
var NavigateEvent=require("es/events/NavigateEvent.es");
var Navigate=require("es/components/Navigate.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var MouseEvent=require("system/MouseEvent.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, Navigate))throw new TypeError("type does not match. must be Navigate","es.skins.NavigateSkin",15);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var attrs={"__var53__":{"role":"presentation","class":"active"},"__var57__":{"role":"presentation"},"__var59__":{"class":"nav nav-pills"},"__var60__":{"class":"navigate"}};
	this[__PRIVATE__].properties=attrs;
	this.attributes(this.getElement(),attrs.__var60__);
};
var __PRIVATE__=Symbol("es.skins.NavigateSkin").valueOf();
var method={};
var proto={"constructor":{"value":NavigateSkin},"Z47_properties":{"writable":true,"value":{},"type":8}
,"Z47__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var datalist=dataset.datalist||[],
	openTarget=dataset.openTarget||false,
	match=dataset.match;
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var58__=this.L15_createElement(0,2,"ul",null,attrs.__var59__);
	var __var54__=[];
	Object.forEach(datalist,function(item,link){
		if(match(item,link)){
			__var54__.push(this.L15_createElement(__FOR0__,3,"li",[this.L15_createElement(__FOR0__,4,"a",Reflect.get(NavigateSkin,item,"label"),null,{"href":Reflect.get(NavigateSkin,item,"link"),"target":(openTarget?'_blank':'_self')},{"click":this.Z47_onClick})],attrs.__var53__));
		}
		else {
			__var54__.push(this.L15_createElement(__FOR0__,5,"li",[this.L15_createElement(__FOR0__,6,"a",Reflect.get(NavigateSkin,item,"label"),null,{"href":Reflect.get(NavigateSkin,item,"link"),"target":(openTarget?'_blank':'_self')},{"click":this.Z47_onClick})],attrs.__var57__));
		}
		__FOR0__++;
	},this);
	this.L15_updateChildren(__var58__,__var54__);
	return [__var58__];
},"type":1}
,"Z47_onClick":{"value":function onClick(e){
	if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.skins.NavigateSkin",48);
	var i;
	var hostComponent=this.L15_getHostComponent();
	var target=new Element(e.target);
	var href=target.property("href");
	if(href===hostComponent.getCurrent()){
		e.preventDefault();
		return false;
	}
	var dataProfile=hostComponent.getDataProfile();
	var event=new NavigateEvent(NavigateEvent.URL_JUMP_BEFORE);
	event.setContent(href);
	event.originalEvent=e;
	var datalist=Reflect.type(this.assign(dataProfile),Array);
	if(datalist){
		for(i in datalist){
			if(Reflect.get(NavigateSkin,datalist[i],"link")===event.getContent()){
				event.setItem(datalist[i]);
				break ;
			}
		}
	}
	hostComponent.dispatchEvent(event);
},"type":1}
};
NavigateSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/NavigateSkin.es",NavigateSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"NavigateSkin",
	"uri":["Z47","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** System system/MouseEvent.es *****/

"system/MouseEvent.es": function(module,require){
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object;
 */
function MouseEvent( type, bubbles,cancelable  )
{
    if( !(this instanceof MouseEvent) )return new MouseEvent(type, bubbles,cancelable);
    Event.call(this, type, bubbles,cancelable );
}

module.exports = MouseEvent;
var Object =require("system/Object.es");
var Event =require("system/Event.es");
var System =require("system/System.es");
var Element =require("system/Element.es");

MouseEvent.prototype=Object.create( Event.prototype,{
    "constructor":{value:MouseEvent}
});
MouseEvent.prototype.wheelDelta= null;
MouseEvent.prototype.pageX= NaN;
MouseEvent.prototype.pageY= NaN;
MouseEvent.prototype.offsetX=NaN;
MouseEvent.prototype.offsetY=NaN;
MouseEvent.prototype.screenX= NaN;
MouseEvent.prototype.screenY= NaN;
MouseEvent.MOUSE_DOWN='mousedown';
MouseEvent.MOUSE_UP='mouseup';
MouseEvent.MOUSE_OVER='mouseover';
MouseEvent.MOUSE_OUT='mouseout';
MouseEvent.MOUSE_OUTSIDE='mouseoutside';
MouseEvent.MOUSE_MOVE='mousemove';
MouseEvent.MOUSE_WHEEL='mousewheel';
MouseEvent.CLICK='click';
MouseEvent.DBLCLICK='dblclick';

var lastOriginalEvent;

//鼠标事件
Event.registerEvent(function ( type , target, originalEvent ) {

    lastOriginalEvent = originalEvent;
    if( type && /^mouse|click$/i.test(type) )
    {
        var event =new MouseEvent( type );
        event.pageX= originalEvent.x || originalEvent.clientX || originalEvent.pageX;
        event.pageY= originalEvent.y || originalEvent.clientY || originalEvent.pageY;
        event.offsetX = originalEvent.offsetX;
        event.offsetY = originalEvent.offsetY;
        event.screenX= originalEvent.screenX;
        event.screenY= originalEvent.screenY;
        if( typeof event.offsetX !=='number' && target )
        {
            event.offsetX=originalEvent.pageX-target.offsetLeft;
            event.offsetY=originalEvent.pageY-target.offsetTop;
        }
        if( type === MouseEvent.MOUSE_WHEEL )
        {
            event.wheelDelta=originalEvent.wheelDelta || ( originalEvent.detail > 0 ? -originalEvent.detail : Math.abs( originalEvent.detail ) );
        }
        return event;
    }
});

if( System.env.platform( System.env.BROWSER_FIREFOX ) )
{
    Event.fix.map[ MouseEvent.MOUSE_WHEEL ] = 'DOMMouseScroll';
}

Event.fix.hooks[ MouseEvent.MOUSE_OUTSIDE ]=function(listener, dispatcher)
{
    var doc = window;
    var target = this;
    var elem = new Element( this );
    var type = Event.fix.prefix+MouseEvent.CLICK;
    listener.proxyTarget = doc;
    listener.proxyType = [type];
    listener.proxyHandle = function(event)
    {
        var e = Event.create(event);
        var range = elem.getBoundingRect();
        if (!(e.pageX >= range.left && e.pageX <= range.right && e.pageY >= range.top && e.pageY <= range.bottom))
        {
            e.type = MouseEvent.MOUSE_OUTSIDE;
            e.currentTarget = target;
            listener.dispatcher.dispatchEvent( e );
        }
    }
    //防止当前鼠标点击事件向上冒泡后触发。
    setTimeout(function () {
        doc.addEventListener ? doc.addEventListener(type, listener.proxyHandle ) : doc.attachEvent(type, listener.proxyHandle );
    },10);
}
},

/***** Class es/components/DataGrid.es *****/

"es/components/DataGrid.es": function(module,require){
var DataGrid=function DataGrid(){
constructor.apply(this,arguments);
};
module.exports=DataGrid;
var SkinComponent=require("es/components/SkinComponent.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_columns":{},"_columnProfile":'columns',"_dataProfile":'datalist',"_radius":5,"_rowHeight":25,"_headHeight":30,"_footHeight":30}});

	if(componentId === undefined ){componentId="11";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",17);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.DataGrid").valueOf();
var method={};
var proto={"constructor":{"value":DataGrid},"B50__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	var dataSource=this[__PRIVATE__]._dataSource;
	if(dataSource===null){
		dataSource=new DataSource();
		this[__PRIVATE__]._dataSource=dataSource;
	}
	return dataSource;
},"type":2},"getSource":{"value":function source(){
	return this.getDataSource().source();
},"type":2},"setSource":{"value":function source(data){
	this.getDataSource().source(data);
},"type":4},"B50__columns":{"writable":true,"value":{},"type":8}
,"getColumns":{"value":function columns(){
	return this[__PRIVATE__]._columns;
},"type":2},"setColumns":{"value":function columns(columns){
	if(!System.is(columns, Object))throw new TypeError("type does not match. must be Object","es.components.DataGrid",78);
	this[__PRIVATE__]._columns=System.isString(columns)?Reflect.call(DataGrid,columns,"split",[',']):columns;
},"type":4},"getRows":{"value":function rows(){
	return this.getDataSource().pageSize();
},"type":2},"setRows":{"value":function rows(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",87);
	this.getDataSource().pageSize(value);
},"type":4},"B50__columnProfile":{"writable":true,"value":'columns',"type":8}
,"getColumnProfile":{"value":function columnProfile(){
	return this[__PRIVATE__]._columnProfile;
},"type":2},"setColumnProfile":{"value":function columnProfile(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",115);
	this[__PRIVATE__]._columnProfile=value;
},"type":4},"B50__dataProfile":{"writable":true,"value":'datalist',"type":8}
,"getDataProfile":{"value":function dataProfile(){
	return this[__PRIVATE__]._dataProfile;
},"type":2},"setDataProfile":{"value":function dataProfile(profile){
	if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.DataGrid",130);
	this[__PRIVATE__]._dataProfile=profile;
},"type":4},"B50__radius":{"writable":true,"value":5,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",153);
	this[__PRIVATE__]._radius=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__rowHeight":{"writable":true,"value":25,"type":8}
,"getRowHeight":{"value":function rowHeight(){
	return this[__PRIVATE__]._rowHeight;
},"type":2},"setRowHeight":{"value":function rowHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",177);
	this[__PRIVATE__]._rowHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__headHeight":{"writable":true,"value":30,"type":8}
,"getHeadHeight":{"value":function headHeight(){
	return this[__PRIVATE__]._headHeight;
},"type":2},"setHeadHeight":{"value":function headHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",201);
	this[__PRIVATE__]._headHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4},"B50__footHeight":{"writable":true,"value":30,"type":8}
,"getFootHeight":{"value":function footHeight(){
	return this[__PRIVATE__]._footHeight;
},"type":2},"setFootHeight":{"value":function footHeight(value){
	if(!System.is(value, Number))throw new TypeError("type does not match. must be Number","es.components.DataGrid",225);
	this[__PRIVATE__]._footHeight=value;
	this.k30_commitPropertyAndUpdateSkin();
},"type":4}};
DataGrid.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/DataGrid.es",DataGrid,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"DataGrid",
	"uri":["B50","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/PopUp.es *****/

"es/core/PopUp.es": function(module,require){
var PopUp=function PopUp(){
constructor.apply(this,arguments);
};
module.exports=PopUp;
var Container=require("es/core/Container.es");
var BasePopUp=require("es/core/BasePopUp.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var PopUpSkin=require("es/skins/PopUpSkin.es");
var PopUpManage=require("es/core/PopUpManage.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var JSON=require("system/JSON.es");
var Function=require("system/Function.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{}});

	if(componentId === undefined ){componentId="12";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.core.PopUp",25);
	BasePopUp.call(this,componentId);
};
var __PRIVATE__=Symbol("es.core.PopUp").valueOf();
var method={"T51__instance":{"writable":true,"value":null,"type":8}
,"skinClass":{"writable":true,"value":PopUpSkin,"type":8}
,"T51_getInstance":{"value":function getInstance(skinClass){
	if(skinClass === undefined ){skinClass=null;}
	if(skinClass!==null && !System.is(skinClass, "class"))throw new TypeError("type does not match. must be Class","es.core.PopUp",44);
	if(!PopUp.T51__instance){
		PopUp.T51__instance=new PopUp("12");
		PopUp.T51__instance.setSkinClass(PopUp.skinClass);
	}
	if(skinClass&&PopUp.T51__instance.getSkinClass()!==skinClass){
		PopUp.T51__instance.setSkinClass(skinClass);
	}
	return PopUp.T51__instance;
},"type":1}
,"T51_modalityInstance":{"writable":true,"value":null,"type":8}
,"T51_getModalityInstance":{"value":function getModalityInstance(skinClass){
	if(skinClass === undefined ){skinClass=null;}
	if(skinClass!==null && !System.is(skinClass, "class"))throw new TypeError("type does not match. must be Class","es.core.PopUp",68);
	if(!skinClass)skinClass=PopUp.skinClass;
	if(!PopUp.T51_modalityInstance){
		PopUp.T51_modalityInstance=new PopUp("12");
		PopUp.T51_modalityInstance.setSkinClass(skinClass);
	}
	if(skinClass&&PopUp.T51_modalityInstance.getSkinClass()!==skinClass){
		PopUp.T51_modalityInstance.setSkinClass(skinClass);
	}
	return PopUp.T51_modalityInstance;
},"type":1}
,"box":{"value":function box(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",90);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",90);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"disableScroll":false,"profile":{"currentState":"tips","content":message},"skinStyle":{"background":"none","borderRadius":"0px","boxShadow":"none","border":"none"}},options));
},"type":1}
,"tips":{"value":function tips(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",113);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",113);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"timeout":2,"vertical":"top","mask":false,"isModalWindow":false,"profile":{"currentState":"tips","content":message},"disableScroll":false},options));
},"type":1}
,"title":{"value":function title(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",133);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",133);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"timeout":2,"vertical":"top","mask":false,"isModalWindow":false,"profile":{"currentState":"title","content":message},"disableScroll":false},options));
},"type":1}
,"alert":{"value":function alert(message,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",153);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",153);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"isModalWindow":false,"vertical":"top","profile":{"currentState":"alert","content":message}},options));
},"type":1}
,"confirm":{"value":function confirm(message,callback,options){
	if(options === undefined ){options={};}
	if(!System.is(message, String))throw new TypeError("type does not match. must be String","es.core.PopUp",173);
	if(!System.is(callback, Function))throw new TypeError("type does not match. must be Function","es.core.PopUp",173);
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",173);
	return PopUp.T51_getInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"callback":callback,"vertical":"top","isModalWindow":false,"profile":{"currentState":"confirm","content":message},"offsetY":2},options));
},"type":1}
,"modality":{"value":function modality(title,content,options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",194);
	return PopUp.T51_getModalityInstance(options.skinClass).k30_show(Object.merge(true,{"mask":true,"isModalWindow":true,"profile":{"currentState":"modality","titleText":title,"content":content},"animation":{"fadeIn":{"name":"fadeIn"},"fadeOut":{"name":"fadeOut"}}},options));
},"type":1}
};
for(var prop in method){
	Object.defineProperty(PopUp, prop, method[prop]);
}
var proto={"constructor":{"value":PopUp},"k30_show":{"value":function show(options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUp",220);
	this.setOption(options);
	this.display();
	return this;
},"type":1}
,"k30_getContainer":{"value":function getContainer(){
	return Reflect.type(this.getSkin(),PopUpSkin).getPopupContainer();
},"type":1}
,"display":{"value":function display(){
	var opt;
	if(!this.k30_getState()){
		opt=this.getOption();
		BasePopUp.prototype.k30_show.call(this,opt);
		BasePopUp.prototype.display.call(this);
		PopUpManage.show(this,!!opt.isModalWindow,this.getOwner());
	}
	return this.getElement();
},"type":1}
};
PopUp.prototype=Object.create( BasePopUp.prototype , proto);
Internal.defineClass("es/core/PopUp.es",PopUp,{
	"extends":BasePopUp,
	"package":"es.core",
	"classname":"PopUp",
	"uri":["T51","k30","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/BasePopUp.es *****/

"es/core/BasePopUp.es": function(module,require){
var BasePopUp=function BasePopUp(){
constructor.apply(this,arguments);
};
module.exports=BasePopUp;
var SkinComponent=require("es/components/SkinComponent.es");
var Container=require("es/core/Container.es");
var Display=require("es/core/Display.es");
var Skin=require("es/core/Skin.es");
var IContainer=require("es/interfaces/IContainer.es");
var SystemManage=require("es/core/SystemManage.es");
var PopUpManage=require("es/core/PopUpManage.es");
var Object=require("system/Object.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Function=require("system/Function.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Array=require("system/Array.es");
var Event=require("system/Event.es");
var ElementEvent=require("system/ElementEvent.es");
var MouseEvent=require("system/MouseEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{"timeoutId":NaN,"_option":null,"state":false,"maskIntance":null,"animationEnd":true,"actionButtons":["cancel","submit","close"],"_owner":null,"_title":null}});
SkinComponent.apply(this,arguments);
};
var __PRIVATE__=Symbol("es.core.BasePopUp").valueOf();
var method={};
var proto={"constructor":{"value":BasePopUp},"k30_getTimeoutId":{"value":function(){
	return this[__PRIVATE__].timeoutId;
},"type":2},"k30_setTimeoutId":{"value":function(val){
	return this[__PRIVATE__].timeoutId=val;
},"type":2},"u52__option":{"writable":true,"value":null,"type":8}
,"getOption":{"value":function option(){
	if(this[__PRIVATE__]._option===null){
		this[__PRIVATE__]._option=Object.merge(true,{},PopUpManage.defaultOptions);
	}
	return this[__PRIVATE__]._option;
},"type":2},"setOption":{"value":function option(value){
	if(!System.is(value, Object))throw new TypeError("type does not match. must be Object","es.core.BasePopUp",47);
	this[__PRIVATE__]._option=Object.merge(true,{},PopUpManage.defaultOptions,value);
},"type":4},"k30_getState":{"value":function(){
	return this[__PRIVATE__].state;
},"type":2},"k30_setState":{"value":function(val){
	return this[__PRIVATE__].state=val;
},"type":2},"k30_getMaskIntance":{"value":function(){
	return this[__PRIVATE__].maskIntance;
},"type":2},"k30_setMaskIntance":{"value":function(val){
	return this[__PRIVATE__].maskIntance=val;
},"type":2},"k30_getAnimationEnd":{"value":function(){
	return this[__PRIVATE__].animationEnd;
},"type":2},"k30_setAnimationEnd":{"value":function(val){
	return this[__PRIVATE__].animationEnd=val;
},"type":2},"action":{"value":function action(type){
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.core.BasePopUp",70);
	var fadeOut;
	var container;
	var fn;
	var options=this.getOption();
	if(System.typeOf(options["on"+type])==="function"){
		fn=Reflect.type(options["on"+type],Function);
		if(fn()===false){
			return false;
		}
	}
	if(options.callback){
		if(Reflect.call(BasePopUp,options,"callback",[type])===false){
			return false;
		}
	}
	if(this.k30_getMaskIntance()){
		PopUpManage.mask(this.k30_getMaskIntance());
	}
	if(!System.isNaN(this.k30_getTimeoutId())){
		System.clearTimeout(this.k30_getTimeoutId());
		this.k30_setTimeoutId(NaN);
	}
	if(options.disableScroll){
		SystemManage.enableScroll();
	}
	var animation=Reflect.type(options.animation,Object);
	var skin=this.getSkin();
	if(this.k30_getState()&&animation&&animation.enabled){
		container=this.k30_getContainer();
		fadeOut=Reflect.type(animation.fadeOut,Object);
		this.k30_setAnimationEnd(false);
		container.style("animation",fadeOut.name+" "+fadeOut.duration+"s "+fadeOut.timing+" "+fadeOut.delay+"s "+fadeOut.fillMode);
		System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",115);
			skin.setVisible(false);
			obj.k30_setState(false);
			obj.k30_setAnimationEnd(true);
			PopUpManage.close(obj);
		},(fadeOut.delay+fadeOut.duration)*1000,this);
	}
	else {
		this.k30_setState(false);
		skin.setVisible(false);
		PopUpManage.close(this);
	}
	return true;
},"type":1}
,"k30_getContainer":{"value":function getContainer(){
	return this.getSkin();
},"type":1}
,"k30_position":{"value":function position(){
	var opt=this.getOption();
	var horizontal=Reflect.type(opt.horizontal,String);
	var vertical=Reflect.type(opt.vertical,String);
	var skin=this.k30_getContainer();
	if(System.typeOf(opt.x)==="string"&&Reflect.call(BasePopUp,opt.x,"slice",[-1])==="%"||!System.isNaN(opt.x)){
		skin.style("left",opt.x);
		horizontal='';
	}
	if(System.typeOf(opt.y)==="string"&&Reflect.call(BasePopUp,opt.y,"slice",[-1])==="%"||!System.isNaN(opt.y)){
		skin.style("top",opt.y);
		vertical='';
	}
	var offsetX=parseInt(opt.offsetX);
	var offsetY=parseInt(opt.offsetY);
	var win=SystemManage.getWindow();
	var winX=Reflect.type(win.width(),Number);
	var winY=Reflect.type(win.height(),Number);
	switch(horizontal){
		case "left":skin.setLeft(Reflect.type(Math.max(offsetX,0),Number));
		break ;
		case "right":skin.setLeft(this.u52_getMaxAndMin(offsetX+(winX-skin.getWidth()),winX,skin.getWidth()));
		break ;
		case "center":skin.setLeft(this.u52_getMaxAndMin(offsetX+(winX-skin.getWidth())/2,winX,skin.getWidth()));
		break ;
	}
	switch(vertical){
		case "top":skin.setTop(Reflect.type(Math.max(offsetY,0),Number));
		break ;
		case "bottom":skin.setTop(this.u52_getMaxAndMin(offsetY+(winY-skin.getHeight()),winY,skin.getHeight()));
		break ;
		case "middle":skin.setTop(this.u52_getMaxAndMin(offsetY+(winY-skin.getHeight())/2,winY,skin.getHeight()));
		break ;
	}
},"type":1}
,"u52_getMaxAndMin":{"value":function getMaxAndMin(val,winSize,skinSize){
	if(!System.is(val, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	if(!System.is(winSize, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	if(!System.is(skinSize, Number))throw new TypeError("type does not match. must be int","es.core.BasePopUp",197);
	return Math.max(Math.max(val,0),Math.min(val,winSize-skinSize));
},"type":1}
,"u52_actionButtons":{"writable":true,"value":["cancel","submit","close"],"type":8}
,"k30_initializing":{"value":function initializing(){
	SkinComponent.prototype.k30_initializing.call(this);
	var skin=this.getSkin();
	SystemManage.getWindow().addEventListener(Event.RESIZE,this.k30_position,false,0,this);
	this.k30_getContainer().addEventListener(ElementEvent.ADD,this.k30_position,false,0,this);
	var main=this.k30_getContainer();
	var opt=this.getOption();
	main.removeEventListener(MouseEvent.MOUSE_OUTSIDE);
	main.addEventListener(MouseEvent.MOUSE_OUTSIDE,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.core.BasePopUp",223);
		if(this.k30_getState()){
			if(opt.isModalWindow){
				if(opt.clickOutsideClose===true){
					this.close();
				}
			}
			else if(this.k30_getAnimationEnd()){
				this.k30_setAnimationEnd(false);
				main.getElement().animation("shake",0.2);
				System.setTimeout(function(target){
					if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",238);
					target.k30_setAnimationEnd(true);
				},300,this);
			}
		}
	},false,0,this);
},"type":1}
,"k30_show":{"value":function show(options){
	if(options === undefined ){options={};}
	if(!System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.BasePopUp",252);
	this.k30_setState(true);
	if(options.disableScroll){
		SystemManage.disableScroll();
	}
	if(options.mask===true){
		this.k30_setMaskIntance(PopUpManage.mask(null,options.maskStyle));
	}
	return this;
},"type":1}
,"u52__owner":{"writable":true,"value":null,"type":8}
,"getOwner":{"value":function owner(){
	if(this[__PRIVATE__]._owner===null){
		this[__PRIVATE__]._owner=new Container(SystemManage.getBody());
	}
	return this[__PRIVATE__]._owner;
},"type":2},"setOwner":{"value":function owner(value){
	if(!System.is(value, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.BasePopUp",292);
	this[__PRIVATE__]._owner=value;
},"type":4},"u52__title":{"writable":true,"value":null,"type":8}
,"getTitle":{"value":function title(){
	return this[__PRIVATE__]._title;
},"type":2},"setTitle":{"value":function title(value){
	this[__PRIVATE__]._title=value;
},"type":4},"getOnSubmit":{"value":function onSubmit(){
	return Reflect.type(this.getOption().onsubmit,Function);
},"type":2},"setOnSubmit":{"value":function onSubmit(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",322);
	this.getOption().onsubmit=value;
},"type":4},"getOnCancel":{"value":function onCancel(){
	return Reflect.type(this.getOption().oncancel,Function);
},"type":2},"setOnCancel":{"value":function onCancel(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",338);
	this.getOption().oncancel=value;
},"type":4},"getOnClose":{"value":function onClose(){
	return Reflect.type(this.getOption().onclose,Function);
},"type":2},"setOnClose":{"value":function onClose(value){
	if(!System.is(value, Function))throw new TypeError("type does not match. must be Function","es.core.BasePopUp",354);
	this.getOption().onclose=value;
},"type":4},"display":{"value":function display(){
	var fadeIn;
	var skin=this.getSkin();
	var options=this.getOption();
	var profile=Reflect.type(options.profile,Object);
	if(System.env.platform('IE',8)){
		skin.style('position','absolute');
	}
	if(this[__PRIVATE__]._title!=null){
		profile.titleText=this[__PRIVATE__]._title;
	}
	Object.forEach(profile,function(value,prop){
		if(!System.is(prop, String))throw new TypeError("type does not match. must be String","es.core.BasePopUp",387);
		switch(prop){
			case "currentState":skin.setCurrentState(Reflect.type(value,String));
			break ;
			case "content":if(value){
				skin.setChildren(System.instanceOf(value, Array)?value:[value]);
			}
			default :skin.assign(prop,value);
		}
	},this);
	if(options.width>0){
		skin.setWidth(Reflect.type(options.width,Number));
	}
	if(options.height>0){
		skin.setHeight(Reflect.type(options.height,Number));
	}
	var elem=SkinComponent.prototype.display.call(this);
	elem.show();
	var container=this.k30_getContainer();
	var animation=Reflect.type(options.animation,Object);
	var timeout=options.timeout*1000;
	if(animation.enabled&&!animation.running){
		this.k30_setAnimationEnd(false);
		fadeIn=Reflect.type(animation.fadeIn,Object);
		container.style("animation",fadeIn.name+" "+fadeIn.duration+"s "+fadeIn.timing+" "+fadeIn.delay+"s "+fadeIn.fillMode);
		timeout=(options.timeout+fadeIn.delay+fadeIn.duration)*1000;
		System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",427);
			obj.k30_setAnimationEnd(true);
		},timeout,this);
	}
	if(options.timeout>0){
		this.k30_setTimeoutId(System.setTimeout(function(obj){
			if(!System.is(obj, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.BasePopUp",435);
			obj.action("close");
		},timeout,this));
	}
	return elem;
},"type":1}
,"close":{"value":function close(){
	this.action("close");
},"type":1}
};
BasePopUp.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/core/BasePopUp.es",BasePopUp,{
	"extends":SkinComponent,
	"package":"es.core",
	"classname":"BasePopUp",
	"abstract":true,
	"uri":["u52","k30","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/core/PopUpManage.es *****/

"es/core/PopUpManage.es": function(module,require){
var PopUpManage=function PopUpManage(){
constructor.apply(this,arguments);
};
module.exports=PopUpManage;
var IContainer=require("es/interfaces/IContainer.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var SystemManage=require("es/core/SystemManage.es");
var BasePopUp=require("es/core/BasePopUp.es");
var Display=require("es/core/Display.es");
var Array=require("system/Array.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{}});
};
var __PRIVATE__=Symbol("es.core.PopUpManage").valueOf();
var method={"MASK_LEVEL":{"value":99900,"type":16}
,"WINDOW_LEVEL":{"value":99910,"type":16}
,"TOP_LEVEL":{"value":99999,"type":16}
,"defaultOptions":{"writable":true,"value":{"profile":{"titleText":"提示","currentState":"modality"},"disableScroll":false,"isModalWindow":true,"mask":true,"callback":null,"timeout":0,"maskStyle":null,"clickOutsideClose":false,"animation":{"enabled":true,"fadeIn":{"name":"fadeInDown","duration":0.2,"timing":"linear","delay":0,"fillMode":"forwards"},"fadeOut":{"name":"fadeOutUp","duration":0.2,"timing":"linear","delay":0,"fillMode":"forwards"}},"horizontal":"center","vertical":"middle","offsetX":0,"offsetY":0,"x":NaN,"y":NaN},"type":8}
,"i53_count":{"writable":true,"value":0,"type":8}
,"i53_maskInstance":{"writable":true,"value":null,"type":8}
,"i53_systemPopUpInstance":{"writable":true,"value":null,"type":8}
,"i53_modalityInstances":{"writable":true,"value":[],"type":8}
,"i53_maskActiveCount":{"writable":true,"value":0,"type":8}
,"mask":{"value":function mask(target,options){
	if(options === undefined ){options=null;}
	if(target === undefined ){target=null;}
	if(target!==null && !System.is(target, Display))throw new TypeError("type does not match. must be Display","es.core.PopUpManage",96);
	if(options!==null && !System.is(options, Object))throw new TypeError("type does not match. must be Object","es.core.PopUpManage",96);
	if(target){
		Reflect.decre(PopUpManage,PopUpManage,"maskActiveCount");
		if(PopUpManage.i53_maskActiveCount<1){
			Reflect.type(target,MaskDisplay).fadeOut();
			PopUpManage.i53_maskActiveCount=0;
		}
		return target;
	}
	var obj=PopUpManage.i53_maskInstance;
	if(obj==null){
		obj=new MaskDisplay(SystemManage.getBody());
		obj.style("zIndex",PopUpManage.MASK_LEVEL);
		PopUpManage.i53_maskInstance=obj;
	}
	if(options){
		obj.options(options);
	}
	Reflect.incre(PopUpManage,PopUpManage,"maskActiveCount");
	obj.fadeIn();
	return obj;
},"type":1}
,"show":{"value":function show(target,isModalWindow,viewport){
	if(viewport === undefined ){viewport=null;}
	if(isModalWindow === undefined ){isModalWindow=false;}
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",130);
	if(!System.is(isModalWindow, Boolean))throw new TypeError("type does not match. must be Boolean","es.core.PopUpManage",130);
	if(viewport!==null && !System.is(viewport, IContainer))throw new TypeError("type does not match. must be IContainer","es.core.PopUpManage",130);
	var elem;
	Reflect.incre(PopUpManage,PopUpManage,"count");
	var level=PopUpManage.WINDOW_LEVEL;
	if(isModalWindow===true){
		if(PopUpManage.i53_modalityInstances.indexOf(target)<0){
			PopUpManage.i53_modalityInstances.push(target);
		}
		PopUpManage.active(target);
	}
	else {
		if(PopUpManage.i53_systemPopUpInstance&&target!==PopUpManage.i53_systemPopUpInstance){
			elem=PopUpManage.i53_systemPopUpInstance.getElement();
			if(PopUpManage.i53_systemPopUpInstance.getParent()){
				PopUpManage.i53_systemPopUpInstance.getParent().removeChild(PopUpManage.i53_systemPopUpInstance);
			}
		}
		PopUpManage.i53_systemPopUpInstance=target;
		level=PopUpManage.TOP_LEVEL;
	}
	target.getElement().style("zIndex",level);
	if(target.getElement().parent().isEmpty()){
		viewport.addChild(target);
	}
},"type":1}
,"active":{"value":function active(target){
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",173);
	var skin;
	var obj;
	var index=0;
	var len=PopUpManage.i53_modalityInstances.length;
	var at=0;
	for(;index<len;index++){
		obj=Reflect.type(PopUpManage.i53_modalityInstances[index],BasePopUp);
		skin=target.getSkin();
		if(target===obj){
			at=index;
			skin.getElement().style('zIndex',PopUpManage.WINDOW_LEVEL);
			skin.getElement().addClass("active");
		}
		else {
			skin.getElement().style('zIndex',PopUpManage.WINDOW_LEVEL-1);
			skin.getElement().removeClass("active");
		}
	}
	if(at>0){
		PopUpManage.i53_modalityInstances.splice(at,1);
		PopUpManage.i53_modalityInstances.push(target);
	}
},"type":1}
,"close":{"value":function close(target){
	if(!System.is(target, BasePopUp))throw new TypeError("type does not match. must be BasePopUp","es.core.PopUpManage",207);
	var parent;
	if(PopUpManage.i53_count>0){
		Reflect.decre(PopUpManage,PopUpManage,"count");
	}
	var index=PopUpManage.i53_modalityInstances.indexOf(target);
	if(index>=0){
		parent=target.getParent();
		if(parent){
			parent.removeChild(target);
		}
		PopUpManage.i53_modalityInstances.splice(index,1);
		if(PopUpManage.i53_modalityInstances.length>0){
			PopUpManage.active(Reflect.type(PopUpManage.i53_modalityInstances[PopUpManage.i53_modalityInstances.length-1],BasePopUp));
		}
		return target;
	}
	return null;
},"type":1}
};
for(var prop in method){
	Object.defineProperty(PopUpManage, prop, method[prop]);
}
var proto={"constructor":{"value":PopUpManage}};
PopUpManage.prototype=Object.create( Object.prototype , proto);
Internal.defineClass("es/core/PopUpManage.es",PopUpManage,{
	"package":"es.core",
	"classname":"PopUpManage",
	"uri":["i53","d55","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
var MaskDisplay = (function(){var MaskDisplay=function MaskDisplay(){
constructor.apply(this,arguments);
};
var Display=require("es/core/Display.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Element=require("system/Element.es");
var Object=require("system/Object.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(viewport){
	Object.defineProperty(this,__PRIVATE__,{value:{"_options":null,"_state":false,"timeoutId":NaN}});

	if(!System.is(viewport, Element))throw new TypeError("type does not match. must be Element","MaskDisplay",267);
	Display.call(this,new Element('<div tabIndex="-1" />'));
	this[__PRIVATE__]._options=MaskDisplay.y54_defaultOptions;
	this.style("cssText",System.serialize(MaskDisplay.y54_defaultOptions.style,"style"));
	this.setVisible(false);
	viewport.addChild(this.getElement());
};
var __PRIVATE__=Symbol("MaskDisplay").valueOf();
var method={"y54_defaultOptions":{"writable":true,"value":{"animation":{"enabled":true,"fadeIn":0.2,"fadeOut":0.2},"style":{"backgroundColor":"#000000","opacity":0.7,"position":"fixed","left":"0px","top":"0px","right":"0px","bottom":"0px"}},"type":8}
};
for(var prop in method){
	Object.defineProperty(MaskDisplay, prop, method[prop]);
}
var proto={"constructor":{"value":MaskDisplay},"y54__options":{"writable":true,"value":null,"type":8}
,"y54__state":{"writable":true,"value":false,"type":8}
,"options":{"value":function options(option){
	if(!System.is(option, Object))throw new TypeError("type does not match. must be Object","MaskDisplay",277);
	this[__PRIVATE__]._options=Object.merge(true,{},MaskDisplay.y54_defaultOptions,option);
},"type":1}
,"fadeIn":{"value":function fadeIn(){
	var animation;
	if(!System.isNaN(this[__PRIVATE__].timeoutId)){
		System.clearTimeout(this[__PRIVATE__].timeoutId);
		this[__PRIVATE__].timeoutId=NaN;
	}
	else if(!this[__PRIVATE__]._state){
		animation=Reflect.type(MaskDisplay.y54_defaultOptions.animation,Object);
		if(animation.fadeIn>0){
			this.getElement().fadeIn(animation.fadeIn,Reflect.type(this[__PRIVATE__]._options.style.opacity,Number));
		}
	}
	else {
		this.getElement().style("opacity",this[__PRIVATE__]._options.style.opacity);
		this.getElement().style("animation","none");
	}
	this[__PRIVATE__]._state=true;
	this.setVisible(true);
},"type":1}
,"y54_timeoutId":{"writable":true,"value":NaN,"type":8}
,"fadeOut":{"value":function fadeOut(){
	if(this[__PRIVATE__]._state){
		this[__PRIVATE__]._state=false;
		this[__PRIVATE__].timeoutId=System.setTimeout(function(target){
			if(!System.is(target, MaskDisplay))throw new TypeError("type does not match. must be MaskDisplay","MaskDisplay",315);
			var animation=Reflect.type(MaskDisplay.y54_defaultOptions.animation,Object);
			var fadeOut=Reflect.type(animation.fadeOut,Number);
			if(animation.fadeOut>0){
				target.getElement().fadeOut(Reflect.type(animation.fadeOut,Number),Reflect.type(target[__PRIVATE__]._options.style.opacity,Number));
			}
			System.setTimeout(function(){
				target.setVisible(false);
				target.getElement().style("animation","none");
			},(fadeOut)*1000);
			System.clearTimeout(target[__PRIVATE__].timeoutId);
		},100,this);
	}
},"type":1}
};
MaskDisplay.prototype=Object.create( Display.prototype , proto);
Internal.defineClass("MaskDisplay.es",MaskDisplay,{
	"ns":"Y7",
	"extends":Display,
	"package":"es.core",
	"classname":"MaskDisplay",
	"uri":["y54","L15","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);
return MaskDisplay;
}());

},

/***** Class es/core/SystemManage.es *****/

"es/core/SystemManage.es": function(module,require){
var SystemManage=function SystemManage(){
constructor.apply(this,arguments);
};
module.exports=SystemManage;
var EventDispatcher=require("system/EventDispatcher.es");
var Element=require("system/Element.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function(){
Object.defineProperty(this,__PRIVATE__,{value:{}});
EventDispatcher.apply(this,arguments);
};
var __PRIVATE__=Symbol("es.core.SystemManage").valueOf();
var method={"X56__window":{"writable":true,"value":undefined,"type":8}
,"getWindow":{"value":function getWindow(){
	if(!SystemManage.X56__window)SystemManage.X56__window=new Element(window);
	return SystemManage.X56__window;
},"type":1}
,"X56__document":{"writable":true,"value":undefined,"type":8}
,"getDocument":{"value":function getDocument(){
	if(!SystemManage.X56__document)SystemManage.X56__document=new Element(document);
	return SystemManage.X56__document;
},"type":1}
,"X56__body":{"writable":true,"value":undefined,"type":8}
,"getBody":{"value":function getBody(){
	if(!SystemManage.X56__body)SystemManage.X56__body=new Element(document.body);
	return SystemManage.X56__body;
},"type":1}
,"X56__disableScroll":{"writable":true,"value":false,"type":8}
,"disableScroll":{"value":function disableScroll(){
	var body;
	if(!SystemManage.X56__disableScroll){
		SystemManage.X56__disableScroll=true;
		body=SystemManage.getBody();
		body.style("overflowX","hidden");
		body.style("overflowY","hidden");
	}
},"type":1}
,"enableScroll":{"value":function enableScroll(){
	var body;
	if(SystemManage.X56__disableScroll===true){
		SystemManage.X56__disableScroll=false;
		body=SystemManage.getBody();
		body.style("overflowX","auto");
		body.style("overflowY","auto");
	}
},"type":1}
};
for(var prop in method){
	Object.defineProperty(SystemManage, prop, method[prop]);
}
var proto={"constructor":{"value":SystemManage}};
SystemManage.prototype=Object.create( EventDispatcher.prototype , proto);
Internal.defineClass("es/core/SystemManage.es",SystemManage,{
	"extends":null,
	"package":"es.core",
	"classname":"SystemManage",
	"uri":["X56","W57","Y7"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/skins/PopUpSkin.es *****/

"es/skins/PopUpSkin.es": function(module,require){
var PopUpSkin=function PopUpSkin(){
constructor.apply(this,arguments);
};
module.exports=PopUpSkin;
var Skin=require("es/core/Skin.es");
var State=require("es/core/State.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var PopUp=require("es/core/PopUp.es");
var Container=require("es/core/Container.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Reflect=require("system/Reflect.es");
var Object=require("system/Object.es");
var Function=require("system/Function.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"head":null,"body":null,"footer":null,"popupContainer":null,"_hostComponent":undefined,"_makeMap":{},"hasSetHeight":false}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, PopUp))throw new TypeError("type does not match. must be PopUp","es.skins.PopUpSkin",18);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var __var77__=new State();
	__var77__.setName("tips");
	__var77__.setStateGroup(["simple"]);
	var __var78__=new State();
	__var78__.setName("title");
	__var78__.setStateGroup(["simple"]);
	var __var79__=new State();
	__var79__.setName("alert");
	__var79__.setStateGroup(["normal"]);
	var __var80__=new State();
	__var80__.setName("confirm");
	__var80__.setStateGroup(["normal"]);
	var __var81__=new State();
	__var81__.setName("modality");
	__var81__.setStateGroup(["normal"]);
	this.setStates([__var77__,__var78__,__var79__,__var80__,__var81__]);
	this.setCurrentState("alert");
	var attrs={"__var67__":{"class":"popup-head"},"__var69__":{"class":"popup-title"},"__var71__":{"type":"button","class":"close"},"__var72__":{"class":"popup-body"},"__var73__":{"class":"popup-footer"},"__var75__":{"type":"button"},"__var82__":{"class":"popup","tabindex":-1}};
	this[__PRIVATE__].properties=attrs;
	var head=Reflect.type((this.L15_createComponent(0,3,Container,"div",null,attrs.__var67__)),Container);
	this.setHead(head);
	var body=Reflect.type((this.L15_createComponent(0,6,Container,"div",null,attrs.__var72__)),Container);
	this.setBody(body);
	var footer=Reflect.type((this.L15_createComponent(0,7,Container,"div",null,attrs.__var73__)),Container);
	this.setFooter(footer);
	var popupContainer=Reflect.type((this.L15_createComponent(0,2,Container,"div")),Container);
	this.setPopupContainer(popupContainer);
	this.attributes(this.getElement(),attrs.__var82__);
};
var __PRIVATE__=Symbol("es.skins.PopUpSkin").valueOf();
var method={};
var proto={"constructor":{"value":PopUpSkin},"b58_properties":{"writable":true,"value":{},"type":8}
,"getHead":{"value":function(){
	return this[__PRIVATE__].head;
},"type":2},"setHead":{"value":function(val){
	return this[__PRIVATE__].head=val;
},"type":2},"getBody":{"value":function(){
	return this[__PRIVATE__].body;
},"type":2},"setBody":{"value":function(val){
	return this[__PRIVATE__].body=val;
},"type":2},"getFooter":{"value":function(){
	return this[__PRIVATE__].footer;
},"type":2},"setFooter":{"value":function(val){
	return this[__PRIVATE__].footer=val;
},"type":2},"getPopupContainer":{"value":function(){
	return this[__PRIVATE__].popupContainer;
},"type":2},"setPopupContainer":{"value":function(val){
	return this[__PRIVATE__].popupContainer=val;
},"type":2},"b58__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup){
		throw new TypeError("State group is not defined for 'stateGroup'","es.skins.PopUpSkin","54:66");
	}
	var titleText=dataset.titleText||"title",
	closeText=dataset.closeText||"×",
	submitText=dataset.submitText||"确 定",
	cancelText=dataset.cancelText||"取 消",
	headHeight=dataset.headHeight||NaN,
	footerHeight=dataset.footerHeight||NaN,
	left=dataset.left||NaN,
	top=dataset.top||NaN,
	right=dataset.right||NaN,
	bottom=dataset.bottom||NaN;
	var attrs=this[__PRIVATE__].properties;
	var head=Reflect.type((!stateGroup.includeIn("tips")?this.getHead():null),Container);
	var body=this.getBody();
	var footer=Reflect.type((!stateGroup.includeIn("simple")?this.getFooter():null),Container);
	var popupContainer=this.getPopupContainer();
	if(head){
		head.setHeight(headHeight);
		this.L15_updateChildren(head,[this.L15_createElement(0,4,"span",titleText,attrs.__var69__),!stateGroup.includeIn("title")?this.L15_createElement(0,5,"button",closeText,attrs.__var71__,null,{"click":(this.b58_makeAction('close'))}):null]);
	}
	this.L15_updateChildren(body,this.getChildren());
	if(footer){
		footer.setHeight(footerHeight);
		this.L15_updateChildren(footer,[!stateGroup.includeIn("alert")?this.L15_createElement(0,8,"button",cancelText,attrs.__var75__,{"class":stateGroup.includeIn("modality")?"btn btn-default":"btn btn-sm btn-default"},{"click":(this.b58_makeAction('cancel'))}):null,this.L15_createElement(0,9,"button",submitText,attrs.__var75__,{"class":stateGroup.includeIn("modality")?"btn btn-sm btn-primary":"btn btn-sm btn-primary"},{"click":(this.b58_makeAction('submit'))})]);
	}
	popupContainer.setLeft(Reflect.type(left,Number));
	popupContainer.setTop(Reflect.type(top,Number));
	popupContainer.setRight(Reflect.type(right,Number));
	popupContainer.setBottom(Reflect.type(bottom,Number));
	this.attributes(popupContainer.getElement(),{"class":stateGroup.includeIn("modality")?"popup-container fixed popup-lg":"popup-container fixed"});
	this.L15_updateChildren(popupContainer,[head,body,footer]);
	return [popupContainer];
},"type":1}
,"b58__makeMap":{"writable":true,"value":{},"type":8}
,"b58_makeAction":{"value":function makeAction(name){
	if(!System.is(name, String))throw new TypeError("type does not match. must be String","es.skins.PopUpSkin",96);
	if(this[__PRIVATE__]._makeMap.hasOwnProperty(name)){
		return Reflect.type(this[__PRIVATE__]._makeMap[name],Function);
	}
	var fn=this.L15_getHostComponent().action.bind(this.L15_getHostComponent(),name);
	this[__PRIVATE__]._makeMap[name]=fn;
	return fn;
},"type":1}
,"getWidth":{"value":function width(){
	return this.getPopupContainer().getWidth();
},"type":2},"setWidth":{"value":function width(val){
	if(!(val>=0) && !System.isNaN(val))throw new TypeError("type does not match. must be uint","es.skins.PopUpSkin",107);
	this.getPopupContainer().setWidth(val);
},"type":4},"b58_hasSetHeight":{"writable":true,"value":false,"type":8}
,"getHeight":{"value":function height(){
	return this.getPopupContainer().getHeight();
},"type":2},"setHeight":{"value":function height(val){
	if(!(val>=0) && !System.isNaN(val))throw new TypeError("type does not match. must be uint","es.skins.PopUpSkin",118);
	this.getPopupContainer().setHeight(val);
	this[__PRIVATE__].hasSetHeight=true;
},"type":4},"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var h=this.getPopupContainer().getHeight();
	var stateGroup=this.L15_getCurrentStateGroup();
	if(!stateGroup.includeIn("tips")){
		h-=this.getHead().getHeight();
	}
	if(!stateGroup.includeIn("simple")){
		h-=this.getFooter().getHeight();
	}
	this.getBody().setHeight(h);
},"type":1}
};
PopUpSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/PopUpSkin.es",PopUpSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"PopUpSkin",
	"uri":["b58","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/skins/DataGridSkin.es *****/

"es/skins/DataGridSkin.es": function(module,require){
var DataGridSkin=function DataGridSkin(){
constructor.apply(this,arguments);
};
module.exports=DataGridSkin;
var Skin=require("es/core/Skin.es");
var IDisplay=require("es/interfaces/IDisplay.es");
var DataGrid=require("es/components/DataGrid.es");
var Pagination=require("es/components/Pagination.es");
var PaginationSkin=require("es/skins/PaginationSkin.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Reflect=require("system/Reflect.es");
var Array=require("system/Array.es");
var Object=require("system/Object.es");
var Element=require("system/Element.es");
var DataSource=require("system/DataSource.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"head":null,"body":null,"pagination":null,"foot":null,"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, DataGrid))throw new TypeError("type does not match. must be DataGrid","es.skins.DataGridSkin",20);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"table");
	var attrs={"__var108__":{"style":"height: 25px;"},"__var115__":{"colspan":3},"__var117__":{"class":"table data-grid-skin"}};
	this[__PRIVATE__].properties=attrs;
	var head=this.L15_createElement(0,2,"thead");
	this.setHead(head);
	var body=this.L15_createElement(0,7,"tbody");
	this.setBody(body);
	var pagination=Reflect.type((this.L15_createComponent(0,15,Pagination)),Pagination);
	this.setPagination(pagination);
	var foot=this.L15_createElement(0,12,"tfoot");
	this.setFoot(foot);
	this.attributes(this.getElement(),attrs.__var117__);
};
var __PRIVATE__=Symbol("es.skins.DataGridSkin").valueOf();
var method={};
var proto={"constructor":{"value":DataGridSkin},"i59_properties":{"writable":true,"value":{},"type":8}
,"getHead":{"value":function(){
	return this[__PRIVATE__].head;
},"type":2},"setHead":{"value":function(val){
	return this[__PRIVATE__].head=val;
},"type":2},"getBody":{"value":function(){
	return this[__PRIVATE__].body;
},"type":2},"setBody":{"value":function(val){
	return this[__PRIVATE__].body=val;
},"type":2},"getPagination":{"value":function(){
	return this[__PRIVATE__].pagination;
},"type":2},"setPagination":{"value":function(val){
	return this[__PRIVATE__].pagination=val;
},"type":2},"getFoot":{"value":function(){
	return this[__PRIVATE__].foot;
},"type":2},"setFoot":{"value":function(val){
	return this[__PRIVATE__].foot=val;
},"type":2},"i59__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var106__=this.L15_createElement(0,3,"tr");
	var head=this.getHead();
	var __FOR1__=0;
	var body=this.getBody();
	var pagination=this.getPagination();
	var foot=this.getFoot();
	var __var105__=[];
	Object.forEach(dataset.columns,function(name,key){
		__var105__.push(this.L15_createElement(__FOR0__,4,"th",[name,this.L15_createElement(__FOR0__,6,"span")],null,{"style":"height:"+dataset.headHeight+"px;line-height:"+dataset.headHeight+"px;"}));
		__FOR0__++;
	},this);
	this.L15_updateChildren(__var106__,__var105__);
	this.L15_updateChildren(head,[__var106__]);
	var __var113__=[];
	Object.forEach(dataset.datalist,function(item,key){
		var __var110__=[];
		Object.forEach(dataset.columns,function(val,field){
			switch(field){
				case "name":__var110__.push(this.L15_createElement(__FOR1__,9,"td",[this.L15_createElement(__FOR1__,10,"input",null,attrs.__var108__,{"value":(Reflect.get(DataGridSkin,item,field))})],null,{"data-column":field,"style":"height:"+dataset.rowHeight+"px;line-height:"+dataset.rowHeight+"px;"}));
				break ;
				default :__var110__.push(this.L15_createElement(__FOR1__,11,"td",(Reflect.get(DataGridSkin,item,field)),null,{"data-column":field,"style":"height:"+dataset.rowHeight+"px;line-height:"+dataset.rowHeight+"px;"}));
			}
			__FOR1__++;
		},this);
		var __var112__=this.L15_createElement(__FOR1__,8,"tr");
		this.L15_updateChildren(__var112__,__var110__);
		__var113__.push(__var112__);
		__FOR1__++;
	},this);
	this.L15_updateChildren(body,__var113__);
	pagination.setRadius(3);
	pagination.setAsync(true);
	pagination.setSkinClass(PaginationSkin);
	this.L15_updateChildren(foot,[this.L15_createElement(0,13,"tr",[this.L15_createElement(0,14,"td",[pagination],attrs.__var115__)])]);
	return [head,body,foot];
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var hostComponent=this.L15_getHostComponent();
	var radius=hostComponent.getRadius()+'px';
	var table=this.getElement();
	table.style('borderRadius',radius);
	Element('thead > tr:first-child >th:first-child',table).style('borderTopLeftRadius',radius);
	Element('thead > tr:first-child >th:last-child',table).style('borderTopRightRadius',radius);
	Element('tfoot > tr:last-child >td:first-child',table).style('borderBottomLeftRadius',radius);
	Element('tfoot > tr:last-child >td:last-child',table).style('borderBottomRightRadius',radius);
	Element('td',this.getFoot()).height(hostComponent.getFootHeight());
},"type":1}
,"L15_initializing":{"value":function initializing(){
	var dataProfile;
	var body;
	var dataSource;
	var hostComponent=this.L15_getHostComponent();
	if(hostComponent.isNeedCreateSkin()){
		dataSource=hostComponent.getDataSource();
		body=this;
		dataProfile=hostComponent.getDataProfile();
		this.getPagination().setDataSource(dataSource);
		body.assign('rowHeight',hostComponent.getRowHeight());
		body.assign('headHeight',hostComponent.getHeadHeight());
		body.assign(dataProfile,[]);
		body.assign(hostComponent.getColumnProfile(),hostComponent.getColumns());
		body.assign(hostComponent.getColumnProfile(),hostComponent.getColumns());
		dataSource.addEventListener(DataSourceEvent.SELECT,function(event){
			if(!System.is(event, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.skins.DataGridSkin",117);
			if(!event.waiting){
				body.assign(dataProfile,event.data);
				body.display();
			}
		});
		dataSource.select(this.getPagination().getCurrent());
	}
	Skin.prototype.L15_initializing.call(this);
},"type":1}
};
DataGridSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/DataGridSkin.es",DataGridSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"DataGridSkin",
	"uri":["i59","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/components/Pagination.es *****/

"es/components/Pagination.es": function(module,require){
var Pagination=function Pagination(){
constructor.apply(this,arguments);
};
module.exports=Pagination;
var SkinComponent=require("es/components/SkinComponent.es");
var Skin=require("es/core/Skin.es");
var PaginationEvent=require("es/events/PaginationEvent.es");
var Display=require("es/core/Display.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var DataSource=require("system/DataSource.es");
var DataSourceEvent=require("system/DataSourceEvent.es");
var Locator=require("system/Locator.es");
var Reflect=require("system/Reflect.es");
var MouseEvent=require("system/MouseEvent.es");
var ReferenceError=require("system/ReferenceError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(componentId){
	Object.defineProperty(this,__PRIVATE__,{value:{"_dataSource":null,"_profile":'page',"_url":'',"_pageSize":NaN,"_current":NaN,"_link":7,"_radius":0}});

	if(componentId === undefined ){componentId="13";}
	if(!System.is(componentId, String))throw new TypeError("type does not match. must be String","es.components.Pagination",40);
	SkinComponent.call(this,componentId);
};
var __PRIVATE__=Symbol("es.components.Pagination").valueOf();
var method={};
var proto={"constructor":{"value":Pagination},"K60__dataSource":{"writable":true,"value":null,"type":8}
,"getDataSource":{"value":function dataSource(){
	return this[__PRIVATE__]._dataSource;
},"type":2},"setDataSource":{"value":function dataSource(value){
	if(!System.is(value, DataSource))throw new TypeError("type does not match. must be DataSource","es.components.Pagination",54);
	var self;
	var old=this[__PRIVATE__]._dataSource;
	if(old!==value){
		this[__PRIVATE__]._dataSource=value;
		self=this;
		value.addEventListener(DataSourceEvent.SELECT,function(e){
			if(!System.is(e, DataSourceEvent))throw new TypeError("type does not match. must be DataSourceEvent","es.components.Pagination",61);
			if(!e.waiting&&self.k30_getInitialized()){
				self.k30_commitPropertyAndUpdateSkin();
			}
		});
		if(this.k30_getInitialized()){
			value.select(this.getCurrent());
		}
	}
},"type":4},"K60__profile":{"writable":true,"value":'page',"type":8}
,"getProfile":{"value":function profile(){
	return this[__PRIVATE__]._profile;
},"type":2},"setProfile":{"value":function profile(value){
	if(!System.is(value, String))throw new TypeError("type does not match. must be String","es.components.Pagination",102);
	var curr;
	if(this[__PRIVATE__]._profile!==value){
		this[__PRIVATE__]._profile=value;
		if(this.k30_getInitialized()){
			curr=parseInt(Locator.query(value,1));
			this.setCurrent(System.isNaN(curr)?1:curr);
		}
	}
},"type":4},"K60__url":{"writable":true,"value":'',"type":8}
,"getUrl":{"value":function url(){
	return this[__PRIVATE__]._url;
},"type":2},"setUrl":{"value":function url(value){
	if(this[__PRIVATE__]._url!==value){
		this[__PRIVATE__]._url=value;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"getTotalPage":{"value":function totalPage(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.totalPage()||1;
	}
	return 1;
},"type":2},"getTotalSize":{"value":function totalSize(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.totalSize();
	}
	return NaN;
},"type":2},"K60__pageSize":{"writable":true,"value":NaN,"type":8}
,"getPageSize":{"value":function pageSize(){
	var dataSource=this.getDataSource();
	if(dataSource){
		return dataSource.pageSize();
	}
	return this[__PRIVATE__]._pageSize;
},"type":2},"setPageSize":{"value":function pageSize(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",194);
	var dataSource;
	if(this[__PRIVATE__]._pageSize!==num){
		this[__PRIVATE__]._pageSize=num;
		dataSource=this.getDataSource();
		if(dataSource){
			dataSource.pageSize(num);
			if(this.k30_getInitialized()){
				dataSource.select(this.getCurrent());
			}
		}
	}
},"type":4},"K60__current":{"writable":true,"value":NaN,"type":8}
,"getCurrent":{"value":function current(){
	var curr;
	var dataSource=this.getDataSource();
	if(System.isNaN(this[__PRIVATE__]._current)){
		curr=parseInt(Locator.query(this[__PRIVATE__]._profile,1));
		this[__PRIVATE__]._current=System.isNaN(curr)?1:curr;
	}
	if(dataSource&&this.k30_getInitialized()){
		return this.getDataSource().current();
	}
	return this[__PRIVATE__]._current;
},"type":2},"setCurrent":{"value":function current(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",239);
	var dataSource;
	var linkUrl;
	var createUrl;
	var profile;
	var event;
	num=Reflect.type(System.isNaN(this.getTotalSize())?num:Math.min(Math.max(1,num),this.getTotalPage()),Number);
	var current=this.getCurrent();
	if(num!==current){
		this[__PRIVATE__]._current=num;
		event=new PaginationEvent(PaginationEvent.CHANGE);
		event.setOldValue(current);
		event.setNewValue(num);
		profile=this.getProfile();
		createUrl=this.getUrl();
		if(System.typeOf(createUrl)!=="function"){
			linkUrl=this.getUrl();
			event.setUrl(Reflect.type((Reflect.get(Pagination,linkUrl,"length")>0?(Reflect.call(Pagination,linkUrl,"indexOf",['?'])>=0?linkUrl+'&'+profile+'='+num:linkUrl+'?'+profile+'='+num):('?'+this.getProfile()+'='+num)),String));
		}
		else {
			event.setUrl(Reflect.type(createUrl(num,profile),String));
		}
		if(this.dispatchEvent(event)){
			if(this.getAsync()){
				dataSource=this.getDataSource();
				if(dataSource)dataSource.select(num);
			}
		}
	}
},"type":4},"K60__link":{"writable":true,"value":7,"type":8}
,"getLink":{"value":function link(){
	return this[__PRIVATE__]._link;
},"type":2},"setLink":{"value":function link(num){
	if(!System.is(num, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",288);
	if(this[__PRIVATE__]._link!==num){
		this[__PRIVATE__]._link=num;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"getWheelTarget":{"value":function wheelTarget(){
	return Reflect.type(this.k30_pull("wheelTarget"),Display);
},"type":2},"setWheelTarget":{"value":function wheelTarget(value){
	if(!System.is(value, Display))throw new TypeError("type does not match. must be Display","es.components.Pagination",315);
	var self;
	var old=Reflect.type(this.k30_pull("wheelTarget"),Display);
	if(old!==value&&value){
		this.k30_push("wheelTarget",value);
		if(old){
			old.removeEventListener(MouseEvent.MOUSE_WHEEL);
		}
		self=this;
		value.addEventListener(MouseEvent.MOUSE_WHEEL,function(e){
			if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.components.Pagination",327);
			var page;
			e.preventDefault();
			if(self.getAsync()){
				page=self.getCurrent();
				page=Reflect.type(e.wheelDelta>0?page+1:page-1,Number);
				self.setCurrent(page);
			}
		},false,0,this);
	}
},"type":4},"K60__radius":{"writable":true,"value":0,"type":8}
,"getRadius":{"value":function radius(){
	return this[__PRIVATE__]._radius;
},"type":2},"setRadius":{"value":function radius(val){
	if(!System.is(val, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",340);
	if(this[__PRIVATE__]._radius!==val){
		this[__PRIVATE__]._radius=val;
		if(this.k30_getInitialized()){
			this.k30_commitPropertyAndUpdateSkin();
		}
	}
},"type":4},"k30_initializing":{"value":function initializing(){
	var size;
	var dataSource;
	SkinComponent.prototype.k30_initializing.call(this);
	if(this.isNeedCreateSkin()){
		dataSource=this[__PRIVATE__]._dataSource;
		if(!dataSource)throw new ReferenceError('dataSource is not defined',"es.components.Pagination","365:86");
		size=this.getPageSize();
		if(!System.isNaN(size))dataSource.pageSize(size);
		dataSource.select(this.getCurrent());
	}
},"type":1}
,"k30_commitPropertyAndUpdateSkin":{"value":function commitPropertyAndUpdateSkin(){
	var linkUrl;
	if(!this.k30_getInitialized())return ;
	var skin=this.getSkin();
	var current=this.getCurrent();
	var totalPage=this.getTotalPage();
	var pageSize=this.getPageSize();
	var link=this.getLink();
	var url=this.getUrl();
	var offset=Math.max(current-Math.ceil(link/2),0);
	if(System.typeOf(url)!=="function"){
		linkUrl=url;
		url=Reflect.get(Pagination,linkUrl,"length")>0?function(page,profile){
			if(!System.is(page, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",388);
			if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Pagination",388);
			return Reflect.call(Pagination,linkUrl,"indexOf",['?'])>=0?linkUrl+'&'+profile+'='+page:linkUrl+'?'+profile+'='+page;
		}:function(page,profile){
			if(!System.is(page, Number))throw new TypeError("type does not match. must be int","es.components.Pagination",390);
			if(!System.is(profile, String))throw new TypeError("type does not match. must be String","es.components.Pagination",390);
			return '?'+profile+'='+page;
		};
	}
	offset=(offset+link)>totalPage?offset-(offset+link-totalPage):offset;
	skin.assign('totalPage',totalPage);
	skin.assign('pageSize',pageSize);
	skin.assign('offset',(current-1)*pageSize);
	skin.assign('profile',this.getProfile());
	skin.assign('url',url);
	skin.assign('current',current);
	skin.assign('first',1);
	skin.assign('prev',Math.max(current-1,1));
	skin.assign('next',Math.min(current+1,totalPage));
	skin.assign('last',totalPage);
	skin.assign('link',System.range(Math.max(1+offset,1),link+offset,1));
	SkinComponent.prototype.k30_commitPropertyAndUpdateSkin.call(this);
},"type":1}
};
Pagination.prototype=Object.create( SkinComponent.prototype , proto);
Internal.defineClass("es/components/Pagination.es",Pagination,{
	"extends":SkinComponent,
	"package":"es.components",
	"classname":"Pagination",
	"uri":["K60","k30","Y31"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/events/PaginationEvent.es *****/

"es/events/PaginationEvent.es": function(module,require){
var PaginationEvent=function PaginationEvent(){
constructor.apply(this,arguments);
};
module.exports=PaginationEvent;
var Event=require("system/Event.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Symbol=require("system/Symbol.es");
var Object=require("system/Object.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(type,bubbles,cancelable){
	Object.defineProperty(this,__PRIVATE__,{value:{"newValue":null,"oldValue":null,"url":null}});

	if(cancelable === undefined ){cancelable=true;}
	if(bubbles === undefined ){bubbles=true;}
	if(!System.is(type, String))throw new TypeError("type does not match. must be String","es.events.PaginationEvent",16);
	if(!System.is(bubbles, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.PaginationEvent",16);
	if(!System.is(cancelable, Boolean))throw new TypeError("type does not match. must be Boolean","es.events.PaginationEvent",16);
	Event.call(this,type,bubbles,cancelable);
};
var __PRIVATE__=Symbol("es.events.PaginationEvent").valueOf();
var method={"CHANGE":{"value":'paginationChange',"type":16}
,"REFRESH":{"value":'paginationRefreshList',"type":16}
};
for(var prop in method){
	Object.defineProperty(PaginationEvent, prop, method[prop]);
}
var proto={"constructor":{"value":PaginationEvent},"getNewValue":{"value":function(){
	return this[__PRIVATE__].newValue;
},"type":2},"setNewValue":{"value":function(val){
	return this[__PRIVATE__].newValue=val;
},"type":2},"getOldValue":{"value":function(){
	return this[__PRIVATE__].oldValue;
},"type":2},"setOldValue":{"value":function(val){
	return this[__PRIVATE__].oldValue=val;
},"type":2},"getUrl":{"value":function(){
	return this[__PRIVATE__].url;
},"type":2},"setUrl":{"value":function(val){
	return this[__PRIVATE__].url=val;
},"type":2}};
PaginationEvent.prototype=Object.create( Event.prototype , proto);
Internal.defineClass("es/events/PaginationEvent.es",PaginationEvent,{
	"extends":null,
	"package":"es.events",
	"classname":"PaginationEvent",
	"uri":["F61","J62","a10"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

},

/***** Class es/skins/PaginationSkin.es *****/

"es/skins/PaginationSkin.es": function(module,require){
var PaginationSkin=function PaginationSkin(){
constructor.apply(this,arguments);
};
module.exports=PaginationSkin;
var Skin=require("es/core/Skin.es");
var Pagination=require("es/components/Pagination.es");
var System=require("system/System.es");
var TypeError=require("system/TypeError.es");
var Array=require("system/Array.es");
var Function=require("system/Function.es");
var Object=require("system/Object.es");
var MouseEvent=require("system/MouseEvent.es");
var Element=require("system/Element.es");
var Reflect=require("system/Reflect.es");
var Symbol=require("system/Symbol.es");
var Internal=require("system/Internal.es");
var constructor = function constructor(hostComponent){
	Object.defineProperty(this,__PRIVATE__,{value:{"properties":{},"_hostComponent":undefined}});

	if(hostComponent === undefined ){hostComponent=null;}
	if(hostComponent!==null && !System.is(hostComponent, Pagination))throw new TypeError("type does not match. must be Pagination","es.skins.PaginationSkin",15);
	this[__PRIVATE__]._hostComponent=hostComponent;
	Skin.call(this,"div");
	var attrs={"__var88__":{"class":"first"},"__var92__":{"class":"prev"},"__var97__":{"class":"next"},"__var100__":{"class":"last"},"__var101__":{"class":"pagination"}};
	this[__PRIVATE__].properties=attrs;
	this.attributes(this.getElement(),attrs.__var101__);
};
var __PRIVATE__=Symbol("es.skins.PaginationSkin").valueOf();
var method={};
var proto={"constructor":{"value":PaginationSkin},"d63_properties":{"writable":true,"value":{},"type":8}
,"d63__hostComponent":{"writable":true,"value":undefined,"type":8}
,"L15_getHostComponent":{"value":function hostComponent(){
	return this[__PRIVATE__]._hostComponent;
},"type":2},"L15_render":{"value":function render(){
	var dataset=this.getDataset();
	var url=dataset.url,
	first=dataset.first,
	prev=dataset.prev,
	next=dataset.next,
	last=dataset.last,
	profile=dataset.profile,
	current=dataset.current||1,
	link=dataset.link;
	var attrs=this[__PRIVATE__].properties;
	var __FOR0__=0;
	var __var89__=[];
	__var89__.push(this.L15_createElement(0,2,"li",[this.L15_createElement(0,3,"a","第一页",null,{"href":(url(first,profile))})],attrs.__var88__));
	__var89__.push(this.L15_createElement(0,4,"li",[this.L15_createElement(0,5,"a","上一页",null,{"href":(url(prev,profile)),"class":(current===1?"disabled":"")})],attrs.__var92__));
	Object.forEach(link,function(val,key){
		__var89__.push(this.L15_createElement(__FOR0__,6,"li",[this.L15_createElement(__FOR0__,7,"a",val,null,{"href":(url(val,profile))})],null,{"class":"link "+(val==current?'current':'')}));
		__FOR0__++;
	},this);
	__var89__.push(this.L15_createElement(0,8,"li",[this.L15_createElement(0,9,"a","下一页",null,{"href":(url(next,profile))})],attrs.__var97__));
	__var89__.push(this.L15_createElement(0,10,"li",[this.L15_createElement(0,11,"a","最后页",null,{"href":(url(last,profile))})],attrs.__var100__));
	return __var89__;
},"type":1}
,"L15_initializing":{"value":function initializing(){
	var host=this.L15_getHostComponent();
	var profile=new RegExp(host.getProfile()+'\\s*=\\s*(\\d+)');
	this.addEventListener(MouseEvent.CLICK,function(e){
		if(!System.is(e, MouseEvent))throw new TypeError("type does not match. must be MouseEvent","es.skins.PaginationSkin",45);
		var page;
		var _profile;
		var url;
		if(host.getAsync()&&Element.getNodeName(e.target)==='a'){
			e.preventDefault();
			url=Element(e.target).property('href');
			_profile=url.match(profile);
			page=System.parseInt(_profile?_profile[1]:0);
			if(page>0){
				host.setCurrent(Reflect.type(page,Number));
			}
		}
	});
},"type":1}
,"L15_updateDisplayList":{"value":function updateDisplayList(){
	Skin.prototype.L15_updateDisplayList.call(this);
	var hostComponent=this.L15_getHostComponent();
	var _radius=hostComponent.getRadius();
	if(_radius>0){
		Element('.link',this.getElement()).style('borderRadius',_radius+'px');
	}
},"type":1}
};
PaginationSkin.prototype=Object.create( Skin.prototype , proto);
Internal.defineClass("es/skins/PaginationSkin.es",PaginationSkin,{
	"extends":Skin,
	"package":"es.skins",
	"classname":"PaginationSkin",
	"uri":["d63","L15","J48"],
	"privateSymbol":__PRIVATE__,
	"method":method,
	"proto":proto
},1);

}}));