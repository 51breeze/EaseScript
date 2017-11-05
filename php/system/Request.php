<?php

/**
 * URL constants as defined in the PHP Manual under "Constants usable with
 * http_build_url()".
 *
 * @see http://us2.php.net/manual/en/http.constants.php#http.constants.url
 */
if (!defined('HTTP_URL_REPLACE')) {
    define('HTTP_URL_REPLACE', 1);
}
if (!defined('HTTP_URL_JOIN_PATH')) {
    define('HTTP_URL_JOIN_PATH', 2);
}
if (!defined('HTTP_URL_JOIN_QUERY')) {
    define('HTTP_URL_JOIN_QUERY', 4);
}
if (!defined('HTTP_URL_STRIP_USER')) {
    define('HTTP_URL_STRIP_USER', 8);
}
if (!defined('HTTP_URL_STRIP_PASS')) {
    define('HTTP_URL_STRIP_PASS', 16);
}
if (!defined('HTTP_URL_STRIP_AUTH')) {
    define('HTTP_URL_STRIP_AUTH', 32);
}
if (!defined('HTTP_URL_STRIP_PORT')) {
    define('HTTP_URL_STRIP_PORT', 64);
}
if (!defined('HTTP_URL_STRIP_PATH')) {
    define('HTTP_URL_STRIP_PATH', 128);
}
if (!defined('HTTP_URL_STRIP_QUERY')) {
    define('HTTP_URL_STRIP_QUERY', 256);
}
if (!defined('HTTP_URL_STRIP_FRAGMENT')) {
    define('HTTP_URL_STRIP_FRAGMENT', 512);
}
if (!defined('HTTP_URL_STRIP_ALL')) {
    define('HTTP_URL_STRIP_ALL', 1024);
}

if (!function_exists('http_build_url')) {
    /**
     * Build a URL.
     *
     * The parts of the second URL will be merged into the first according to
     * the flags argument.
     *
     * @param mixed $url     (part(s) of) an URL in form of a string or
     *                       associative array like parse_url() returns
     * @param mixed $parts   same as the first argument
     * @param int   $flags   a bitmask of binary or'ed HTTP_URL constants;
     *                       HTTP_URL_REPLACE is the default
     * @param array $new_url if set, it will be filled with the parts of the
     *                       composed url like parse_url() would return
     * @return string
     */
    function http_build_url($url, $parts = array(), $flags = HTTP_URL_REPLACE, &$new_url = array())
    {
        is_array($url) || $url = parse_url($url);
        is_array($parts) || $parts = parse_url($parts);
        isset($url['query']) && is_string($url['query']) || $url['query'] = null;
        isset($parts['query']) && is_string($parts['query']) || $parts['query'] = null;
        $keys = array('user', 'pass', 'port', 'path', 'query', 'fragment');
        // HTTP_URL_STRIP_ALL and HTTP_URL_STRIP_AUTH cover several other flags.
        if ($flags & HTTP_URL_STRIP_ALL) {
            $flags |= HTTP_URL_STRIP_USER | HTTP_URL_STRIP_PASS
                | HTTP_URL_STRIP_PORT | HTTP_URL_STRIP_PATH
                | HTTP_URL_STRIP_QUERY | HTTP_URL_STRIP_FRAGMENT;
        } elseif ($flags & HTTP_URL_STRIP_AUTH) {
            $flags |= HTTP_URL_STRIP_USER | HTTP_URL_STRIP_PASS;
        }
        // Schema and host are alwasy replaced
        foreach (array('scheme', 'host') as $part) {
            if (isset($parts[$part])) {
                $url[$part] = $parts[$part];
            }
        }
        if ($flags & HTTP_URL_REPLACE) {
            foreach ($keys as $key) {
                if (isset($parts[$key])) {
                    $url[$key] = $parts[$key];
                }
            }
        } else {
            if (isset($parts['path']) && ($flags & HTTP_URL_JOIN_PATH)) {
                if (isset($url['path']) && substr($parts['path'], 0, 1) !== '/') {
                    // Workaround for trailing slashes
                    $url['path'] .= 'a';
                    $url['path'] = rtrim(
                            str_replace(basename($url['path']), '', $url['path']),
                            '/'
                        ) . '/' . ltrim($parts['path'], '/');
                } else {
                    $url['path'] = $parts['path'];
                }
            }
            if (isset($parts['query']) && ($flags & HTTP_URL_JOIN_QUERY)) {
                if (isset($url['query'])) {
                    parse_str($url['query'], $url_query);
                    parse_str($parts['query'], $parts_query);
                    $url['query'] = http_build_query(
                        array_replace_recursive(
                            $url_query,
                            $parts_query
                        )
                    );
                } else {
                    $url['query'] = $parts['query'];
                }
            }
        }
        if (isset($url['path']) && $url['path'] !== '' && substr($url['path'], 0, 1) !== '/') {
            $url['path'] = '/' . $url['path'];
        }
        foreach ($keys as $key) {
            $strip = 'HTTP_URL_STRIP_' . strtoupper($key);
            if ($flags & constant($strip)) {
                unset($url[$key]);
            }
        }
        $parsed_string = '';
        if (!empty($url['scheme'])) {
            $parsed_string .= $url['scheme'] . '://';
        }
        if (!empty($url['user'])) {
            $parsed_string .= $url['user'];
            if (isset($url['pass'])) {
                $parsed_string .= ':' . $url['pass'];
            }
            $parsed_string .= '@';
        }
        if (!empty($url['host'])) {
            $parsed_string .= $url['host'];
        }
        if (!empty($url['port'])) {
            $parsed_string .= ':' . $url['port'];
        }
        if (!empty($url['path'])) {
            $parsed_string .= $url['path'];
        }
        if (!empty($url['query'])) {
            $parsed_string .= '?' . $url['query'];
        }
        if (!empty($url['fragment'])) {
            $parsed_string .= '#' . $url['fragment'];
        }
        $new_url = $url;
        return $parsed_string;
    }
}


