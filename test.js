const path = require("path");
const webpack = require("webpack");
const es = require("./lib/index");
const fs = require("fs");
const webpackDevServer = require('webpack-dev-server');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");



const esConfig = es.getConfigure(  JSON.parse( fs.readFileSync( path.resolve(__dirname, "test",'.esconfig') ) ) );

const lessOptions = {
  globalVars:es.builder.getThemeConfig( esConfig ),
  paths:[
      path.resolve(__dirname,'style'),
  ]
}

const config = {
  mode:"development",
  //mode:"production",
  devtool:"(none)",
  entry:{
    'index':'./main.js',
    'person':'./main2.js',
    'test':'./test/src/Test.es'
    //'address':'./test/src/IndexApplication.es?main',
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
              //config:esConfig,
              //"styleLoader":[],
              // styleLoader:[
              //  // MiniCssExtractPlugin.loader.replace(/\\/g,'/'),
              //   'style-loader',
              //   'css-loader',
              //   //'less-loader'
              // ],
              globalVars:lessOptions.globalVars,
              paths:lessOptions.paths
            },
          }
        ]
      },
      {
        test:/\.(less|css)$/i,
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
            options:lessOptions
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
   // new MyPlugin({context:__dirname}),
   // new webpack.MemoryOutputFileSystem()
   // new ExtractTextWebpackPlugin({filename:'[name].min.css'})
  // new MiniCssExtractPlugin({filename: "./css/[name].css"}),

    //new webpack.NamedModulesPlugin(),
    //new webpack.HotModuleReplacementPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks:1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          name:"vendor"
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name:"common"
        }

      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  }

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

  console.log( "=============MyPlugin==============" )


  compiler.hooks.make.tapAsync('MyPluginMake',function(compilation, callback ){

      compilation.hooks.finishModules.tapAsync("MyPluginMake",function(modules,callback){
            //console.log(  modules );
            callback();
      });

      compilation.hooks.succeedEntry.tap("MyPluginMake",function(entry, name, module){
            //console.log(  entry, name );
            //callback();
      });

      // compilation.hooks.buildModule.tap("buildModule",function(module,callback){
      //      // console.log( module );
      //       //callback();
      // });

      console.log( "=============finishModules==============" )

      callback();


  });

  compiler.hooks.beforeRun.tapAsync("MyPlugin",function(compiler, callback){



  //  console.log("This is an example plugin!!!", compiler.options );
    // 功能完成后调用 webpack 提供的回调。
    callback();


  })

 
  // compiler.plugin('run', function(compilation, callback)
  // {
  //    console.log("This is an example plugin!!!");
  //    // 功能完成后调用 webpack 提供的回调。
  //    callback();
  // });


    compiler.hooks.thisCompilation.tap("MyPlugin", compilation => {
    

        compilation.hooks.optimizeChunksAdvanced.tap("SplitChunksPlugin",chunks => {

            //console.log( chunks )


        });

    });

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


