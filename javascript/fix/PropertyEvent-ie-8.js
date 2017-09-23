/**
 * IE8 以下
 */
if( System.env.platform('IE') && System.env.version(8) )
{
   delete Event.fix.map[ PropertyEvent.CHANGE ];
}