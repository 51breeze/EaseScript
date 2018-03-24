if( System.env.platform('IE',8) )
{
    var fix =  Element.fix;
    var cssOpacity = /opacity=([^)]*)/;
    var cssAalpha = /alpha\([^)]*\)/i;
    fix.cssMap['alpha'] = 'opacity';
    fix.cssHooks.opacity = {
        get: function (style) {
            return cssOpacity.test(style.filter || "") ? parseFloat(RegExp.$1) / 100 : 1;
        },
        set: function (style, value) {
            value = isNaN(value) ? 1 : Math.max(( value > 1 ? ( Math.min(value, 100) / 100 ) : value ), 0);
            var opacity = "alpha(opacity=" + (value * 100) + ")",
                filter = style.filter || "";
            style.zoom = 1;
            style.filter = System.trim(filter.replace(cssAalpha, '') + " " + opacity);
            return true;
        }
    };
}