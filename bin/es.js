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
.option('-M, --minify [enable|disabled]', '是否需要压缩代码', null )
.option('-A, --animate [enable|disabled]', '是否需要加载所有的CSS3动画库', 'disabled' )
.option('-F, --font [enable|disabled]', '是否需要启用CSS字体库', 'enable' )
.option('-o, --output [dir]', '输出路径','./build')
.option('-s, --syntax [js|php]', '要构建的语法','js')
.option('-S, --suffix [value]', '源文件的后缀名','.es')
.option('-B, --browser [enable|disabled]', '是否需要支持浏览器','enable')
.option('-b, --bootstrap [file|dir]', '指定需要编译的文件或者一个目录')
.option('-d, --debug [enable|disabled]', '是否需要开启调试','enable')
.option('-t, --theme [default,blue,...]', '指定使用的主题颜色')
.option('--tfp, --theme-file-path [project_path/theme]', '指定主题配置文件的目录,默认为当前工程目录,每一个配置文件名必须与主题名一致',"./theme")
.option('-r, --reserved [keyword1,keyword2,...]', '指定需要保护的关键字', function (val) {
    return val.split(',');
}).option('--webroot, --webroot [enable|disabled]', '指示项目是部署在webroot下运行,否则为构建目录下运行','enable')
.option('--dbc, --default-bootstrap-class [ExampleClass]', '指定默认的入口类')
.option('--ssc, --skin-style-config [style.conf,skinClassName:style.less,...]', '皮肤样式配置文件或者指定具体组件名称键对样式名文件', keyValue)
.option('-L, --library [name,name:alias,...]', '指定使用第三方组件库',keyValue)
.option('-m, --mode [dev|test|production]', '构建模式是用于生产环境还是测试环境','production')
.option('--clean', '清除编译配置文件,并重新生成')
.option('--bm, --build-mode [app|all]', '构建文件模式', "all")
.option('--st, --strict-type [enable|disabled]', '启用强类型模式,对于声明的变量、属性、函数的返回值必须指定类型', 'enable')
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
.option('--bs, --block-scope [enable|disabled]', '是否需要启用块级域','disabled')
.option('--chunk', '拆分文件')
.option('--switch, --command-switch [value]', '需要编译到程序中的指令开关，通常的值为N^2用作模式值',0)
.option('--bsc, --base-skin-class [value]', '指定皮肤文件的基础类','es.core.Skin')
.option('--sfs, --skin-file-suffix [value]', '皮肤文件的后缀','.html')
//.option('--gh, --global-handle [variable name]', '全局引用EaseScript对象的变量名','EaseScript')
.option('--src, --source-file [enable|disabled]', '是否需要生成源文件','enable')
.option('--sps, --service-provider-syntax [php]', '服务提供者的语法')
.option('--server, --server [enable|disabled]', '服务提供者的语法','enable')
.option('--watch', '启用监听文件如有变动自动编译')
.option('--source-map', '生成调试的源码文件')
.option('--pack', '打包文件');
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
    "syntax":"syntax",
    "build_mode":"buildMode",
    "script_part_load":"chunk",
    "watching":"watch",
    "serverEnable":"server",
    "sourceMap":"sourceMap",
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
            break;
            case "strictType" :
            case "animate" :
            case "server" :
            case "webroot" :
            case "font" :
                val = val === 'enable';
            break;
            case "sourceMap" :
                val = true;
            break;
        }
       
        config[ key ] = val;
    }
}

const compiler = require('../lib/index.js');
compiler.build( config );