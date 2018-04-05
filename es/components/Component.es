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
        private var _initialized=false;

        /**
         * 组件初始完成后调用
         * 此方法无需手动调用
         * @returns {boolean}
         */
        protected function initialized()
        {
            var val = this._initialized;
            if( val===false )
            {
                this._initialized=true;
                this.hasEventListener( ComponentEvent.INITIALIZED) && this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZED) );
            }
            return val;
        }


        /**
         * 组件初始化时调用
         * 此方法无需手动调用
         * @returns {Boolean}
         */
        protected function initializing()
        {
            var val = this._initialized===false;
            if( val===true && this.hasEventListener( ComponentEvent.INITIALIZING) )
            {
                this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZING));
            }
            return val;
        };
    }
}