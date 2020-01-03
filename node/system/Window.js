/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @require EventDispatcher,Document
 */
var EventDispatcher = require("./EventDispatcher.js");
class Window extends EventDispatcher
{
    static get document()
    {
        return Document.document;
    }

    constructor()
    {
        super();
    }
}

Window.window = new Window();
module.exports = Window;
var Document = require("./Document.js");
