<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,Symbol,Array,DataArray,Object,EventDispatcher,Http,HttpEvent,PropertyEvent,DataSourceEvent,DataGrep
 */
class DataSource extends EventDispatcher
{

    private $_options = array(
        'method' => Http::METHOD_GET,
        'dataType' => Http::TYPE_JSON,
        'timeout' => 30,
        'param' => array(),
        'url' => null,
        //服务器响应后的json对象
        'responseProfile' => array(
            'data' => 'data',     //数据集
            'total' => 'total',   //数据总数
            'code' => 'code',    //状态码
            'error' => 'error',  //错误消息
            "successCode" => 0  //成功时的状态码
        ),
        //向服务器请求时需要添加的参数
        'requestProfile' => array(
            'offset' => 'offset', //数据偏移量
            'rows' => 'rows' //每次获取取多少行数据
        )
    );

    private $_grep = null;
    private $_totalSize = NaN;
    private $_buffer = 3;
    private $_current = 1;
    private $_pageSize = 1;
    private $_loadCompleted = false;
    private $_loading = false;
    private $_nowNotify = false;
    private $_cached = array(
        'queues' => array(),
        'lastSegments' => null,
        "loadSegments" => array()
    );
    private $_items = array();
    private $_source = null;
    private $_isRemote = false;

    public function __construct(array $options = array())
    {
        parent::__construct();
        $this->_options = array_merge($this->_options, $options);
    }


    /**
     * 是否为一个远程数据源
     * @returns {boolean}
     */
    public function isRemote()
    {
        return $this->_isRemote;
    }

    /**
     * 获取或者设置数据选项
     * @param object options
     * @returns {*}
     */
    public function options($opt = null)
    {
        if (!is_null($opt)) {
            $this->_options = array_merge($this->_options, $opt);
        }
        return $this;
    }


    /**
     * 设置获取数据源
     * 允许是一个数据数组或者是一个远程请求源
     * @param Array source | String url | Http httpObject
     * @returns {DataSource}
     */
    public function source($resource = null)
    {
        $old_source = $this->_source;
        if ($old_source === $resource) return $this;
        $options = (object)$this->_options;
        if ($resource == null) {
            return $this->_isRemote ? $options->url : $old_source;
        }

        //本地数据源数组
        if (is_array($resource)) {
            $this->_items = array_slice($resource, 0);
            $this->_source = $resource;
            $this->_isRemote = false;
        } //远程数据源
        else if ($resource) {
            if (is_string($resource)) {
                $options->url = $resource;
                $resource = new Http($options);
            }
            if ($resource instanceof Http) {
                $this->_source = $resource;
                $this->_isRemote = true;
                //请求远程数据源侦听器
                $resource->addEventListener(HttpEvent::SUCCESS, success, false, 0, $this);
            }
        }

        //清空数据源
        if ($resource === null) {
            $cached = (object)$this->_cached;
            array_splice($this->_items, 0, count($this->_items));
            $cached->lastSegments = null;
            $cached->loadSegments = array();
            $cached->queues = array();
            $this->_nowNotify = false;
            $this->_loadCompleted = false;
            return $this;
        }

        $source = $this->_source;

        //移除加载远程数据侦听事件
        if (!$this->_isRemote && System::is($source, "Http")) {
            $source->removeEventListener(HttpEvent::SUCCESS, success);
        }
        return $this;
    }

    /**
     * 每页需要显示数据的行数
     * @param number rows
     * @returns {DataSource}
     */
    public function pageSize($size)
    {
        $old = $this->_pageSize;
        if ($size >= 0 && $old !== $size) {
            $this->_pageSize = $size;
            $event = new PropertyEvent(PropertyEvent::CHANGE);
            $event->property = 'pageSize';
            $event->newValue = $size;
            $event->oldValue = $old;
            $this->dispatchEvent($event);
            if ($this->selected) {
                $cached = $this->_cached;
                array_splice($this->_items, 0, count($this->_items));
                $cached->lastSegments = null;
                $cached->loadSegments = array();
                $cached->queues = array();
                $this->_nowNotify = false;
                $this->_loadCompleted = false;
                $this->select();
            }
            return $this;
        }
        return $old;
    }

