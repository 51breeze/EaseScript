/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.events
{
    public class PaginationEvent extends Event
    {
        static public const CHANGE = 'paginationChange';
        static public const REFRESH = 'paginationRefreshList';
        public  var newValue=null;
        public  var oldValue=null;
        public function PaginationEvent(type, bubbles=true, cancelable=true)
        {
            super(type, bubbles, cancelable);
        };
    }
}

