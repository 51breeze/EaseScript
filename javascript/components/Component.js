/*
* BreezeJS Component class.
* version: 1.0 Beta
* Copyright © 2015 BreezeJS All rights reserved.
* Released under the MIT license
* https://github.com/51breeze/breezejs
*/

/**
 * 所有组件的基类
 * 组件的开发采用皮肤分离的设计方式，只有继承此组件的子类才会具有组件的特性。
 * 在引用皮肤或者更改皮肤时此组件会自动调度 skinInstalled / skinUninstall 所以这两个方法无需手动调手，只需在子类中覆写方可。
 * initialized 这个方法是组件内部操作，当文档准备就绪后并触发 Component.initialize() 并把所扩展的方法初始化完毕后组件会自动调用此方法无需手动调手，
 * 只需在子类中覆写方可。此方法的功用是当所有的扩展方法初始化完成后您可以在此方法中处理一些自己的业务逻辑以便达到更好的效果。
 * 注意：initialized 这个方法只会在HTML标记为组件并触发了 Component.initialize() 下才会调用，否则组件不会调用。
 * @require Object,EventDispatcher,TypeError,ComponentEvent,Symbol,Reflect
 * @returns {Component}
 */

var _symb = Symbol('component');
function Component()
{
    EventDispatcher.call(this);
    this[ _symb ]={
        'initialized':false,
        'initializing':false,
        'hostComponent':null
    };

    //将组件应用在其它组件中时会触发此事件
    //触发此事件的组件为宿主组件
    Reflect.apply( Reflect.get(this,'addEventListener'), this , [ComponentEvent.INSTALLING,function (e) {
        Reflect.apply( Reflect.get(this,"hostComponent"), this, [e.hostComponent] );
    }]);
}

Component.toString = function toString()
{
    return "[class Component]";
}
Component.valueOf = function valueOf()
{
    return "[class Component]";
}

Component.prototype= Object.create(EventDispatcher.prototype);
Component.prototype.constructor=Component;

/**
 * 组件初始完成
 * @returns {boolean}
 */
Component.prototype.initialized=function initialized()
{
    var data = this[ _symb ];
    var ret = data.initialized;
    if( ret===false )
    {
        data.initialized=true;
        Reflect.apply( Reflect.get(this,'dispatchEvent'), this, [new ComponentEvent( ComponentEvent.INITIALIZED )] );
    }
    return ret;
};

/**
 * 组件初始化进行中
 * @returns {Component}
 */
Component.prototype.initializing=function initializing()
{
    return !data.initialized;
};

/**
 * 宿主组件
 * @param host
 * @returns {*}
 */
Component.prototype.hostComponent=function hostComponent( host )
{
    var data = this[ _symb ];
    if( host )
    {
        if( !System.is(host , Component) )
        {
            throw new TypeError('"host" is not Component');
        }
        data.hostComponent=host;
    }
    return data.hostComponent;
};

System.Component = Component;