    /**
     * 获取当前分页数
     * @param num
     * @returns {*}
     */
    public function current()
    {
        return $this->_current;
    }

    /**
     * 获取总分页数。
     * 如果是一个远程数据源需要等到请求响应后才能得到正确的结果,否则返回 NaN
     * @return number
     */
    public function totalPage()
    {
        return $this->totalSize() > 0 ? max(ceil($this->totalSize() / $this->pageSize()), 1) : NaN;
    }

    /**
     * 最大缓冲几个分页数据。有效值为1-10
     * @param Number num
     * @returns {DataSource}
     */
    public function maxBuffer($num)
    {
        if ($num > 0) {
            $this->_buffer = min(10, $num);
            return $this;
        }
        return $this->_buffer;
    }

    /**
     * 获取实际数据源的总数
     * 如果是一个远程数据源，每请求成功后都会更新这个值。
     * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 总数 )do load...
     * @param number num
     * @returns {DataSource}
     */
    public function realSize()
    {
        return count($this->_items);
    }

    /**
     * @private
     */
    private $__totalSize__ = 0;

    /**
     * 预计数据源的总数
     * 如果是一个远程数据源，每请求成功后都会更新这个值。
     * 是否需要向远程数据源加载数据这个值非常关键。 if( 分段数 * 行数 < 预计总数 )do load...
     * @param number num
     * @returns {DataSource}
     */
    public function totalSize()
    {
        return max($this->_totalSize, $this->realSize());
    }

    /**
     * 获取数据检索对象
     * @returns {*|DataGrep}
     */
    public function grep()
    {
        if ($this->_grep == null) {
            $this->_grep = new DataGrep($this->_items);
        }
        return $this->_grep;
    }

    /**
     * 设置筛选数据的条件
     * @param condition
     * @returns {DataSource}
     */
    public function filter($condition)
    {
        if (is_string($condition)) {
            $this->grep()->filter($condition);
        }
        return $this;
    }

    /**
     * 对数据进行排序。
     * 只有数据源全部加载完成的情况下调用此方法才有效（本地数据源除外）。
     * @param column 数据字段
     * @param type   排序类型
     */
    public function orderBy($column, $type = DataArray::ASC)
    {
        if ($this->order == null) {

            $this->order = array();
        }
        $orderObject = $this->order;
        if ($column == null) {
            return $orderObject;
        }

        if (System::isObject($column)) {
            $orderObject = $this->order = $column;

        } else if (is_string($column)) {
            $orderObject[$column] = $type;
        }
        $data = new DataArray($this->_items);
        $this->_items = $data->orderBy($orderObject);
        return $this;
    }

    /**
     * 当前页的索引值在当前数据源的位置
     * @param index 位于当前页的索引值
     * @returns {number}
     */
    public function offsetAt($index)
    {
        $index = $index >> 0;
        if (isNaN($index)) return $index;
        return ($this->current() - 1) * $this->pageSize() + $index;
    }

