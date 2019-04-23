const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");
const io = require('socket.io')
const router = express.Router();
const app = express();
const server = http.Server(app);
const socket = io( server );
const child_process = require("child_process");
function open(url) {
    switch (process.platform) {
        case "darwin":
        child_process.exec(`open ${url}`);
        case "win32":
        child_process.exec(`start ${url}`);
        default:
        child_process.exec(`open ${url}`);
    }
}

module.exports = function start( options )
{
    app.use( express.static( options.webroot ) );
    app.use(function(req, res)
    {
        var route = options.router || require(options.routePath);
        route = route[ req.method.toLowerCase() ] || {};
        if( route[ req.path ] )
        {
            res.sendFile(path.join(options.webroot,"index.html"));

        }else
        {
            res.status(404);
            res.send("Not found "+req.path);
        }
    });

    var port = options.port||8080;
    var host = options.host || "127.0.0.1";
    server.listen( port , function () {
        var http = "http://"+host+":"+port;
        console.log('server listening on '+http);
        open(http);
    });
}


