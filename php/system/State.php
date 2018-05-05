<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,TypeError,ReferenceError
 */
class State extends Object
{
    private $_name = null;
    private $_stateGroup = null;

    public function __construct($name)
    {
        $this->_name = $name;
    }

    public function name($value)
    {
        if ($value == null) return $this->_name;
        if (!is_string($value)) {
            throw new TypeError('Invalid param in name');
        }
        $this->_name = value;
    }

    public function stateGroup($value)
    {
        if ($value == null) return $this->_stateGroup;
        if (!is_array($value)) {
            throw new TypeError('Invalid param in stateGroup');
        }
        $this->_stateGroup = value;
    }

    public function includeIn( $value )
    {
        return $value === $this->_name || in_array($value, $this->_stateGroup );
    }
}