#!/usr/bin/env node  
const program = require('commander');
const PATH = require('path');

//当前命令脚本路径
var cmd = PATH.dirname( process.argv[1] );
var cwd = process.cwd();
cmd = cmd.replace(/\\/g, '/').replace(/\/$/,'');
cwd = cwd.replace(/\\/g, '/').replace(/\/$/,'');
var root_path = PATH.dirname( cmd );
program
.version( 'EaseScript '+require('../package.json').version )
.option('-p, --path [dir]', '项目路径', cmd===cwd || cwd===root_path ? './project' : cwd )
.option('-c, --config [file]', '指定配置文件', PATH.resolve(root_path, 'configure.js') )
.option('-M, --minify [enable|disabled]', '是否需要压缩代码', null )
.option('-A, --animate [enable|disabled]', '是否需要启用CSS3动画库', 'disabled' )
.option('-F, --font [enable|disabled]', '是否需要启用CSS字体库', 'enable' )
.option('-o, --output [dir]', '输出路径')
.option('-s, --syntax [js|php]', '要构建的语法','js')
.option('-S, --suffix [value]', '源文件的后缀名','es')
.option('-B, --browser [enable|disabled]', '是否需要支持浏览器','enable')
.option('-b, --bootstrap [file|dir]', '指定需要编译的文件或者一个目录')
.option('-d, --debug [enable|disabled]', '是否需要开启调试','enable')
.option('-t, --themes [default|blue]', '指定使用的主题颜色','default')
.option('-r, --reserved [items]', '指定需要保护的关键字', function (val) {
    return val.split(',');
})
.option('-m, --mode [dev|test|production]', '构建模式是用于生产环境还是测试环境','production')
.option('-C, --clean', '清除编译配置文件,并重新生成')
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
.option('--bsc, --base-skin-class [value]', '指定皮肤文件的基础类','es.core.Skin')
.option('--sfs, --skin-file-suffix [value]', '皮肤文件的后缀','html')
.option('--src, --source-file [enable|disabled]', '是否需要生成源文件','enable');

program.parse(process.argv);

var has_output_path = !!program.output;

//输出路径
if( !program.output )
{
    program.output= program.path.replace(/\/$/,'')+'/build';
}

//全局配置
var config = {
    'suffix': '.'+(program.suffix||'es'),            //需要编译文件的后缀
    'debug': program.debug, //是否需要开启调式
    'blockScope': program.blockScope,     //是否启用块级域
    'reserved': ['let', 'of','System',"Context"],
    'minify': program.minify==null && program.mode=="production" ? "enable" : program.minify, //是否需要压缩 minify
    'animate': program.animate=="enable", //是否需要启用CSS3动画库
    'font': program.font=="enable", //是否需要启用CSS字体库
    'compat_version':program.compatVersion || {ie:9},      //要兼容的平台 {'ie':8,'chrome':32.5}
    'has_output_path': has_output_path,
    'build_path': program.output,
    'project_path':program.path,
    'skin_file_suffix': '.'+program.skinFileSuffix,
    'project_file_suffix':'.'+program.suffix,
    'browser':program.browser,
    'baseSkinClass':program.baseSkinClass,
    'config_file':program.config,
    'bootstrap':program.bootstrap,
    'themes':program.themes,
    'source_file':program.sourceFile,
    'strictType':program.strictType === 'enable',
    'mode': program.mode=='dev' ? 1 : program.mode=='test' ? 2 : 3, //1 标准模式（开发时使用） 2 测试  3 性能模式（生产环境使用）
};
config.clean = program.clean
config.root_path = root_path;
config.syntax = program.syntax;

//开始
require('../index.js')(config, true);