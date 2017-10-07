# EaseScript 1.0.9 Beta

## EaseScript 致力于改变web的开发方式，减少重复的开发成本。

### 安装
```
npm install easescript
```

### 使用
```
打开命令窗口，在以下输入

//创建一个工程项目
es -p ./project
```

### 语法
```
package client
{
    import EventDispatcher;

	public class Index extends EventDispatcher
	{
        function Index()
        {
              super(document);
              this.addEventListener(Event.READY,function(e:Event)
              {
                  var container:Element = new Element('#container');
                  var text = Element.createElement( label );
                  container.addChildAt( text, 0 );
              });
        }

        private var _label:String = "<h1>Hello world!</h1>";

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
```

