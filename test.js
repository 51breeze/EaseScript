const path = require("path");
const webpack = require("webpack");
const es = require("./lib/index");
const fs = require("fs");

const config = {
  //mode:"development",
  mode:"production",
  devtool:"(none)",
  entry:'./main.js',
  output: {
    filename: './bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(es|html|js)$/,
        include: [
          path.resolve(__dirname, "test","src"),
          path.resolve(__dirname, "es"),
          path.resolve(__dirname, "javascript"),
        ],
        use: [
          {
            loader:'./lib/loader.js',
            options:{"config":path.resolve(__dirname, "test",'.esconfig')}
          }
        ]
      }
    ]
  },
  // plugins: [
  //   new MyPlugin({options: true})
  // ]
};




function MyPlugin() {

};

MyPlugin.prototype.apply = function(compiler) 
{


  compiler.hooks.done.tapAsync("MyPluginDone",function(compiler, callback){

          //console.log( compiler.compilation )
        callback();
  })

  compiler.hooks.make.tapAsync('MyPluginMake',function(compilation, callback ){

      // compilation.hooks.finishModules.tapAsync("finishModules",function(modules,callback){
      //       console.log(  modules );
      //       callback();
      // });

      compilation.hooks.buildModule.tap("buildModule",function(module,callback){
           // console.log( module );
            //callback();
      });

      callback();


  });

  compiler.hooks.run.tapAsync("MyPlugin",function(compiler, callback){



    console.log("This is an example plugin!!!" );
    // 功能完成后调用 webpack 提供的回调。
    callback();


    // const finalCallback = (err, stats) => {
		// 	compiler.running = false;

		// 	if (err) {
		// 		compiler.hooks.failed.call(err);
		// 	}

		// 	if (callback !== undefined) return callback(err, stats);
		// };



    // compiler.readRecords(err => {

    //     console.log( err,  "============2===========" );
    //     if (err) return finalCallback(err);
    //     //compiler.compile(onCompiled);

    //    // console.log( "============3===========" , this.recordsInputPath )

    //     console.log( compiler )
    //     // callback();


    // });






  })

 
  // compiler.plugin('run', function(compilation, callback)
  // {
  //    console.log("This is an example plugin!!!");
  //    // 功能完成后调用 webpack 提供的回调。
  //    callback();
  // });

};





var compiler = webpack( config );
compiler.run(function(){

      console.log( "==ok==="  )

});




