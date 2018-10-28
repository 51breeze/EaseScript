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
         * 标记此组件是否完成初始过程
         */
        protected var initialized:Boolean = false;

        /**
         * 组件初始化时调用
         * 此方法由组件内部实现，无需手动调用
         * @returns {Boolean}
         */
        protected function initializing()
        {
            if( initialized===false )
            {
                initialized = true;
                if( this.hasEventListener( ComponentEvent.INITIALIZING ) )
                {
                    this.dispatchEvent(new ComponentEvent(ComponentEvent.INITIALIZING));
                }
            }
        };
    }
}