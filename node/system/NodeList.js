/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 * @require Array
 */
var Array = require("./Array.js");
class NodeList extends Array
{
    item( index )
    {
        return this[index];
    }
}
module.exports = NodeList;
