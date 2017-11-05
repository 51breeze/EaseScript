/*
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core
{
    import es.core.Container;
    import es.core.Display;
    import es.core.Skin;
    import es.core.es_internal;
    import es.components.Component;
    import es.events.SkinEvent;

    public class SkinGroup extends Skin
    {
        /**
         * 皮肤类
         * @constructor
         */
        function SkinGroup(skinObject:Object)
        {
            skinObject = skinObject || {};
            var doc = document.documentElement;
            var body=[];
            if( skinObject.name === 'html' )
            {
                var children:Array =  skinObject.children;
                var len = children.length;
                for(;len>0;)
                {
                    var child = children[--len];
                    if( child.name ==='body' )
                    {
                        var i = child.children.length;
                        for(;i>0;i++)
                        {
                            document.body.addChild( Element.createElement( this.parseSkinObject( child.children[i] ) ) );
                        }

                    }else
                    {
                        doc.addChild( Element.createElement( this.parseSkinObject( child ) ) );
                    }
                }
            }
            super( {'hash':hash,'name':'div'} );
        }
    }
}


