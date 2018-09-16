<?php
/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,BaseObject,HttpEvent,Request,EventDispatcher
 */

class Http extends EventDispatcher
{
    /**
     * Difine constan Http accept type
     */
    const ACCEPT_XML  ="application/xml,text/xml";
    const ACCEPT_HTML = "text/html";
    const ACCEPT_TEXT = "text/plain";
    const ACCEPT_JSON ="application/json, text/javascript";
    const ACCEPT_ALL  ="*/*";

    /**
     * Difine constan Http contentType data
     */
    const DATA_X_WWW_FORM_URLENCODED= "application/x-www-form-urlencoded";
    const DATA_FORM_DATA="multipart/form-data";
    const DATA_PLAIN= "text/plain";
    const DATA_JSON= "application/json";

    /**
     * Difine constan Http dataType format
     */
    const TYPE_HTML='html';
    const TYPE_XML='xml';
    const TYPE_JSON='json';
    const TYPE_JSONP='jsonp';

    /**
     * Difine Http method
     */
    const METHOD_GET='GET';
    const METHOD_POST= 'POST';
    const METHOD_PUT= 'PUT';

    private $option = array(
        'method'=>Http::METHOD_GET,
        'type'=>Http::TYPE_JSON,
        'contentType'=>Http::DATA_X_WWW_FORM_URLENCODED,
        'accept'=>Http::ACCEPT_HTML,
    );

    public function __construct( $option =array() )
    {
        parent::__construct();
        $this->option = (object)array_merge( $this->option,(array)$option );
    }

    public function abort()
    {
    }

    public function load($url, $data=null, $method=Http::METHOD_GET )
    {
        $request = new Request( $url );
        $fp = fsockopen( $request->host() , $request->port() , $errno, $errstr,5);
        if( !$fp )
        {
            throw new Error( $errstr );
        }

        $param = "";
        if( $data )
        {
            $data = (array)$data;
            if( $method === Http::METHOD_GET )
            {
                $request->query($data);

            }else{
                switch ( $this->option->contentType )
                {
                    case Http::DATA_JSON :
                        $param = json_encode( $data );
                        break;
                    default :
                        $param = http_build_query( $data );
                }
            }
        }

        $out = $method." ".$request->uri()." HTTP/1.1\r\n";
        $out .= "Host: ".$request->host()."\r\n";
        $out .= "Content-Type: ".$this->option->contentType."\r\n";
        $out .= "Content-Length: ".strlen($param)."\r\n";
        $out .= "Connection: Close\r\n\r\n";
        $out .= $param;

        stream_set_blocking($fp, 1 );
        stream_set_timeout($fp, 5);
        fwrite($fp, $out);
        
        $content = '';
        $len = 0;
        while( !feof($fp) ){
            $ret = fgets($fp, 1024);
            if( $ret )
            {
                if( $len===0 && substr($ret,0,15) === 'Content-Length:' )
                {
                    $len = intval( trim(substr($ret,16)) );
                }
                $content.=$ret;
            }
        }

        if( !empty($content) && $len>0 )
        {
           $content = substr($content, -$len);
        }
        fclose($fp);
        $event = null;
        if( !empty($content)  )
        {
            $len = strlen( $content );
            $content = json_decode($content, true);
            $event = new HttpEvent(HttpEvent::SUCCESS);
            $event->data = $content;
            $event->total = $len;
            $event->loaded = $len;

        }else
        {
            $event = new HttpEvent(HttpEvent::ERROR );
            $event->data = array();
        }
        $event->url = $url;
        $this->dispatchEvent( $event );
    }

    /**
     * 设置Http请求头信息
     * @param name
     * @param value
     * @returns {Http}
     */
    function setRequestHeader($name, $value)
    {

    }

    /**
     * 获取已经响应的头信息
     * @param name
     * @returns {null}
     */
    function getResponseHeader($name)
    {

    }
}