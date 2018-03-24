/**
 * IE8 以下
 */
if( System.env.platform('IE',8) )
{

Event.fix.map[ Event.READY ] = 'readystatechange';
Event.fix.prefix='on';

(function () {

/**
 * 监测加载对象上的就绪状态
 * @param event
 * @param type
 * @returns loaded|complete|4
 */
var getReadyState=function( target )
{
    var nodeName=  typeof target.nodeName === "string" ?  target.nodeName.toLowerCase() : null ;
    var readyState=target.readyState;
    //iframe
    if( nodeName==='iframe' )
    {
        readyState=target.contentWindow.document.readyState;
    }//window
    else if( target.window && target.document )
    {
        readyState=target.document.readyState;
    }
    return readyState;
}

Event.fix.hooks[ Event.LOAD ]=function (listener, dispatcher)
{
    if( this.$addEventListener )
    {
        this.$addEventListener( Event.type(Event.LOAD) ,dispatcher);

    }else if( this.attachEvent )
    {
        this.attachEvent( Event.type(Event.LOAD) ,dispatcher);

    }else if( typeof this.onreadystatechange !== "undefined" )
    {
        this.onreadystatechange=function()
        {
            if( this.readyState === 4 )
            {
                if( this.status === 200 )
                {
                    var event = new Event(Event.LOAD);
                    event.currentTarget = this;
                    event.target = this;
                    dispatcher(event);
                }else
                {
                    var event = new Event(Event.ERROR);
                    event.currentTarget = this;
                    event.target = this;
                    dispatcher(event);
                }
            }
        }
    }
}

Event.fix.hooks[ Event.READY ]=function (listener, dispatcher)
{
    var target=this;
    var doc = this.contentWindow ?  this.contentWindow.document : this.ownerDocument || this.document || this;
    var win=  doc && doc.nodeType===9 ? doc.defaultView || doc.parentWindow : window;
    if( !(win || doc) )return;
    var handle=function(event)
    {
        if( !event )
        {
           switch ( getReadyState( doc ) )
           {
               case 'loaded'   :
               case 'complete' :
               case '4'        :
                   event= new Event( Event.READY );
               break;
           }
        }
        if( event )
        {
            event = event instanceof Event ? event : Event.create( event );
            event.currentTarget = target;
            event.target = target;
            dispatcher( event );
        }
    }
    var type = Event.type(Event.READY);
    doc.addEventListener ? doc.addEventListener( type, handle ) : doc.attachEvent(type, handle);

    //不是一个顶级文档或者窗口对象
    if( !this.contentWindow && win && doc )
    {
        var toplevel = false;
        try {
            toplevel = win.frameElement == null;
        } catch(e) {}
        if ( toplevel && doc.documentElement.doScroll )
        {
            var doCheck=function(){
                try {
                    doc.documentElement.doScroll("left");
                } catch(e) {
                    System.setTimeout( doCheck, 1 );
                    return;
                }
                handle();
            }
            doCheck();
        }
    }
    handle();
    return true;
}
}());
}