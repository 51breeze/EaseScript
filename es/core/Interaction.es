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
     * @param dataset
     * @constructor
     */
    static public class Interaction
    {
        /**
         * 交互时所使用的KEY
         */
        static public var key:String="FJH9-H3EW-8WI0-YT2D";

       /**
        * 交互数据属性
        * @private
        */
       static public var dataset:Object={};

        /**
         * 是否有初始属性
         */
       static private var initialized:Boolean = false;

       /**
        * 从服务端拉取已经推送的属性
        * @param String key 实例对象的唯一键名
        */
       static public function pull(key:String):Object
       {
           when( RunPlatform(client) )
           {
               if( initialized=== false )
               {
                   initialized = true;
                   if( System.isObject(window[Interaction.key]) ){
                       Interaction.dataset = window[Interaction.key] as Object;
                   }
               }
           }
           return System.isDefined( Interaction.dataset[ key ] ) ? Interaction.dataset[ key ] : null;
       }

       /**
        * 将指定的数据推送到客户端
        * @param String key 实例对象的唯一键名
        * @param Object data 一组数据对象
        */
       static public function push(key:String, data:Object)
       {
           if( System.isDefined( Interaction.dataset[ key ] ) )
           {
               Interaction.dataset[ key ] = Object.merge( Interaction.dataset[ key ], data );
           }else {
               Interaction.dataset[ key ] = data;
           }
       }
   }
}