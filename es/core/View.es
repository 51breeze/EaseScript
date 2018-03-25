/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Skin;

    public class View extends Skin
    {
        public static const CHARSET_GB2312 = 'GB2312';
        public static const CHARSET_GBK    = 'GBK';
        public static const CHARSET_UTF8   = 'UTF-8';

        /**
         * 视图类
         * @constructor
         */
        function View(skinObject:Object={})
        {
            super(  skinObject  );
        }
    }
}


