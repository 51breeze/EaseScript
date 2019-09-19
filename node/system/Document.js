/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require System,HTMLElement
 */

 import HTMLElement from 'HTMLElement.js';
 import System from 'System.js';

export default class Document extends HTMLElement
{

    static document = null;

    constructor()
    {
        super();
        this._documentElement = new HTMLElement('html');
        this._documentElement.visible=true;
        this._head = new HTMLElement('head');
        this._title= new HTMLElement('title');
        this._body = new HTMLElement('body');
        this._head.addChild( this._title );
        this._documentElement.addChild( this._head );
        this._documentElement.addChild( this._body );
        this.visible = true;
        this.nodeName = 'document';
    }

    createElement( name )
    {
        return new HTMLElement( name );
    }

    get outerHTML(){
        return this.documentElement.outerHTML;
    }

    set outerHTML(value){
        return this.documentElement.outerHTML=value;
    }

    get document()
    {
        return Document.document; 
    }

    get documentElement()
    {
        return this._documentElement;
    }

    get innerHTML()
    {
        return this.documentElement.innerHTML;
    }

    set innerHTML( value )
    {
        return this.documentElement.innerHTML = value;
    }

    get title()
    {
        return this._title;
    }

    get head()
    {
        return this._head;
    }

    get body()
    {
        return this._body;
    }


    static querySelectorAll( selector , context=null )
    {
        selector = 'thead > tr:first-child>th:first-child';
        // thead tr.name td[attr=123]
       // selector

        if( context === null )
        {
            context = System.document();

        }else if( is_string(context) )
        {
            context = Document.querySelectorAll( context );
            if( !isset(context[0]) )return array();
            context = context[0];
        }

        if( !(context instanceof HTMLElement) )
        {
            return [];
        }

        return [];
    }

}

Document.document = new Document();