/**
* Created by Administrator on 2016/1/20.
*/


var themes={

    'default':{

        //场景颜色
        'scene':'#ffffff',

        //强调颜色
        'highlight':'#353535',

        //主要的颜色
        'primary':'#353535',
        //辅助的颜色
        'secondary':'#DFDFDF',
        //标题文本颜色
        'normal':'#333333',

        //成功颜色
        'success':'#5cb85c',
        //警告颜色
        'warn':'#f0ad4e',
        //错误颜色
        'error':'#d9534f',
    }
};

var currentTheme='default';
var ColorThemes={
    'get':function(name)
    {
        return themes[currentTheme][name];
    },
    'set':function(name, colorObject )
    {
        themes[name]=colorObject;
    },
    'theme':function (name)
    {
        currentTheme = name;
    }
};
System.ColorThemes=ColorThemes;