const config={
    //皮肤文件的后缀
    //'skin_file_suffix':'.xml',
    //工程文件的后缀
    // 'project_file_suffix':'.as',
    //构建输出的目录结构
    "build": {
        "path": "./",
        "name": "build",
        "child": {
            "framework": {
                "path": "./",
                "name": "breezephp",
            },
            "application": {
                "path": "./",
                "name": "application",
                "child": {
                    "library": {
                        "path": "./",
                        "name": "library",
                    },
                    "controller": {
                        "path": "./",
                        "name": "controller",
                    },
                    "model": {
                        "path": "./",
                        "name": "model",
                    },
                    "view": {
                        "path": "./",
                        "name": "view",
                    },
                },
            },
            "webroot": {
                "path": "./",
                "name": "webroot",
                "child": {
                    "static": {
                        "path": "./",
                        "name": "static",
                        "child": {
                            "js": {
                                "path": "./",
                                "name": "js",
                            },
                            "img": {
                                "path": "./",
                                "name": "img",
                            },
                            "css": {
                                "path": "./",
                                "name": "css",
                            },
                        },
                    },
                },
            },
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
        "child":{
            'client': {
                "path": "./",
                "name": "client",
                "config":{
                    "syntax": "javascript",
                    "suffix": ".as",
                    "bootstrap":"Index",
                    'compat_version':'*',
                    'browser':'enable',
                },
                "child": {
                    'skin': {
                        "path": "./",
                        "name": "skins",
                    },
                },
            },
            /*'server': {
                "path": "./",
                "name": "server",
                "config":{
                    "syntax": "php",
                    "suffix": ".as",
                    "bootstrap":"Index",
                    'compat_version':{'php':5.3},
                },
                "child": {
                    'controller': {
                        "path": "./",
                        "name": "controller",
                    },
                    'model': {
                        "path": "./",
                        "name": "model",
                    },
                    'library': {
                        "path": "./",
                        "name": "library",
                    },
                    'view': {
                        "path": "./",
                        "name": "view",
                    },
                },
            },*/
        },
    },
};
module.exports = config;