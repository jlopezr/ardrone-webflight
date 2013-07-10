(function (window, undefined) {
    'use strict';

    var Altitude;

    Altitude = function Altitude(cockpit) {
        console.log("Loading ALTITUDE indicator plugin.");

        // Instance variables
        this.cockpit = cockpit;

        // Add required UI elements
        
        // Bind to navdata events on websockets
        var self = this;
        this.cockpit.socket.on('navdata', function(data) {
            if (!jQuery.isEmptyObject(data)) {
                requestAnimationFrame(function() {
                    self.render(data);
                });
            }
        });

        // Initial draw
        //this.draw();
    };

    Altitude.prototype.render = function(data) {
        console.log(data.demo.altitudeMeters);
    }

    window.Cockpit.plugins.push(Altitude);

}(window, undefined));
