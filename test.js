const path = require("path");
const webpack = require("webpack");
const es = require("./lib/index");
const fs = require("fs");
const webpackDevServer = require('webpack-dev-server');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


const esConfig = es.getConfigure(  JSON.parse( fs.readFileSync( path.resolve(__dirname, "test",'.esconfig') ) ) );

const config = {
  mode:"development",
  //mode:"production",
  devtool:"(none)",
  entry:{
    'index':'./main.js',
    'person':'./main2.js',
    //'address':'./test/src/IndexApplication.es',
  },
  output: {
    path:path.resolve('./test/build'),
    filename: './js/[name].bundle.js',
  },
  resolve:{
    extensions:[".js", ".json", ".jsx", ".css",'.es'],
    modules:[
     path.resolve(__dirname),
     path.resolve(__dirname,'test'),
     path.resolve(__dirname, "javascript"),
     path.resolve(__dirname, "node_modules"),
    ]
  },
  devServer: {
    contentBase: path.resolve('./test/build'),
    hot:true,
    //inline:true,
    host:'localhost',
    open:false
  },
  watch:true,
  // watchOptions:{
  //     ignored: /node_modules/
  // },
  module: {
    rules: [
      {
        test: /(\.es)|(javascript\\system\\[a-zA-Z]+\.js)|(\.html)$/,
        include:[
           path.resolve(__dirname, "javascript"),
           path.resolve(__dirname, "es"),
           path.resolve(__dirname, "test"),
        ],
        use: [
          {
            loader:'./lib/loader.js',
            options:{
              "config":esConfig,
              // styleLoader:[
              //  // MiniCssExtractPlugin.loader.replace(/\\/g,'/'),
              //   'style-loader',
              //   'css-loader',
              //   //'less-loader'
              // ],
              globalVars:es.builder.getThemeConfig( esConfig ),
              paths:[
                  path.resolve(__dirname,'style'),
              ]
            },
          }
        ]
      },
      {
        test: /\.(css|less)$/,
        use: [ 
          'style-loader',
          {
            loader:'css-loader',
            options:{
              onlyLocals:false
            }
          },
          {
            loader:'less-loader',
            options:{
              globalVars:es.builder.getThemeConfig( esConfig ),
              paths:[
                    path.resolve(__dirname,'style'),
              ]
            }
          }
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|jpeg|gif)$/,
        use: ['file-loader'],
      },
    ]
  },
  plugins: [
    //new MyPlugin({context:__dirname}),
   // new webpack.MemoryOutputFileSystem()
   // new ExtractTextWebpackPlugin({filename:'[name].min.css'})
  // new MiniCssExtractPlugin({filename: "./css/[name].css"}),

    //new webpack.NamedModulesPlugin(),
    //new webpack.HotModuleReplacementPlugin()
  ]
};


const NormalModule = require("webpack/lib/NormalModule");
const RawModule = require("webpack/lib//RawModule");
//const RuleSet = require("webpack/lib//RuleSet");



function MyPlugin( options ) 
{
    this.options = Object.assign({suffix:".es"},options||{});
    if( !this.options.context )
    {
       this.options.context= path.dirname( path.dirname( require.resolve('easescript') ) );
    }
};


