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
       static public function getProperties():Object
       {
            return properties;
       }

       /**
        * 从服务端拉取已经推送的属性
        * @param uniqueId 实例对象的唯一ID
        * @param name
        */
       static public function pull(uniqueId:*, name:String=null):*
       {
           if( !uniqueId || !(System.isString(uniqueId) || System.isNumber(uniqueId)) )
           {
               throw new TypeError("'uniqueId' param type must is String or Number and is not empty.");
           }
           var target:Object = properties[ uniqueId ];
           return name ? target[ name ] : target;
       }

       /**
        * 将指定的数据推送到客户端
        * @param uniqueId 实例对象的唯一ID
        * @param data 一组数据对象
        */
       static public function push( uniqueId:*, data:Object )
       {
           if( !uniqueId || !(System.isString(uniqueId) || System.isNumber(uniqueId)) )
           {
               throw new TypeError("'uniqueId' param type must is String or Number and is not empty.");
           }
           if( properties[ uniqueId ] )
           {
               properties[ uniqueId ] = Object.merge( properties[ uniqueId ], data );
           }else {
               properties[ uniqueId ] = data;
           }
       }
   }
}