/*
 * BreezeJS HttpRequest class.
 * version: 1.0 Beta
 * Copyright © 2015 BreezeJS All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/breezejs
 */
(function(window,undefined )
{

    function Editable( target ,type )
    {
        if( !(this instanceof DataGrid) )
            return new DataGrid(target ,type);

        EventDispatcher.call(this);


        /**
         * @private
         */
        var _options={
            type:type || Editable.TEXT,
            targets:target,
            className:null,
            skin:null
        };

        /**
         * @param options
         * @returns {*}
         */
        this.options=function( options )
        {
            if( typeof options !== "undefined" )
            {
                _options = Breeze.extend(true, _options, options);
                return this;
            }
            return _options;
        };

        /**
         * @private
         */
        var _dataSource=null;

        /**
         * @param source
         * @param options
         * @returns {*}
         */
        this.dataSource=function(source,options)
        {
            if( _dataSource === null )
            {
                _dataSource = new DataSource();
            }
            if( typeof source !== "undefined" )
            {
                _dataSource.source(source,options);
                return this;
            }
            return _dataSource;
        };

        this.display=function()
        {

        };

        this.skin=function( skin )
        {
            var options =  this.options();
            if( !options.skin )
            {
                switch( options.type )
                {
                    case Editable.TEXTAREA :
                        options.skin='<textarea>{value}</textarea>';
                        break;
                    case Editable.SELECT :
                        options.skin='<fetch><?foreach(dataGroup as index value){<option value="{index}">{value}</option>}?></fetch>';
                        break;
                    default :
                        options.skin='<input type="'+options.type+'" />';

                }
            }
        }

    }

    Editable.TEXT='text';
    Editable.TEXTAREA='textarea';
    Editable.PASSWORD='password';
    Editable.CHECKBOX='checkbox';
    Editable.RADIO='radio';
    Editable.SELECT='fetch';

    Editable.prototype=new EventDispatcher();
    Editable.prototype.constructor=Editable;

    function EditableEvent( type, bubbles,cancelable ){ BreezeEvent.call(this, type, bubbles,cancelable );}
    EditableEvent.prototype=new BreezeEvent();
    EditableEvent.prototype.constructor=EditableEvent;
    EditableEvent.PLUS_INITIALIZED='dataGridPlusInitialized';
    EditableEvent.REFRESH='dataGridRefresh';

    window.EditableEvent=EditableEvent;
    window.Editable= Editable;

})( window );
