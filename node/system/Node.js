/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require BaseObject,EventDispatcher,ReferenceError,Document
 */

import Document from "Document.js";
import EventDispatcher from "EventDispatcher.js";

export default class Node extends EventDispatcher
{
   
    constructor(nodeName='text', nodeType=3, attr=null )
    {
        this.nodeName = nodeName;
        this.nodeType = nodeType;
        this.content  = '';
        this.parentNode = null;
        this.attr = attr || {};
        this.style = {};
        this.depth = 0;
        this.visible = false;
        super();
    }

    /**
     * 获取当前节点在文档中是否可见
     * 此属性来判断父级（包括祖辈直到根节点）是否有添加到文档中显示，如果有则为true反之false
     * @return bool
     */
    isNodeInDocumentChain()
    {
        return this.visible;
    }

    toString()
    {
        return this.content;
    }

    get ownerDocument(){
        return Document.document;
    }
}