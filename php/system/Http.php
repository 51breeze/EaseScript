<?php
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
        'method'=>self::METHOD_GET,
        'type'=>self::TYPE_JSON,
        'contentType'=>self::DATA_X_WWW_FORM_URLENCODED,
        'accept'=>self::ACCEPT_HTML,
    );

    public function __construct( array $option =array() )
    {
        parent::__construct();
        $this->option = array_merge( $this->option,$option);
    }

    public function abort()
    {
    }

    public function load($url, $data=null, $method=self::METHOD_GET )
    {
        $request = new Request( $url );
        $fp = fsockopen( $request->host() , 80, $errno, $errstr, 30);
        stream_set_blocking($fp, 1);
        if( !$fp )
        {
            throw new Error( $errstr );
        }
        $out = $method.' / HTTP/1.1\r\n';
        $out .= 'Host: '.$request->host().'\r\n';
        $out .= 'Connection: Close\r\n\r\n';
        fwrite($fp, $out);
        $content = '';
        while( !feof($fp) )$content.=fgets($fp, 1024);
        fclose($fp);

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