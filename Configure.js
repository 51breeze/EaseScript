//构建输出的目录结构
module.exports={
    "build": {
        "path": "./",
        "name": "build",
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
            "font": {
                "path": "./",
                "name": "fonts",
            },
            "view": {
                "path": "./",
                "name": "views",
            },
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
    },
};