# EaseScript 1.0.9 Beta

# EaseScript 致力于改变web的开发方式，减少重复的开发成本。

```
安装
npm install easescript

```
使用
打开命令窗口，在以下输入
es -p ./project  //创建一个工程项目

```
语法
```
package
{
    import EventDispatcher;
    public class Main extends EventDispatcher
    {
        function Main()
        {
              super(document);
              this.addEventListener(Event.READY,function(e:Event)
              {
                  var container:Element = new Element('#container');
                  var text = Element.createElement( label );
                  container.addChildAt( text );
              });
        }

        private var _label:String = "Hello world!";

        public function get label():String
        {
            return _label;
        }

        public function set label(val:String):void
        {
            this._label = val;
        }
    }
}

