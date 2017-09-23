#!/usr/bin/env node  
const program = require('commander');
const fs = require('fs');
const PATH = require('path');
const Utils = require('../lib/utils.js');

//当前命令脚本路径
var cmd = PATH.dirname( process.argv[1] );
var cwd = process.cwd();
cmd = cmd.replace(/\\/g, '/').replace(/\/$/,'');
cwd = cwd.replace(/\\/g, '/').replace(/\/$/,'');

var root_path = PATH.dirname( cmd );
program
.version( 'EaseScript '+require('../package.json').version )
.option('-p, --path [dir]', '项目路径', cmd===cwd ? '../project' : cwd )
.option('-c, --config [file]', '指定配置文件', PATH.resolve(root_path, 'Configure.js') )
.option('-m, --minify [enable,disabled]', '是否需要压缩代码','disabled')
.option('-o, --output [dir]', '输出路径')
.option('-s, --suffix [value]', '源文件的后缀名','es')
.option('-b, --browser [enable,disabled]', '是否需要支持浏览器','enable')
.option('-B, --bootstrap [value]', '默认的引导文件','Index')
.option('-d, --debug [enable,disabled]', '是否需要开启调试','enable')
.option('-M, --mode [test,production]', '构建模式是用于生产环境还是测试环境','test')
.option('-C, --clean', '清除编译配置文件,并重新生成')
.option('-r, --reserved [items]', '指定需要保护的关键字', function (val) {
    return val.split(',');
})
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
.option('--bs, --block-scope [enable,disabled]', '是否需要启用块级域','disabled')
.option('--bsc, --base-skin-class [value]', '指定皮肤文件的基础类','es.core.Skin')
.option('--sfs, --skin-file-suffix [value]', '皮肤文件的后缀','html')

program.parse(process.argv);

//输出路径
if( !program.output )
{
    program.output= program.path.replace(/\/$/,'')+'/build';
}

//需要保护的关键字
var reserved = ['let', 'of','System',"Context"];
if( program.reserved )
{
    reserved = reserved.concat.apply(reserved, program.reserved);
}

//全局配置
var config = {
    'suffix': '.'+(program.suffix||'es'),            //需要编译文件的后缀
    'debug': program.debug !=='disabled' ? 'on' : 'off', //是否需要开启调式
    'blockScope': program.blockScope,     //是否启用块级域
    'reserved': reserved,
    'minify': program.minify==='disabled' ? 'off' : 'on', //是否需要压缩
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
        "defineModuleMethod":"Internal.define",
        "package":"Context",
    },
    'mode': program.mode==='production'? 2 : 1, //1 标准模式（开发时使用） 2 性能模式（生产环境使用）
};

//生产环境模式启用压缩文件
if( config.mode===2 )
{
    config.minify = 'on';
}

//将上下文中引用的变量设为受保护的关键字
for (var c in config.context )
{
    if( c !=='defineModuleMethod' )
    {
        config.reserved.push(config.context[c]);
    }
}

//工作的目录
var project_path = PATH.resolve( config.project_path );

if( !fs.existsSync(project_path) )
{
    fs.mkdirSync( project_path );
}

//默认配置文件
var makefile = PATH.resolve(project_path,'Makefile.json');

/**
 * 构建工程结构
 * @param dir
 * @param base
 */
function buildProject(dir, base) {
    var dirpath = PATH.isAbsolute(dir.path) ? dir.path : PATH.resolve(base, dir.path, dir.name);
    if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath);
        if (typeof dir.bootstrap === "string" && dir.syntax) {
            //引用一个模板
            var file = PATH.resolve(config.root_path, dir.syntax, dir.bootstrap + dir.suffix);
            if (Utils.isFileExists(file)) {
                fs.linkSync(file, PATH.resolve(dirpath, dir.bootstrap + dir.suffix));
            }
        }
    }

    dir.path = dirpath;
    dir.name = PATH.basename(dirpath);

    if (dir.child) {
        for (var i in dir.child) {
            buildProject(dir.child[i], dirpath);
        }
    }
}

if( !Utils.isFileExists( makefile ) || program.clean===true )
{
    //程序的路径
    config.root_path = root_path;

    //合并默认配置文件
    Utils.merge(config, require( config.config_file ) );

    //当前工程项目路径
    config.project_path = project_path;
    config.project.path = project_path;
    config.project.name = PATH.basename(project_path);

    //构建项目路径
    config.build_path = PATH.resolve(config.build_path);
    config.build.path = config.build_path;
    config.build.name = PATH.basename(config.build_path);
    if (!fs.existsSync(config.build_path)) {
        fs.mkdirSync(config.build_path);
    }

    //构建输出目录
    buildProject(config.build, config.build_path);

    //构建工程目录
    buildProject(config.project, config.project_path);

    config.project.child.client.config.suffix = config.suffix;
    config.project.child.client.config.bootstrap = config.bootstrap;
    config.project.child.client.config.browser = config.browser;
    config.project.child.client.config.compat_version = config.compat_version;
    config.project_skin_path = config.project.child.client.child.skin.path.replace(/\\/g, '/');

    //生成一个默认的配置文件
    Utils.setContents(makefile, JSON.stringify(config) );
    var bootstrap_file = PATH.resolve( config.project.child.client.path ,  config.project.child.client.config.bootstrap+config.suffix ) ;
    if( !Utils.isFileExists(bootstrap_file) )
    {
        Utils.setContents(bootstrap_file, 'package client{\n \tpublic class '+config.bootstrap+'{\n \t\tpublic function '+config.bootstrap+'(){\n\t\t\tlog("Hello,word!");\n\t\t}\n\t}\n}');
    }

}else
{
    var json = Utils.getContents(makefile);
    config = JSON.parse(json);
}

//开始
require('../Makefile.js')(config);