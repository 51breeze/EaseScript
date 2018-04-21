/*
 * EaseScript
 * Copyright © 2017 EaseScript All rights reserved.
 * Released under the MIT license
 * https://github.com/51breeze/EaseScript
 * @author Jun Ye <664371281@qq.com>
 */
package es.core {

    public class State {
        private var _name:String = '';
        private var _stateGroup:Array = [];

        public function State(name:String='') {
            this._name = name;
        }

        public function set name(value:String) {
            this._name = value;
        }

        public function get name():String {
            return this._name;
        }

        public function set stateGroup(value:Array) {
            this._stateGroup = value;
        }

        public function get stateGroup():Array {
            return this._stateGroup;
        }

        public function includeIn(value) {
            return value === this._name || this._stateGroup.indexOf(value) >= 0;
        }
    }
}