MyPlugin.prototype.apply = function(compiler) 
{

  // compiler.hooks.done.tapAsync("MyPluginDone",function(compiler, callback){

  //         //console.log( compiler.compilation )
  //       callback();
  // })

  var options = this.options;

 compiler.hooks.afterCompile.tapAsync("MyPlugin",function(compilation,callback){

        
     // console.log( "========afterCompile==========" )
      callback();


 })


 compiler.hooks.watchRun.tapAsync('MyPlugin', function( compiler, callback ){

   //   console.log( "=========watchRun========"  )
      //console.log( compiler )
      callback();

 });


  compiler.hooks.normalModuleFactory.tap("MyPlugin",function(normalModuleFactory){


      

      // normalModuleFactory.hooks.factory.tap("MyPlugin",function( callback ){

      //        console.log( this  );
      //        process.exit();

      //        //return null;
         

      // })


     

      normalModuleFactory.hooks.factory.tap("MyPlugin", () => (result, callback) => {


        // if( result.request.slice(-3) ===".es" )
        // {
        //     // console.log(  result.request ,"+++++++++++++++++")
             
        //     result.resource="javascript/system/System.js";
        //     result.type="javascript/auto";
        //     result.loaders = [];
        //     result.userRequest = "System.es";
            
        //      return callback(null,   new NormalModule(result) );
        // }


        let resolver = normalModuleFactory.hooks.resolver.call(null);
  
        // Ignored
        if (!resolver) return callback();
  
        resolver(result, (err, data) => {
          if (err) return callback(err);
  
          // Ignored
          if (!data) return callback();
  
          // direct module
          if (typeof data.source === "function") return callback(null, data);
  
          normalModuleFactory.hooks.afterResolve.callAsync(data, (err, result) => {
            if (err) return callback(err);
  
            // Ignored
            if (!result) return callback();
  
            let createdModule = normalModuleFactory.hooks.createModule.call(result);
            if (!createdModule) {
              if (!result.request) {
                return callback(new Error("Empty dependency (no request)"));
              }
  
              createdModule = new NormalModule(result);
            }
  
            createdModule = normalModuleFactory.hooks.module.call(createdModule, result);
  
            return callback(null, createdModule);
          });

        });

      });

     

      // normalModuleFactory.resolverFactory.hooks.resolver.for("normal").tap("MyPlugin",function(resolver, resolveOptions){

        

      //     // resolver.hooks.noResolve.tap("MyPlugin", function(){

      //     //   console.log(arguments)

      //     // })

      //     resolver.hooks.resolve.tap("MyPlugin", function(request, innerContext,callback ){

      //         request.request="d:/workspace/EaseScript/lib/loader.js??ref--4-0!d:/workspace/EaseScript/javascript/system/System.js";
      //         request.path = "javascript/system/System.js";
      //         request.resource="javascript/system/System.js"
          
      //         return request;

      //     })
        
      // })

      



      normalModuleFactory.hooks.beforeResolve.tapAsync("MyPlugin",function(	data, callback )
      {


       //  console.log( data.request ,"====================")
        // process.exit();
        
          if( /^system\//.test(data.request) && path.extname(data.request)===options.suffix  )
          {
              //data.request = data.request.substr(1);

              //var file = data.request.slice(0,-options.suffix.length)+'.js';
              // if( path.extname(file) === ".js" )
              // {
              //     file = path.resolve(options.context,'javascript/system', file );

              // }else{
                
              //   file = path.resolve(options.context,'javascript/system', file+".js" );
              //   if( !fs.existsSync( file ) )
              //   {
              //       file = data.request;
              //   }
              // }

              //  console.log( file,"====" );
              
             // data.request = file;
             
          }

          //if( data.request !== 'System.js'  ){

              callback();
          //}
        
      });
        
  })

  compiler.hooks.thisCompilation.tap("MyPluginDone",function(compilation, params){

       // console.log(arguments )


        compilation.hooks.rebuildModule.tap("MyPluginDone",function(){



                  console.log("============rebuildModule==========")

                  console.log(arguments )

        })


        //callback();
  })




  // compiler.hooks.make.tapAsync('MyPluginMake',function(compilation, callback ){

  //     // compilation.hooks.finishModules.tapAsync("finishModules",function(modules,callback){
  //     //       console.log(  modules );
  //     //       callback();
  //     // });

  //     compilation.hooks.buildModule.tap("buildModule",function(module,callback){
  //          // console.log( module );
  //           //callback();
  //     });

  //     callback();


  // });

  // compiler.hooks.run.tapAsync("MyPlugin",function(compiler, callback){



  //   console.log("This is an example plugin!!!" );
  //   // 功能完成后调用 webpack 提供的回调。
  //   callback();


  //   // const finalCallback = (err, stats) => {
	// 	// 	compiler.running = false;

	// 	// 	if (err) {
	// 	// 		compiler.hooks.failed.call(err);
	// 	// 	}

	// 	// 	if (callback !== undefined) return callback(err, stats);
	// 	// };



  //   // compiler.readRecords(err => {

  //   //     console.log( err,  "============2===========" );
  //   //     if (err) return finalCallback(err);
  //   //     //compiler.compile(onCompiled);

  //   //    // console.log( "============3===========" , this.recordsInputPath )

  //   //     console.log( compiler )
  //   //     // callback();


  //   // });






  // })

 
  // compiler.plugin('run', function(compilation, callback)
  // {
  //    console.log("This is an example plugin!!!");
  //    // 功能完成后调用 webpack 提供的回调。
  //    callback();
  // });

};




webpackDevServer.addDevServerEntrypoints(config, config.devServer);

var compiler = webpack( config );

// compiler.run(function(){

//       console.log( "==ok==="  )

// })

const server = new webpackDevServer(compiler, config.devServer);



server.listen(8080, 'localhost', () => {

   console.log('dev server listening on port 8080');

});


