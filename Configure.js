//构建输出的目录结构
module.exports={
    "build": {
        "path": "./",
        "name": "build",
        "child": {
            "js": {
                "path": "@webroot",
                "name": "js",
            },
            "img": {
                "path": "@webroot",
                "name": "img",
            },
            "css": {
                "path": "@webroot",
                "name": "css",
            },
            "font": {
                "path": "@webroot",
                "name": "fonts",
            },
            "view": {
                "path": "@application",
                "name": "view",
            },
            "html":{
                "path":"@webroot",
                "name":"html",
            },
            "webroot":{
                "path":"./",
                "name":"webroot",
            },
            "bootstrap":{
                "path":"@application",
                "name":"bootstrap",
            },
            "application":{
                "path":"./",
                "name":"easescript",
            }
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
    },
};