//http://local.laravel.com/webroot/index.html
var url = "http://local.laravel.com?PATH=/Person";
//var url = "http://local.laravel.com/webroot/index.html";

function create(url,name){
    if( typeof url !== "string" )return false;

    if( !/^https?\:\/\//.test(url) ){
        var http = location.protocol+"//"+location.hostname+(location.port ? ":"+location.port : "");
        url = url.charAt(0) === "/" || url.charAt(0) === "?" ? http+url : http+"/"+url;
    }
  //  var match = url.match(/^((https?)\:\/\/)([^\:\/]+)(\:(\d+))?([\/\?]+[\w\=\-\#\&\{\}\[\]\%\.\,\;\$\~\^\*]+?)?$/si);
 //   var match = url.match(/^((https?)\:\/\/)([^\:\/]+)(\:(\d+))?((\/[\w\.\,]*)*(\?(\w+\=[\w\=\-\#\&\{\}\[\]\%\.\,\;\$\~\^\*]*)+)?)?$/si);


   var match= url.match(/^((https?)\:\/\/)([\w\d\.]+)(\:(\d+))?(((\/([a-zA-Z]+[\w+](\.[a-zA-Z]+[\w+])?)*)+)?(\?(&?\w+\=?[^&#=]*)+)?([#\w+]*)?)?$/si);


   // console.log( match );
    return match;

    if( !match )return null;
    var urlSegments={
        "host":match[3],
        "origin":match[2]+"://"+match[3]+(match[5]?":"+match[5]:""),
        "scheme":match[2],
        "port":match[5]||"",
        "uri":match[6],
        "url":url,
        "path":[],
        "query":{},
        "fragment":[]
    }
    var info = urlSegments.uri.split("?",2);
    var path = info[0].substr(1);
    var query=info[1];
    urlSegments.path = path.split("/");
    query = query.replace(/#(\w+)$/g,function (a,b) {
        if( b )urlSegments.fragment.push(b);
        return "";
    });
    query = query.split("&");
    for( var i in query )
    {
        var item = query[i].split("=");
        urlSegments.query[ System.trim(item[0]) ] = window.decodeURIComponent( System.trim( item[1] ) );
    }
    return name ? urlSegments[name] : urlSegments;
}


console.log( create(url) );

process.exit();


const MODULE_POLICY_GLOBAL = 1;
const MODULE_POLICY_CORE = 2;
const MODULE_POLICY_LOCAL = 4;
const MODULE_POLICY_ALL = 7;

var mode = MODULE_POLICY_ALL ^ MODULE_POLICY_CORE;

//console.log( mode )

for(var i = 0, n = 0; i <= mode; i = (Math.pow(2, n) & mode), n++) {


    if( i  === MODULE_POLICY_GLOBAL )
    {
        console.log( MODULE_POLICY_GLOBAL )
    }
    if( i  === MODULE_POLICY_CORE )
    {
        console.log( MODULE_POLICY_CORE )
    }
    if( i  === MODULE_POLICY_LOCAL )
    {
        console.log( MODULE_POLICY_LOCAL )
    }

}


process.exit();









console.log( Boolean("false").valueOf() );
process.exit();

//var url = "file:///E:/EaseScript/test/build/webroot/html/view/index.html?cc=44";

var url = "/Index.php/name/dd?page=2&name=555";
url = url.split("?")[0];
var path = url.replace(/^\//,"");
if( path )
{
    path = path.split("/");
    var file = path.shift();
    if( file.indexOf(".") < 0 ){
        path.unshift( file );
        file = "";
    }
}


process.exit();











var zlib = require("zlib");
var fs = require("fs");
const stream = require('stream');

var AdmZip = require('adm-zip');


//var content = zlib.gzipSync("123").toString();
//var c =  zlib.unzipSync( Buffer.from(content, 'base64') );
//fs.writeFileSync("./123.zip", content );


var zip = new AdmZip();

// add file directly
/*var content = "inner content of the file";
zip.addFile("dd/test.txt", Buffer.alloc(content.length, content) );

content = "ffffff of the file";
zip.addFile("ff/uuu.txt", Buffer.alloc(content.length, content) );
zip.writeZip("files.class");*/


var zip = new AdmZip("./files.class");
console.log( zip.readAsText("ff/uuu.txt") );
