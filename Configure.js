//构建输出的目录结构
module.exports={
    "build": {
        "path": "./",
        "name": "build",
        "child": {
            "js": {
                "path": "./webroot/",
                "name": "js",
            },
            "img": {
                "path": "./webroot/",
                "name": "img",
            },
            "css": {
                "path": "./webroot/",
                "name": "css",
            },
            "font": {
                "path": "./webroot/",
                "name": "fonts",
            },
            "view": {
                "path": "./app/",
                "name": "views",
            },
            "webroot":{
                "path":"./",
                "name":"webroot",
            },
            "application":{
                "path":"./",
                "name":"app",
            }
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
    },
};