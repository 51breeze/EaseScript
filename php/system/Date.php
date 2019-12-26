<?php
/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,ReferenceError,TypeError
 */
class Date
{
    private $dateString=null;
    private $dateUTCString=null;
    private $milliseconds="000";

    private $year=null;
    private $month=null;
    private $day=null;
    private $hours=null;
    private $minutes=null;
    private $seconds=null;

    private $yearUTC=null;
    private $monthUTC=null;
    private $dayUTC=null;
    private $hoursUTC=null;
    private $minutesUTC=null;
    private $secondsUTC=null;


    public function __construct( $year=null, $month=null , $day=null , $hours=null , $minutes=null ,$seconds=null , $milliseconds=null )
    {
        if( $year && is_string( $year ) )
        {
            $this->dateString = $year;
            $info = getdate( strtotime($year) );
            $this->year   = $info['year'];
            $this->month  = $info['mon'];
            $this->day    = $info['mday'];
            $this->hours  = $info['hours'];
            $this->minutes= $info['minutes'];
            $this->seconds= $info['seconds'];

        } else if( $year && is_numeric( $year ) && $year > 9999999 )
        {
            $sec =  $year / 1000;
            $ms =  $year - $sec;
            if( $ms > 0 )
            {
                 $milliseconds =$ms."";
                 $year = $sec;
            }
            $this->dateString = date("Y-m-d H:i:s", $year);

            $info = getdate( $year );
            $this->year   = $info['year'];
            $this->month  = $info['mon'];
            $this->day    = $info['mday'];
            $this->hours  = $info['hours'];
            $this->minutes= $info['minutes'];
            $this->seconds= $info['seconds'];

        }else
        {
           $args = func_get_args();
           if( count($args) > 0 )
           {
                $this->year   = $year;
                $this->month  = $month+1;
                $this->day    = $day;
                $this->hours  = $hours;
                $this->minutes= $minutes;
                $this->seconds= $seconds;

                if( $milliseconds > 0 )
                {
                   $milliseconds = min( max($milliseconds,0), 999 );
                   $this->milliseconds = str_pad( $milliseconds."", 3,"0" ,STR_PAD_LEFT );
                }
                $this->dateString = date("Y-m-d H:i:s", mktime($hours, $minutes, $seconds, $month+1, $day, $year) );
           }
        }

    }

    static public function UTC($year, $month, $day=1 , $hours=0 , $minutes=0 ,$seconds=0 , $milliseconds=0)
    {
        if( $milliseconds > 0 )
        {
           $milliseconds = min( max($milliseconds,0), 999 );
           $milliseconds = str_pad( $milliseconds."", 3,"0" ,STR_PAD_LEFT );

        }else
        {
            $milliseconds = "000";
        }

        $sec = strtotime( date("Y-m-d H:i:s", gmmktime($hours, $minutes, $seconds, $month+1, $day, $year) ) );
        return intval($sec.$milliseconds);
    }

    static public function now()
    {
        return (new Date())->getTime();
    }

    static public function parse( $dateString )
    {
        return strtotime( $dateString );
    }

    private function createTime()
    {
        $year    = $this->year    ?: date("Y");
        $month   = $this->month   ?: date("n");
        $day     = $this->day     ?: date("j");
        $hours   = $this->hours   ?: date("H");
        $minutes = $this->minutes ?: date("i");
        $seconds = $this->seconds ?: date("s");
        $this->dateString = date("Y-m-d H:i:s", mktime($hours, $minutes, $seconds, $month, $day, $year) );
    }

    private function createUTCTime()
    {
        $year    = $this->yearUTC    ?: date("Y");
        $month   = $this->monthUTC   ?: date("n");
        $day     = $this->dayUTC     ?: date("j");
        $hours   = $this->hoursUTC   ?: date("H");
        $minutes = $this->minutesUTC ?: date("i");
        $seconds = $this->secondsUTC ?: date("s");
        $this->dateUTCString = date("Y-m-d H:i:s", gmmktime($hours, $minutes, $seconds, $month, $day, $year) );
    }

    public function getTime()
    {
        if( $this->dateString !== null  )
        {
            $sec = strtotime( $this->dateString );
            return $sec.$this->milliseconds;
        }
        list($usec, $sec) = explode(" ", microtime());
        return intval($sec.(round($usec, 3 ) * 1000));
    }

    public function getDate()
    {
        return intval(date("j", $this->dateString !==null ? strtotime( $this->dateString ) : time() ));
    }
    public function getDay()
    {
        return intval(date("w", $this->dateString !==null ? strtotime( $this->dateString ) : time()  ));

    }
    public function getFullYear()
    {
        return intval(date("Y", $this->dateString !==null ? strtotime( $this->dateString ) : time() ));
    }

    public function getHours()
    {
        return intval(date("G", $this->dateString !==null ? strtotime( $this->dateString ) : time() ));
    }
    public function getMilliseconds()
    {
        if( $this->dateString !== null  )
        {
            return $this->milliseconds;
        }
        list($usec) = explode(" ", microtime());
        return round($usec, 3 ) * 1000;
    }
    public function getMinutes()
    {
        return intval( date("i", $this->dateString !==null ? strtotime( $this->dateString ) : time() ) );
    }
    public function getMonth()
    {
        return intval( date("n", $this->dateString !==null ? strtotime( $this->dateString ) : time() ) )-1;
    }
    public function getSeconds()
    {
        return intval( date("s", $this->dateString !==null ? strtotime( $this->dateString ) : time() ) );
    }

