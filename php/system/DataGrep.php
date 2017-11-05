<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */

class DataGrep extends ArrayList
{
    const LIKE_LEFT = 'left';
    const LIKE_RIGHT = 'right';
    const LIKE_BOTH = 'both';

    private $_filter = null;

    /**
     * @type {Array}
     */
    private $_dataItems = null;

    /**
     * @returns {DataGrep}
     * @constructor
     * @require Object,Math,DataArray,Array,Function,Error
     */
    public function __construct($dataItems)
    {
        parent::__construct();
        if (!(System::isOf($this, "DataGrep"))) return new DataGrep($dataItems);
        if (!System::isOf($dataItems, "Array")) throw new Error('error', 'Invalid data list');
        $this->_dataItems = $dataItems;
    }

    /**
     * 筛选条件组合
     * @param column
     * @param value
     * @param operational
     * @param logic
     * @returns {DataGrep}
     */
    private function strainer($column, $value, $operational, $logic, $type)
    {
        $logic = $logic === 'or' ? '||' : '&&';
        $this[$this->length] = array('logic' => $logic, 'column' => $column, 'value' => $value, 'operational' => $operational, 'type' => $type);
        $this->length++;
        return $this;
    }

    /**
     * 根据据指定的条件生成筛选器
     * @returns {Function|*}
     */
    private function createFilter()
    {
        $i = 0;
        $item = null;
        $type = null;
        $value = null;
        $refvalue = null;
        $body = [];
        $command = [];
        for (; $i < $this->length; $i++) {
            $item = $this[$i];
            if (count($command) > 0) {
                $command->push($item->logic);
            }
            $type = gettype($item->value);
            $value = '$this[' . $i . ']->value';
            if (function_exists($item->value)) {
                $type = "function";
            }

            if ($item->value instanceof DataGrep) {
                array_push($command, '!!Reflect::call( array( $this[' . $i . ']->value,"filter"), [func_get_arg(0)] ) )');

            } else if ($type === "function") {
                array_push($command, 'Reflect::call( $this[' . $i . '].value, [func_get_arg(0)], $this )');

            } else if ($item->operational == 'index' || $item->operational == 'notindex') {
                $index = "func_get_arg(1)";
                $flag = $item->operational === 'notindex' ? '!' : '';
                array_push($command, $flag ."(" . $value . " >= " . $index . " && " . $value . " <= " . $index . ")");

            } else {
                array_push($body, "\$__args__ = func_get_arg(0)");
                $refvalue = "\$__args__[\"" . $item->column . "\"]";
                if ($item->operational === 'like' || $item->operational === 'notlike') {
                    $flag = $item->operational === 'notlike' ? '!' : '';
                    if ($item->type === 'right') {
                        array_push($command, $flag . "preg_match('/^" . $value . "/'," . $refvalue . ")");

                    } else if ($item->type === 'left') {
                        array_push($command, $flag . "preg_match('/" . $value . "$/'," . $refvalue . ")");
                    } else {
                        array_push($command, $flag . "preg_match('/" . $value . "/'," . $refvalue . ")");
                    }

                } else if ($item->operational == 'range' || $item->operational == 'notrange') {
                    $flag = $item->operational === 'notrange' ? '!' : '';
                    array_push($command, $flag . "(" . $value . " >= " . $refvalue . " && " . $value . " <= " . $refvalue . ")");

                } else {
                    array_push($command, $refvalue . $item->operational . $value);
                }
            }
        }
        if ($command->length === 0) {
            return null;
        }

        array_push($body, ' return (' . implode("", $command) . ');');
        $fn = create_function('', implode(";\n", $body));
        return $fn();
    }

