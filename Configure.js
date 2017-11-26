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
        },
    },
    //工作的主目录结构配置
    "project":{
        "path": "./",
        "name": "project",
    },
};