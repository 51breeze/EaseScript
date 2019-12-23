/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Event,Object
 */

package es.events{

    public class DataSourceEvent extends Event
    {
        public static const APPEND:String = "dataSourceAppend";
        public static const REMOVE:String = "dataSourceRemove";
        public static const UPDATE:String = "dataSourceUpdate";
        public static const SELECT:String = "dataSourceSelect";
        public static const CHANGED:String = "dataSourceChanged";

        public var condition:*=null;
        public var index:int=NaN;
        public var data:Object=null;
        public var oldValue:*=null;
        public var newValue:*=null;
        public var current:int = NaN;
        public var offset:int = NaN;
        public var waiting:Boolean=false;
        public var totalSize:int=NaN;
        public var pageSize:int=NaN;

        public DataSourceEvent(type:String, bubbles:Boolean=true,cancelable:Boolean=true)
        {
            super(type, bubbles, cancelable);
        }
    }
}