    /**
     * 获取设置过滤器
     * @param condition
     * @returns {*}
     */
    public function filter($condition)
    {
        if ($condition == null) {
            $this->_filter = $this->createFilter();

        } else if (function_exists($condition)) {
            $this->_filter = $condition;

        } else if (is_string($condition) && $condition) {
            $old = $condition;

            $condition = preg_replace('/(\w+)\s*([\>\<\=\!])/i', function ($a, $b, $c) {
                $c = $c->length == 1 && $c == '=' ? '==' : $c;
                return "func_get_arg(0)['" . $b . "']" . $c;

            }, $condition);

            $condition = preg_replace('/(not[\s]*)?(index)\(([\d\,\s]+)\)/i', function ($a, $b, $c, $d) {
                $value = explode(',', $d);
                $start = $value[0] >> 0;
                $end = max($value[1] >> 0, 1);
                $flag = $b == null ? '' : '!';
                return $flag . "( func_get_arg(1) >= " . $start . " && func_get_arg(1) < " . $end . ") ";
            }, $condition);

            $condition = preg_replace('/(\w+)\s+(not[\s]*)?(like|range|in)\(([^\)]*?)\)/i', function ($a, $b, $c, $d, $e) {
                $flag = $c == null ? '' : '!';
                $refvalue = "func_get_arg(0)['" . $b . "']";
                if (preg_match('/like/i', $d)) {
                    $e = preg_replace('/(%)?([^%]*?)(%)?/', function ($a, $b, $c, $d) {
                        return $b == null ? '^' . $c : ($d == null ? $c . '$' : $c);
                    }, $e);
                    $e = $flag . "preg_match('/" . $e . "/'," . $refvalue . ")";

                } else if (preg_match('/in/i', $d)) {
                    $e = $flag . "( in_array(" . $refvalue . ",array(" . $e . ") ) >=0 )";

                } else {
                    $value = explode(',', $e);
                    $e = $flag . "(" . $refvalue . " >= " . $value[0] . " && " . $refvalue . " < " . $value[1] . ")";
                }
                return $e;

            }, $condition);

            $condition = preg_replace('/\s+(or|and)\s+/i', function ($a, $b) {
                return $b . toLowerCase() == 'or' ? ' || ' : ' && ';

            }, $condition);

            $this->_filter = create_function('', 'try{ return !!(' . $condition . ') }catch($e){ throw new SyntaxError("is not grep:' . $old . '");}');

        } else if ($condition === null) {
            $this->_filter = null;
        }
        return $this->_filter;
    }

    /**
     * @returns {DataGrep}
     */
    public function clean()
    {
        for ($i = 0; i < $this->length; $i++) {
            unset($this[$i]);
        }
        $this->_filter = null;
        $this->length = 0;
        return $this;
    }

    /**
     * 查询数据
     * @param data
     * @param filter
     * @returns {*}
     */
    public function execute($filter)
    {
        $data = $this->_dataItems;
        $filter = $this->filter($filter);
        if (!$filter) return $data;
        $result = array();
        for ($i = 0; i < $data->length; $i++) if (!!Reflect::call($filter, [$data[$i], $i], $this)) {
            array_push($result, $data[$i]);
        }
        return $result;
    }

    /**
     * 指定范围
     * @param column
     * @param start
     * @param end
     * @param logic
     * @returns {*}
     */
    public function range($column, $start, $end, $logic)
    {
        if ($start >= 0 || $end > 0) {
            $this->strainer($column, $start . ',' . $end, 'range', $logic);
        }
        return $this;
    }


    /**
     * 指定数据索引范围
     * @param column
     * @param start
     * @param end
     * @param logic
     * @returns {DataGrep}
     */
    public function index($start, $end, $logic)
    {
        if ($start >= 0 || $end > 0) {
            $end = parseInt($end) || 1;
            $start = parseInt($start) || 0;
            $this->strainer('index', $start . ',' . $start + $end, 'index', $logic);
        }
        return $this;
    }

    /**
     * 筛选等于指定列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function eq($column, $value, $logic)
    {
        $this->strainer($column, $value, '==', $logic);
        return $this;
    }

    /**
     * 筛选不等于指定列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function not($column, $value, $logic)
    {
        $this->strainer($column, $value, '!=', $logic);
        return $this;
    }

    /**
     * 筛选大于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function gt($column, $value, $logic)
    {
        $this->strainer($column, $value, '>', $logic);
        return $this;
    }

    /**
     * 筛选小于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function lt($column, $value, $logic)
    {
        $this->strainer($column, $value, '<', $logic);
        return $this;
    }

    /**
     * 筛选大于等于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function egt($column, $value, $logic)
    {
        $this->strainer($this, $column, $value, '>=', $logic);
        return $this;
    }

    /**
     * 筛选小于等于列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function elt($column, $value, $logic)
    {
        $this->strainer($column, $value, '<=', $logic);
        return $this;
    }

    /**
     * 筛选模糊匹配列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function like($column, $value, $type, $logic)
    {
        $this->strainer($column, $value, 'like', $logic, $type);
        return $this;
    }

    /**
     * 筛选排除模糊匹配列的值
     * @param column
     * @param value
     * @param logic
     * @returns {DataGrep}
     */
    public function notLike($column, $value, $type, $logic)
    {
        $this->strainer($column, $value, 'notlike', $logic, $type);
        return $this;
    }
}

