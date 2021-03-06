#!/usr/bin/env node  
const program = require('commander');
const PATH = require('path');

//当前命令脚本路径
var cmd = PATH.dirname( process.argv[1] );
var cwd = process.cwd();
cmd = cmd.replace(/\\/g, '/').replace(/\/$/,'');
cwd = cwd.replace(/\\/g, '/').replace(/\/$/,'');
var root_path = PATH.dirname( cmd );
function keyValue(val) {
    val = val.split(',');
    var item={};
    for( var i in val)
    {
        if( val[i].indexOf(":")>0 )
        {
            var v = val[i].split(':');
            item[ v[0] ]= v[1];
        }else{
            item[ val[i] ] = val[i];
        }
    }
    return item;
}

program
.version( 'EaseScript '+require('../package.json').version )
.option('-p, --path [dir]', '项目路径', cmd===cwd || cwd===root_path ? './project' : cwd )
.option('-c, --config [file]', '指定配置文件',null)
.option('-o, --output [dir]', '输出路径','./build')
.option('-s, --syntax [js|php]', '要构建的语法','js')
.option('-S, --suffix [value]', '源文件的后缀名','.es')
.option('-b, --bootstrap [file|dir]', '指定需要编译的文件或者一个目录')
.option('-t, --theme [default,blue,...]', '指定使用的主题颜色')
.option('--tfp, --theme-file-path [project_path/theme]', '指定主题配置文件的目录,默认为当前工程目录,每一个配置文件名必须与主题名一致')
.option('-r, --reserved [keyword1,keyword2,...]', '指定需要保护的关键字', function (val) {
    return val.split(',');
})
.option('--dbc, --default-bootstrap-class [ExampleClass]', '指定默认的入口类')
.option('--ssc, --skin-style-config [style.conf,skinClassName:style.less,...]', '皮肤样式配置文件或者指定具体组件名称键对样式名文件', keyValue)
.option('-L, --library [name,name:alias,...]', '指定使用第三方组件库',keyValue)
.option('-m, --mode [dev|test|production]', '构建模式是用于生产环境还是测试环境','production')
.option('--bm, --build-mode [app|all]', '构建文件模式', "all")
.option('--cv, --compat-version [ie:number,chrome:number,...]', '需要兼容的浏览器版本,默认为所有(*)',function (val) {
   val = val.split(',');
   var item={};
   for( var i in val)
   {
       var v = val[i].split(':');
       item[v[0]]=v[1] || '*';
   }
   return item;
})

.option('--switch, --command-switch [value]', '需要编译到程序中的指令开关，通常的值为N^2用作模式值',0)
.option('--bsc, --base-skin-class [value]', '指定皮肤文件的基础类','es.core.Skin')
.option('--sfs, --skin-file-suffix [value]', '皮肤文件的后缀','.html')
//.option('--gh, --global-handle [variable name]', '全局引用EaseScript对象的变量名','EaseScript')
.option('--sps, --service-provider-syntax [php]', '服务提供者的语法')

.option('--minify [enable|disabled]', '是否需要压缩代码', "enable")
.option('--browser [enable|disabled]', '是否需要支持浏览器', "enable")
.option('--animate [enable|disabled]', '是否需要加载所有的CSS3动画库',"enable")
.option('--font [enable|disabled]', '是否需要启用CSS字体库',"enable")
.option('--strict-type [enable|disabled]', '启用强类型模式,对于声明的变量、属性、函数的返回值必须指定类型',"enable")
.option('--hot [enable|disabled]', '启用热替换', "disabled")

.option('--type-check', '在运行时检查参数类型(会增加编译后的文件体积)')
.option('--error-debug', '针对javascript在程序中抛错时添加当前源码的位置信息')
.option('--clean', '清除编译配置文件,并重新生成')
.option('--debug', '是否需要开启调试')
.option('--block-scope', '是否需要启用块级域')
.option('--chunk', '拆分文件')
.option('--server', '是否启用服务')
.option('--fetch', '当使用服务端渲染时是否需要在客户端保持元素一致性，开启后在每次创建元素之前先在dom中查找')
.option('--webroot', '指示项目是部署在webroot下运行,否则为构建目录下运行')
.option('--watch', '启用监听文件如有变动自动编译')
.option('--source-file', '是否需要生成源文件')
.option('--source-map', '生成调试的源码文件')
.option('--pack', '打包文件')
.option('--minimal', '使用最小依赖，可以减少打包文件')
.option('--hash', '所有资源使用哈希命名')
.option('--init', '初始化配置文件');
program.parse(process.argv);

var mapKeys={
    "suffix":"suffix",
    "debug":"debug",
    "blockScope":"blockScope",
    "reserved":"reserved",
    "minify":"minify",
    "animate":"animate",
    "font":"font",
    "compatVersion":"compatVersion",
    "build_path":"output",
    "project_path":"path",
    "skin_file_suffix":"skinFileSuffix",
    "project_file_suffix":"suffix",
    "browser":"browser",
    "baseSkinClass":"baseSkinClass",
    "config_file":"config",
    "bootstrap":"bootstrap",
    "theme":"theme",
    "source_file":"sourceFile",
    "library":"library",
    "strictType":"strictType",
    "theme_file_path":"themeFilePath",
    "skin_style_config":"skinStyleConfig",
    "service_provider_syntax":"serviceProviderSyntax",
    "default_bootstrap_class":"defaultBootstrapClass",
    "enable_webroot":"webroot",
    "command_switch":"commandSwitch",
    "mode":"mode",
    "clean":"clean",
    "runtime_type_check":"typeCheck",
    "runtime_error_debug":"errorDebug",
    "syntax":"syntax",
    "build_mode":"buildMode",
    "script_part_load":"chunk",
    "watching":"watch",
    "serverEnable":"server",
    "sourceMap":"sourceMap",
    "fetch":"fetch",
    "initConfig":"init",
    "minimal":"minimal",
    "assets_hash":"hash",
    "hot_replacement":"hot",
    "build_pack":"pack"
}

//全局配置
var config = {};
for( var key in mapKeys )
{
    var name = mapKeys[ key ];
    var val =  program[ name ];
 
    if( typeof val !== "undefined" )
    {
        switch( name ){
            case "syntax" :
                val =  val.toLowerCase();
            break;
            case "mode" :
                val =  val=='dev' ? 1 : val=='test' ? 2 : 3;
                config.env_name = "development";
                if( val === 3 ){
                    config.env_name = "production";
                }
            break;
            case "strictType" :
            case "animate" :
            case "browser" :
            case "minify" :
            case "font" :
            case "hot" :
                val = val === 'enable';
            break;
        }
        config[ key ] = val;
    }
}

const compiler = require('../lib/index.js');
if( config.initConfig ){
   config.clean = true;
   compiler.createConfigure( config );
}else{
   compiler.build( config );
}