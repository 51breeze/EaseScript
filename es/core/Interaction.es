/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    /**
     * 服务端与客户的交互类
     * 此类用来把服务端的指定属性推送到前端，前端用此类来拉取服务端推送的属性。
     * @param properties
     * @constructor
     */
    static public class Interaction
    {
       /**
        * 交互数据属性
        * @private
        */
       static private var properties:Object={};

        /**
         * 获取所有的交互属性
         * @returns {Object}
         */
       static public function getProperties():Object
       {
            return properties;
       }

       /**
        * 从服务端拉取已经推送的属性
        * @param String key 实例对象的唯一键名
        */
       static public function pull(key:String):Object
       {
           return System.isDefined( properties[ key ] ) ? properties[ key ] : null;
       }

       /**
        * 将指定的数据推送到客户端
        * @param String key 实例对象的唯一键名
        * @param Object data 一组数据对象
        */
       static public function push(key:String, data:Object)
       {
           if( System.isDefined( properties[ key ] ) )
           {
               properties[ key ] = Object.merge( properties[ key ], data );
           }else {
               properties[ key ] = data;
           }
       }
   }
}