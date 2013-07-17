function pilot(name, deps) {
    deps.io.sockets.on('connection', function (socket) {
        socket.on('/pilot/move', function (cmd) {
            var _name;
            console.log("move", cmd);
            return typeof deps.client[_name = cmd.action] === "function" ? deps.client[_name](cmd.speed) : void 0;
        });
        socket.on('/pilot/drone', function (cmd) {
           var _name;
           console.log("drone", cmd);
           return typeof deps.client[_name = cmd.action] === "function" ? deps.client[_name]() : void 0;
        });
        socket.on('/pilot/calibrate', function (cmd) {
           console.log("calibrate", cmd);
           return deps.client.calibrate(cmd.device_num);
        });
	socket.on('/pilot/config', function (cmd) {
           console.log("config", cmd);
           return deps.client.config(cmd.key, cmd.value);
        });
    });
};

module.exports = pilot;
