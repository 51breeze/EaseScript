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
.option('-m, --minify [enable|disabled]', '是否需要压缩代码', null )
.option('-o, --output [dir]', '输出路径')
.option('-s, --suffix [value]', '源文件的后缀名','es')
.option('-B, --browser [enable|disabled]', '是否需要支持浏览器','enable')
.option('-b, --bootstrap [value]', '默认的引导文件','Index')
.option('-d, --debug [enable|disabled]', '是否需要开启调试','enable')
.option('-r, --reserved [items]', '指定需要保护的关键字', function (val) {
    return val.split(',');
})
.option('-M, --mode [dev|test|production]', '构建模式是用于生产环境还是测试环境','dev')
.option('-C, --clean', '清除编译配置文件,并重新生成')
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

program.parse(process.argv);

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
    'minify': program.minify, //是否需要压缩
    'compat_version':program.compatVersion || '*',      //要兼容的平台 {'ie':8,'chrome':32.5}
    'build_path': program.output,
    'project_path':program.path,
    'skin_file_suffix': '.'+program.skinFileSuffix,
    'project_file_suffix':'.'+program.suffix,
    'browser':program.browser,
    'baseSkinClass':program.baseSkinClass,
    'config_file':program.config,
    'bootstrap':program.bootstrap,
    'context':{
        "public":"_public",
        "protected":"_protected",
        "private":"_private",
        "internal":"_internal",
        "package":"Context",
    },
    'mode': program.mode=='dev' ? 1 : program.mode=='test' ? 1 : 3, //1 标准模式（开发时使用） 2 测试  3 性能模式（生产环境使用）
};

config.clean = program.clean
config.root_path = root_path;

//开始
require('../index.js')(config);