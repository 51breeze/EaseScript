/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.components
{
    import es.events.ComponentEvent;
    public class Component extends EventDispatcher
    {
        public function Component()
        {
            super();
        }

        /**
         * @private
         */
        private var __initialized__=false;

        /**
         * 组件初始完成
         * @returns {boolean}
         */
        protected function initialized()
        {
            var val = this.__initialized__;
            if( val===false )
            {
                this.__initialized__=true;
                if( this.hasEventListener( ComponentEvent.INITIALIZED) )
                {
                    this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZED));
                }
            }
            return val;
        }

        /**
         * @private
         */
        private var __initializing__=true;

        /**
         * 组件初始化进行中
         * @returns {Boolean}
         */
        protected function initializing()
        {
            var val = this.__initializing__;
            if( val===true )
            {
                this.__initializing__=false;
                if( this.hasEventListener( ComponentEvent.INITIALIZING) )
                {
                    this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZING));
                }
            }
            return val;
        };
    }
}