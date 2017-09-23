/**
 * TimelineEvent
 * @param type
 * @param bubbles
 * @param cancelable
 * @constructor
 * @require Event,Object
 */
function TimelineEvent(type, bubbles,cancelable )
{
    if( !(this instanceof TimelineEvent) )return new TimelineEvent(type, bubbles,cancelable);
    TimelineEvent.call(this, type, bubbles,cancelable );
    return this;
}
TimelineEvent.prototype=Object.create( Event.prototype )
TimelineEvent.prototype.constructor=TimelineEvent;
TimelineEvent.PLAY='timelinePlay';
TimelineEvent.STOP='timelineStop';
TimelineEvent.FINISH='timelineFinish';
TimelineEvent.REPEAT='timelineRepeat';
TimelineEvent.REVERSE='timelineReverse';
TimelineEvent.ADD_FRAME='timelineAddFrame';
TimelineEvent.REMOVE_FRAME='timelineRemoveFrame';
TimelineEvent.PAUSE='timelinePause';
System.TimelineEvent=TimelineEvent;

//属性事件
Event.registerEvent(function ( type , target, originalEvent )
{
    if( originalEvent instanceof TimelineEvent )return originalEvent;
    switch (type)
    {
        case TimelineEvent.PLAY :
        case TimelineEvent.STOP :
        case TimelineEvent.FINISH :
        case TimelineEvent.REPEAT :
        case TimelineEvent.REVERSE :
        case TimelineEvent.ADD_FRAME :
        case TimelineEvent.REMOVE_FRAME :
        case TimelineEvent.PAUSE :
            return new TimelineEvent( type );

    }
});