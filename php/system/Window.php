<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require EventDispatcher,Document
 */
class Window extends EventDispatcher
{
    /**
     * @var null
     */
    private static $window=null;

    /**
     * 获取Window的实例对象
     * @return Window|null
     * @throws Error
     */
    public static function __callStatic($name,$args)
    {
        switch ($name){
            case "window" :
                if (Window::$window === null)
                {
                    return new Window();
                }
                return Window::$window;
                break;
            case "document" :
                return Document::document();
                break;
        }
    }

    /**
     * @param $name
     * @return mixed|null
     */
    public function __get($name)
    {
          return Window::$name();
    }
}