# EaseScript 1.0.9 Beta

## EaseScript 致力于改变web的开发方式，减少重复的开发成本。

### 安装
```
npm install easescript

如果有报 Error: Could not locate the bindings file. Tried: 错误信息，请先安装 npm install -g grunt-node-inspector

```

### 使用
```
打开命令窗口，在以下输入

//创建一个工程项目
es -p ./project

执行此命令后会生成以下目录结构

project
|-------build
|------------css  //样式目录文件
|------------fonts //字体目录文件
|------------img   //图片目录文件
|------------js    //构建后的js
|------------src   //构建后的js源文件
|--------Index.es  //EaseScript 脚本文件, 默认 Index 作为入口文件

把 js 目录中的 Index.js 文件引入到网页中， 就可以看 Hello world! 的效果了。

//编译工程文件
es -p ./project -C -m test

//查看命令
es -h
```

### 语法格式
```
package
{
    import EventDispatcher;
	public class Index extends EventDispatcher
	{
        function Index()
        {
           super(document);
           var container:Element = new Element('#container');
           var text = Element.createElement( label );
           container.addChild( text );
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
node ./bin/es -p test -C -m test -s php

node ./bin/es -p test -C -m test -o ../webroot/working -s php

node ./bin/es -p test -C -m test -o ../webroot/working -s javascript

node ../../EaseScript/bin/es -p ../../EaseScript/test -C -m test -o ./ -s php
