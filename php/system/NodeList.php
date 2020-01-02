<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,BaseObject,ReferenceError,TypeError,ArrayList
 */
class NodeList extends ArrayList 
{
    public function item( $index )
    {
        return $this[$index] ?? null;
    }
}