final class Request extends Object
{
    static public function isAjax()
    {
        return strcasecmp( $_SERVER['HTTP_X_REQUESTED_WITH'] , 'XMLHttpRequest' )===0;
    }

    /**
     * 判断当前是否使用了rewrite 重定向
     * @return boolean
     */
    static public function isRewrite()
    {
        return ( isset( $_SERVER['HTTP_X_REWRITE_URL'] ) || isset( $_SERVER['REDIRECT_URL'] ) );
    }

    /**
     * 获取当前请求的方法
     * @return string
     */
    static public function method()
    {
        return isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : null;
    }

    /**
     * 获取当前请求的URL地址
     * @return null|string
     */
    static public function url()
    {
        static $url=null;
        if( $url == null )
        {
            $url =  isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
            $url .= $_SERVER['SERVER_NAME'];
            if( isset($_SERVER['SERVER_PORT']) )$url.= $_SERVER['SERVER_PORT'];
            $url.= $_SERVER['REQUEST_URI'];
        }
        return $url;
    }

    /**
     * 返回一个URL组装的所有属性
     * @return mixed|null
     */
    static public function urlProperties()
    {
        static $body=null;
        if( $body == null )$body = parse_url( self::url() );
        return $body;
    }

    private $body=null;

    public function __construct( $url = null )
    {
        $properties = self::urlProperties();
        if( $url != null )
        {
            if( !is_string($url) )
            {
                throw new TypeError('url is not String');
            }
            $properties = array_merge($properties, parse_url($url) );
        }
        $this->body = (object)$properties;
    }

    public function __toString()
    {
        return $this->buildUrl();
    }

    public function buildUrl( $mode= HTTP_URL_STRIP_AUTH | HTTP_URL_JOIN_PATH | HTTP_URL_JOIN_QUERY | HTTP_URL_STRIP_FRAGMENT )
    {
        return http_build_url( self::url() , (array)$this->body, $mode );
    }

    public function uri()
    {
        return http_build_url( self::url() , (array)$this->body, HTTP_URL_JOIN_PATH | HTTP_URL_JOIN_QUERY | HTTP_URL_STRIP_FRAGMENT );
    }

    public function host( $value )
    {
        if( isset($value) )
        {
            $this->body->host = $value;
        }
        return $this->body->host;
    }

    public function scheme( $value )
    {
        if( isset($value) && is_string($value) )
        {
            $value = trim($value);
            if( !($value =='http' || $value=='https') )
            {
                throw new SyntaxError('Invalid scheme. be was http or https');
            }
            $this->body->scheme = $value;
        }
        return $this->body->scheme;
    }

    public function path($value)
    {
        if( isset($value) )
        {
            if( !is_string($value) )
            {
                $value = implode('/', (array)$value);
            }
            $this->body->path = $value;
        }
        return $this->body->path;
    }
    public function query($value)
    {
        if( isset($value) )
        {
            if( !is_string($value) )
            {
                $value = http_build_query( (array)$value );
            }
            $this->body->query = $value;
        }
        return $this->body->query;
    }

    public function port($value)
    {
        if( isset($value) )
        {
            if( !is_numeric($value) )throw new TypeError("port must is Number");
            $this->body->port = $value;
        }
        return $this->body->port;
    }

    public function pass($value)
    {
        if( isset($value) )
        {
            $this->body->pass = $value;
        }
        return $this->body->pass;
    }

    public function user( $value )
    {
        if( isset($value) )
        {
            $this->body->user = $value;
        }
        return $this->body->user;
    }

    public function fragment($value)
    {
        if( isset($value) )
        {
            $this->body->fragment = $value;
        }
        return $this->body->fragment;
    }
}

