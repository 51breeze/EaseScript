/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.SkinComponent;

    /**
     * 服务端与客户的交互类
     * 此类用来把服务端的指定属性推送到前端，前端用此类来拉取服务端推送的属性。
     * @param properties
     * @constructor
     */
    public class Storage
    {
        /**
        * 全局的KEY
        */
        static public var key:String="FJH9-H3EW-8WI0-YT2D";

        /**
        * 所有数据集
        * @private
        */
        static private var storates:Array=[];

        /**
        * 获取所有数据集
        * @returns {Object}
        */
        static public function dataset():Object
        {
            var data:Object={};
            Storage.storates.forEach( (storage:Storage)=>{

                var target:Object = {};
                data[ storage.key ] = target;
                Object.forEach( storage.dataset, (value:*,key:String)=>{
                    if( typeof value !=="object" ){
                        target[ key ] = value;
                    }else if( System.isObject(value) || System.isArray(value) )
                    {
                        target[ key ] = value;
                    }
                });
                
            });
            return data;
        }

        static public function load( key:String ):Object
        {
            when( RunPlatform(client) )
            {
                return window[Storage.key][ key ] || {};
            }then
            {
                return {};
            }
        }


        /**
        * @private
        */
        private var _dataset:Object = null;

        private var _component:SkinComponent = null;

        public Storage( skinComponent:SkinComponent )
        {
            this._component = skinComponent;
            Storage.storates.push( this );
        }

        private get key():String
        {
            return this._component.getComponentId();
        }

        public get dataset():Object
        {
            if( this._dataset === null )
            {
                this._dataset = Storage.load(  this.key );
            }
            return this._dataset;
        }

        public push( name:String, value:*):void
        {
            this.dataset[ name ] = value;
        }

        public pull(name:String, value:*=null):*
        {
            return this.dataset[ name ] || value;
        }
   }
}