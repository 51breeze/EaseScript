<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Object,Array
 */
class DataArray extends ArrayList
{
    const DESC = 'desc';
    const ASC = 'asc';
    public function __construct()
    {
        parent::__construct( func_get_args() );
    }

    /**
     * 根据指定的列进行排序
     * @param column
     * @param type
     * @returns {DataArray}
     */
    public function orderBy($column, $type)
    {
        if ($column === DataArray::DESC || $column === DataArray::ASC || $column == null) {
            $this->sort(function ($a, $b) use ($column) {
                return $column === DataArray::DESC ? System::compare($b, $a) : System . compare($a, $b);
            });
            return $this;
        }
        $field = $column;
        $orderby = array("\$s=0;");
        if (!System::isObject(column)) {
            $field = array();
            $field[$column] = $type;
        }
        foreach ($field as $c => $val) {
            $type = DataArray::DESC === strtolower($field[$c]) ? DataArray::DESC : DataArray::ASC;
            array_push($orderby, $type === DataArray::DESC ? "\$cp(\$b['" + $c + "'],\$a['" + $c + "']):\$s;" : "\$cp(\$a['" + $c + "'],\$b['" + $c + "']):\$s;");
        }
        $orderby = implode("\$s=\$s==0?", $orderby);
        $orderby .= "return \$s;";
        $fn = create_function('$a,$b,$cp', $orderby);
        usort($this, function ($a, $b) use ($fn) {
            return $fn($a, $b, "strcasecmp");
        });
        return $this;
    }

    /**
     * 统计数组中所有值的和
     * @param function callback 回调函数，返回每个项的值。
     * @returns {number}
     * @public
     */
    public function sum($callback)
    {
        $result = 0;
        if (!is_callable($callback)) {
            $callback = function ($value) {
                return isNaN($value) ? 0 : $value >> 0;
            };
        }
        $index = 0;
        $len = $this->length;
        for (; $index < $len; $index++) {
            $result += $callback($this[$index]) >> 0;
        }
        return $result;
    }
}