    /**
     * 添加数据项到指定的索引位置
     * @param item
     * @param index
     * @returns {DataSource}
     */
    public function append($item, $index)
    {
        $index = is_numeric($index) ? $index : $this->realSize();
        $index = $index < 0 ? $index + $this->realSize() + 1 : $index;
        $index = min($this->realSize(), max($index, 0));
        $item = is_array($item) ? $item : array($item);
        $e = null;
        $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $e = new DataSourceEvent(DataSourceEvent::CHANGED);
            $e->index = $index + $i;
            $e->newValue = $item[$i];
            if ($this->dispatchEvent($e)) {
                array_splice($this->_items, $index + $i, 0, $item[$i]);
            }
        }
        $e = new DataSourceEvent(DataSourceEvent::APPEND);
        $e->index = $index;
        $e->data = $item;
        $this->dispatchEvent($e);
        return count($item);
    }

    /**
     * 移除指定索引下的数据项
     * @param condition
     * @returns {boolean}
     */
    public function remove($condition)
    {
        $result = $this->grep()->execute($condition);
        $e = null;
        $data = array();
        $len = count($result);
        for ($i = 0; $i < $len; $i++) {
            $index = array_search($result[$i], $result, true);
            if ($index >= 0) {
                $e = new DataSourceEvent(DataSourceEvent::CHANGED);
                $e->index = $index;
                $e->oldValue = $result[$i];
                if ($this->dispatchEvent($e)) {
                    $item = array_splice($this->_items, $index, 1);
                    array_push($data, $item);
                }
            }
        }
        if (count($data) > 0) {
            $e = new DataSourceEvent(DataSourceEvent::REMOVE);
            $e->condition = $condition;
            $e->data = data;
            $this->dispatchEvent(e);
        }
        return count($data);
    }

    /**
     * 修改数据
     * @param value 数据列对象 {'column':'newValue'}
     * @param condition
     * @returns {boolean}
     */
    public function update($value, $condition)
    {
        $result = $this->grep()->execute($condition);
        $data = [];
        $flag = false;
        $e = null;
        $len = count($result);
        for ($i = 0; $i < $len; $i++) {
            $flag = false;
            $newValue = array_merge(array(), (array)$result[$i]);
            foreach ($value as $c => $val) {
                if (isset($newValue[$c]) && $newValue[$c] != $value[$c]) {
                    $newValue[$c] = $value[$c];
                    $flag = true;
                }
            }
            if ($flag) {
                $e = new DataSourceEvent(DataSourceEvent::CHANGED);
                $e->newValue = $newValue;
                $e->oldValue = $result[$i];
                if ($this->dispatchEvent($e)) {
                    $result[$i] = array_merge((array)$result[$i], $newValue);
                    array_push($data, $result[$i]);
                }
            }
        }
        $e = new DataSourceEvent(DataSourceEvent::UPDATE);
        $e->data = $result[$i];
        $e->condition = $condition;
        $e->newValue = $value;
        $this->dispatchEvent($e);
        return count($data);
    }

    /**
     * 获取指定索引的元素
     * @param index
     * @returns {*}
     */
    public function itemByIndex($index)
    {
        if (!is_numeric($index) || $index < 0 || $index >= $this->realSize()) return null;
        return isset($this->_items[$index]) ? $this->_items[$index] : null;
    }

    /**
     * 获取指定元素的索引
     * 如果不存在则返回 -1
     * @param item
     * @returns {Object}
     */
    public function indexByItem($item)
    {
        return array_search($item, $this->_items);
    }

    /**
     * 获取指定索引范围的元素
     * @param start 开始索引
     * @param end   结束索引
     * @returns {Array}
     */
    public function range($start, $end)
    {
        return array_slice($this->_items, $start, $end);
    }

    /**
     * 选择数据集
     * @param Number segments 选择数据的段数, 默认是1
     * @returns {DataSource}
     */
    public function select($page)
    {
        $total = $this->totalPage();
        $page = $page > 0 ? $page : $this->current();
        $page = min($page, isNaN($total) ? $page : $total);
        $this->_current = $page;
        $rows = $this->pageSize();
        $start = ($page - 1) * rows;
        $cached = (object)$this->_cached;
        $loadCompleted = $this->_loadCompleted;
        $isRemote = $this->_isRemote;
        $items = $this->_items;
        $index = !$loadCompleted && $isRemote ? array_search($page, $cached->loadSegments) : $page - 1;
        $waiting = $index < 0 || (count($items) < ($index * $rows + $rows));

        //数据准备好后需要立即通知
        $this->_nowNotify = true;
        $this->selected = true;

        //需要等待加载数据
        if ($isRemote && $waiting && !$loadCompleted) {
            $event = new DataSourceEvent(DataSourceEvent::SELECT);
            $event->current = $page;
            $event->offset = $start;
            $event->data = null;
            $event->waiting = true;
            $this->dispatchEvent($event);

        } else {
            $this->nowNotify($page, $index * $rows, $rows);
        }
        //加载数据
        if ($isRemote) {
            $this->doload();
        }
        return $this;
    }


    /**
     * @private
     * 数据加载成功时的回调
     * @param event
     */
    private function success($event)
    {
        $options = (object)$this->_options;
        $totalProfile = $options->responseProfile->total;
        $dataProfile = $options->responseProfile->data;
        $stateProfile = $options->responseProfile->code;
        if ($event->data[$stateProfile] != $options->responseProfile->successCode) {
            throw new Error('Loading data failed '.$event->data[$options->responseProfile->error]);
        }
        $data = $event->data;
        $total = 0;
        if (!is_array($data)) {
            if (($dataProfile && !isset($data[$dataProfile])) || ($totalProfile && !isset($data[totalProfile]))) {
                throw new Error('Response data profile fields is not correct.');
            }
            $total = $totalProfile ? $data[$totalProfile] >> 0 : 0;
            $data = $data[$dataProfile];
            if ($total === 0) $total = count($data) >> 0;

        } else {
            $total = count($data) >> 0;
        }

        //必须是返回一个数组
        if (!is_array($data)) throw new Error('Response data set must be an array');

        //当前获取到数据的长度
        $len = count($data) >> 0;
        $total = max($total, $len);

        //先标记为没有数据可加载了
        $this->_loadCompleted = true;

        //标没有在加载
        $this->_loading = false;

        //预计总数据量
        $this->_totalSize = $total;
        $rows = $this->pageSize();
        $cached = (object)$this->_cached;
        $current = $this->current();

        //当前加载分页数的偏移量
        $offset = intval(array_search($cached->lastSegments, $cached->loadSegments)) * $rows;

        //合并数据项
        call_user_func_array('array_splice', array(&$this->_items, $offset, 0) + (array)$data);

        //发送数据
        if ($this->_nowNotify && array_search($cached->loadSegments, $current) >= 0) {
            $this->nowNotify($current, $offset, $rows);
        }
        //还有数据需要加载
        if (count($this->_items) < $total) {
            $this->_loadCompleted = false;

            //继续载数据
            $this->doload();
        }

    }

    private function isload($cached, $page)
    {
        $cached = (object)$cached;
        return $cached->lastSegments != $page && array_search($page, $cached->loadSegments) < 0 && array_search($page, $cached->queues) < 0;
    }

    /**
     * 向远程服务器开始加载数据
     */
    private function doload()
    {
        $loading = $this->_loading;
        $isRemote = $this->_isRemote;
        $loadCompleted = $this->_loadCompleted;
        if (!$isRemote || $loadCompleted) return;
        $page = $this->current();
        $cached = (object)$this->_cached;
        $queue = &$cached->queues;
        $rows = $this->pageSize();
        $buffer = $this->maxBuffer();
        if ($this->isload($cached, $page)) {
            array_unshift($queue, $page);

        } else if (count($queue) === 0) {
            $p = 1;
            $t = $this->totalPage();
            while ($buffer > $p) {
                $next = $page + $p;
                $prev = $page - $p;
                if ($next <= $t && $this->isload($cached, $next)) {
                    array_push($queue, $next);
                }
                if ($prev > 0 && $this->isload($cached, $prev)) {
                    array_push($queue, $prev);
                }
                $p++;
            }
        }

        if (!$loading && count($queue) > 0) {
            $this->_loading = true;
            $page = array_shift($queue);
            $cached->lastSegments = $page;
            array_push($cached->loadSegments, $page);
            if (count($cached->loadSegments) > 1) {
                usort($cached->loadSegments, function ($a, $b) {
                    return $a - $b;
                });
            }
            $start = ($page - 1) * $rows;
            $source = $this->_source;
            $options = (object)$this->_options;
            $param = array_merge(array(), $options->param);
            $param[$options->requestProfile->offset] = $start;
            $param[$options->requestProfile->rows] = $rows;
            $source->load($options->url, $param, $options->method);
        }
    }

    /**
     * 发送数据通知
     * @private
     */
    private function nowNotify($current, $start, $rows)
    {
        if ($this->_nowNotify !== true) return;
        $result = $this->grep()->execute();
        $end = min($start + $rows, $this->realSize());
        $data = array_slice($result, $start, $end);
        $event = new DataSourceEvent(DataSourceEvent::SELECT);
        $event->current = $current;
        $event->offset = $start;
        $event->data = $data;
        $event->waiting = false;
        $event->pageSize = $this->pageSize();
        $event->totalPage = $this->totalPage();
        $event->totalSize = $this->totalSize();
        $this->_nowNotify = false;
        $this->dispatchEvent($event);
    }
}