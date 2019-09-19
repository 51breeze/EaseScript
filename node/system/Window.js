/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require EventDispatcher,Document
 */


import Document from 'Document.js';
import EventDispatcher from 'EventDispatcher.js';
export default class Window extends EventDispatcher
{

    static window=null;

    static get document()
    {
        return Document.document;
    }
}

Window.window = new Window();