    public function getTimezoneOffset()
    {
        $origin_dtz = new \DateTimeZone("Asia/Shanghai");
        $remote_dtz = new \DateTimeZone("GMT");
        $origin_dt = new \DateTime("now", $origin_dtz);
        $remote_dt = new \DateTime("now", $remote_dtz);
        $offset = $remote_dtz->getOffset($remote_dt) - $origin_dtz->getOffset($origin_dt);
        return $offset / 60;
    }

    public function getUTCDate()
    {
        return intval( date("j", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) );
    }

    public function getUTCDay()
    {
        return intval( date("w", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) );
    }

    public function getUTCFullYear()
    {
        return intval( date("Y", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) );
    }

    public function getUTCHours()
    {
        return intval( date("G", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) ); 
    }

    public function getUTCMilliseconds()
    {
        if( $this->dateString !== null  )
        {
            return $this->milliseconds;
        }
        list($usec) = explode(" ", microtime());
        return round($usec, 3 ) * 1000;
    }

    public function getUTCMinutes()
    {
        return intval( date("i", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) ); 
    }

    public function getUTCMonth()
    {
        return intval( date("n", $this->dateString !==null ? strtotime( $this->dateString ) : gmmktime() ) )-1;
    }

    public function getUTCSeconds()
    {
        return intval( date("s", $this->dateString !==null ? strtotime( $this->dateString ) :  gmmktime() ) );
    }

    public function setDate( $value )
    {
        $this->day = $value;
        $this->createTime();
    }

    public function setFullYear($value)
    {
        $this->year = $value;
        $this->createTime();
    }

    public function setHours($value)
    {
        $this->hours = $value;
        $this->createTime();
    }
    public function setMilliseconds($value)
    {
        $this->milliseconds = $value;
    }

    public function setMinutes($value)
    {
        $this->minutes = $value;
        $this->createTime();
    }

    public function setMonth(int $value)
    {
        $this->month = $value+1;
        $this->createTime();
    }

    public function setSeconds($value)
    {
        $this->hours = $value;
        $this->createTime();
    }

    public function setTime($value)
    {
        $this->dateString = date("Y-m-d H:i:s", $value );
    }

    public function setUTCDate($value)
    {
        $this->dayUTC = $value;
        $this->createUTCTime();
    }

    public function setUTCFullYear($value)
    {
        $this->yearUTC = $value;
        $this->createUTCTime();
    }
    public function setUTCHours($value){
        $this->hoursUTC = $value;
        $this->createUTCTime();
    }

    public function setUTCMilliseconds($value)
    {
        $this->millisecondsUTC = $value;
        $this->createUTCTime();
    }

    public function setUTCMinutes($value)
    {
        $this->minutesUTC = $value;
        $this->createUTCTime();
    }

    public function setUTCMonth($value)
    {
        $this->monthUTC = $value+1;
        $this->createUTCTime();
    }

    public function setUTCSeconds($value)
    {
        $this->secondsUTC = $value;
        $this->createUTCTime();
    }

    public function toDateString()
    {
        if( $this->dateString !== null )
        {
            return date("l M d Y", strtotime( $this->dateString ) );
        }
        return date("l M d Y");
    }

    public function toISOString()
    {
        if( $this->dateString !== null )
        {
            return date("Y-m-dTH:i:s", strtotime( $this->dateString ) );
        }
        return date("Y-m-dTH:i:s");
    }

    public function toJSON()
    {
        if( $this->dateString !== null )
        {
            return date("Y-m-dTH:i:s", strtotime( $this->dateString ) );
        }
        return date("Y-m-dTH:i:s");
    }

    public function toLocaleDateString()
    {
        if( $this->dateString !== null )
        {
            return date("Y-m-d H:i:s", strtotime( $this->dateString ) );
        }
        return date("Y-m-d H:i:s");
    }

    public function toLocaleString()
    {
        if( $this->dateString !== null )
        {
            return date("Y-m-d H:i:s", strtotime( $this->dateString ) );
        }
        return date("Y-m-d H:i:s");
    }

    public function toLocaleTimeString()
    {
        if( $this->dateString !== null )
        {
            return date("H:i:s", strtotime( $this->dateString ) );
        }
        return date("H:i:s");
    }

    public function toString()
    {
        if( $this->dateString !== null )
        {
            return date("D M d Y H:i:s e", strtotime( $this->dateString ) );
        }
        return date("D M d Y H:i:s e");
    }

    public function toTimeString()
    {
        if( $this->dateString !== null )
        {
            return date("H:i:s", strtotime( $this->dateString ) );
        }
        return date("H:i:s");
    }

    public function toUTCString()
    {
        if( $this->dateUTCString !== null )
        {
            return gmdate("D M d Y H:i:s T", strtotime( $this->dateUTCString ) );
        }
        return gmdate("D M d Y H:i:s T");
    }

    public function valueOf()
    {
        return $this->getTime();
    }

}