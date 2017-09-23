/**
 * 皮肤类
 */
package breeze.components
{
    import breeze.components.Component;
    import breeze.evens.SkinEvent;

    public class SkinGroup extends Component
    {
        //构建全部
        static public const BUILD_ALL_MODE:Number=3;

        //构建子级
        static public const BUILD_CHILDREN_MODE:Number=2;

        //构建主容器
        static public const BUILD_CONTAINER_MODE = 1;

        //不构建
        static public const BUILD_CLOSE_MODE:Number=0;

        //默认皮肤对象
        private var skinObject={
            "name": 'div',
            "attr": {},
            "children": []
        };

        function SkinGroup( skinObject )
        {
            super();
            if( typeof skinObject === "object" )
            {
                this.skinObject = skinObject;
            }
            
            this.addEventListener( SkinEvent.INSTALLING, function (e) {
                this.__hostComponent__ = e.hostComponent;
                this.initializing();
                this.removeEventListener( SkinEvent.INSTALLING );
            }, false, 0, this); 
            
            this.addEventListener( SkinEvent.INSTALLED, function (e) {
                this.installCompleted( e.viewport );
            }, false, 0, this);

            this.addEventListener( ComponentEvent.INITIALIZED, function (e) {
                this.initialized();
                this.removeEventListener( ComponentEvent.INITIALIZED );
            }, false, 0, this);

        }

        /**
         * 皮肤安装完成后，由组件触发事件来调度此方法无需手动调用。
         * 此方法主要是用来处理一些，编程式的操作
         * @param viewport
         */
        protected function installCompleted( viewport:Element )
        {
            this.__propertyChanged__=false;
        }

        /**
         * @private
         */
        private var __propertyChanged__=false;

        /**
         * 标记属性有变更
         * @param val
         */
        protected function set propertyChanged(val:Boolean):void{
            this.__propertyChanged__=val;
        }
        protected function get propertyChanged():Boolean
        {
            return this.__propertyChanged__;
        }

        /**
         * @private
         */
        private var __hostComponent__=null;

        /**
         * 宿主组件
         * @param host
         * @returns {Component}
         */
         protected function get hostComponent():Component
         {
             return this.__hostComponent__;
         }

        /**
         * 皮肤属性
         * @param name
         * @param val
         * @returns {*}
         */
        function attr(name, val)
        {
            var skinObject = this.skinObject;
            if( name===true )
            {
                if( typeof val !== "object" )throw new TypeError('val is non-object');
                skinObject.attr = val;
                return this;
            }
            if (typeof name === "string")
            {
                if (typeof val !== "undefined")
                {
                    skinObject.attr[name] = val;
                    return this;
                }
                return skinObject.attr[name];
            }
            return skinObject.attr;
        }

        //默认构建方式
        private var __mode__=Skin.BUILD_ALL_MODE;

        /**
         * 设置构建模式值
         * @param mode
         */
        function set buildMode( mode:Number ):void
        {
            if ( (mode | Skin.BUILD_ALL_MODE) !== Skin.BUILD_ALL_MODE)
            {
                throw new Error('Invalid build mode');
            }
            this.__mode__ = mode;
        }

        /**
         * 获取构建模式值
         * @returns Number
         */
        function get buildMode():Number
        {
            return this.__mode__;
        }

        /**
         * 根据id获取子级元素
         * @param id
         * @returns {*}
         */
        function getChildById(id)
        {
            var child = this[id];
            if (child)return child;
            var skinObject = this.skinObject;
            var children = skinObject.children;
            for (var i in children)
            {
                if (children[i].attr.id === id)
                {
                    if( !(children[i] is Skin) )
                    {
                        children[i] = new Skin( children[i] );
                    }
                    return children[i];
                }
            }
            return null;
        }

        /**
         * 获取指定名称的元素只返回第一个
         * @param name
         * @returns {*}
         */
         function getChildByName(name)
         {
            var skinObject = this.skinObject;
            var children = skinObject.children;
            for (var i in children)
            {
                if (children[i].attr.name === name)
                {
                    return children[i];
                }
            }
            return null;
         }

        /**
         * 获取所有指定名称的元素
         * @param name
         * @returns {Array}
         */
         function getChildAllByName(name)
         {
            var skinObject = this.skinObject;
            var children = skinObject.children;
            var items = [];
            for (var i in children)
            {
                if (children[i].attr.name === name)
                {
                    items.push(children[i]);
                }
            }
            return items;
         }

        /**
         * 添加一个子级元素
         * @param child
         */
         function addChild( child )
        {
            var skinObject =this.skinObject;
            var children = skinObject.children;
            if ( !(child is Skin) )throw new Error('child is not Skin');
            children.push(child);
            return this;
        }

        /**
         * 在指定索引位置添加元素
         * @param child
         * @param index
         */
         function addChildAt(child, index)
        {
            var skinObject =this.skinObject;
            var children = skinObject.children;
            var len = children.length;
            if (typeof index !== "number")throw new Error("Invalid index");
            index = Math.min(len, Math.max(index < 0 ? len + index + 1 : index, 0));
            if( !(child is Skin) )throw new Error("child is not Skin");
            children.splice(index, 0, child);
            return child;
        }

        /**
         * 移除指定的子级元素
         * @param child
         */
         function removeChild(child)
        {
            var skinObject = this.skinObject;
            var children = skinObject.children;
            var index = children.indexOf(child);
            if (index < 0) {
                throw new Error("child is not exists");
            }
            return children.splice(index, 1);
        }

        /**
         * 移除指定索引的子级元素
         * @param index
         */
         function removeChildAt(index)
        {
            var skinObject = this.skinObject;
            var children = skinObject.children;
            var len = children.length;
            index = index < 0 ? index + len : index;
            if (index >= len || index < 0) {
                throw new Error("index out of range");
            }
            return children.splice(index, 1);
        }

        /**
         * 将皮肤对象转html字符串
         */
        public function toString()
        {
            return Skin.__toString(this.skinObject, this, this.buildMode );
        }

        static private const template_syntax={
            'default': {
                'foreach': function (attr, content) {
                    return '<? foreach(' + attr.name + ' as ' + (attr.key || 'key') + ' ' + (attr.value || 'item') + '){ ?>' + content + '<?}?>';
                },
                'if': function (attr, content) {
                    return '<? if(' + attr.condition + '){ ?>' + content + '<?}?>';
                },
                'elseif': function (attr, content) {
                    return '<? elseif(' + attr.condition + '){ ?>' + content + '<?}?>';
                },
                'else': function (attr, content) {
                    return '<? }else{ ?>' + content + '<?}?>';
                },
                'do': function (attr, content) {
                    return '<? do{ ?>' + content + '<?}?>';
                },
                'switch': function (attr, content) {
                    return '<? switch(' + attr.condition + '){ ?>' + content + '<?}?>';
                },
                'case': function (attr, content) {
                    content = '<? case "' + attr.condition + '": ?>' + content;
                    if (attr["break"])content += '\nbreak;';
                    return content;
                },
                'default': function (attr, content) {
                    return '<? default: ?>' + content;
                },
                'break': function (attr, content) {
                    return '<? break; ?>' + content;
                },
                'end': function (attr, content) {
                    return content += '<?}?>';
                },
                'while': function (attr, content) {
                    return '<? while(' + attr.condition + '){ ?>' + content + '<?}?>';
                },
                'code': function (attr, content) {
                    return '<? code{ ?>' + content + ' <? } ?>';
                },
                'script': function (attr, content) {
                    return '<? code{ ?>' + content + ' <? } ?>';
                },
            },
        };

        static private function __toString(skin, parent, mode)
        {
            if (mode === Skin.BUILD_CLOSE_MODE)return '';
            var tag = skin.name || 'div';
            var attr = skin.attr || {};
            var children = skin.children || [];
            var content = '';
            if ((mode & Skin.BUILD_CHILDREN_MODE) === Skin.BUILD_CHILDREN_MODE)
            {
                for (var c in children)
                {
                    var child = children[c];
                    if (child + "" === "[object Object]")
                    {
                        content += Skin.__toString(child, parent, Skin.BUILD_ALL_MODE);
                        
                    } else if( child )
                    {
                        content += child.toString();
                    }
                }
            }
            var temp = tag.indexOf(':');
            if (temp >= 0) {
                var syntax = tag.substr(0, temp);
                tag = tag.substr(temp + 1);
                syntax = syntax || 'default';
                syntax = Skin.template_syntax[syntax];
                if (!syntax[tag])throw new SyntaxError('Syntax tag is not supported for "' + tag + '"');
                return syntax[tag](attr, content);
            }
            if (tag === 'text')return content;
            if ((mode & Skin.BUILD_CONTAINER_MODE) === Skin.BUILD_CONTAINER_MODE)
            {
                var str = '<' + tag;
                for (var p in attr) {
                    str += " " + p + '="' + attr[p] + '"';
                }
                str += '>' + content + '</' + tag + '>';
                content = str;
            }
            return content;
        }
    }
}