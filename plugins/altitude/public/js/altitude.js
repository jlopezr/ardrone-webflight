(function (window, undefined) {
    'use strict';

    var Altitude;

    Altitude = function Altitude(cockpit) {
        console.log("Loading ALTITUDE indicator plugin.");

        // Instance variables
        this.cockpit = cockpit;
        this.target_altitude = 1;
        this.accepted_error = 0.05;
        this.enabled = false;
        this.front_camer = true;

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

        $(document).keypress(function(ev) {
           self.keyPress(ev);
        });

        // Initial draw
        //this.draw();
    };

    Altitude.prototype.render = function(data) {
        //console.log("ALTITUDE = "+data.demo.altitudeMeters);
        //console.log(data.visionDetect);
	if(data.visionDetect.nbDetected > 0) {
            console.log("TAG DETECTED!");
	    console.log(data.visionDetect);
	}
	if(this.enabled) {
	    this.keepAltitude(data);
	}
    };

    Altitude.prototype.keepAltitude = function(data) {
	var altitude = data.demo.altitudeMeters;

	if(Math.abs(altitude-this.target_altitude)<=this.accepted_error) {
	     console.log("Keep altitude");
	     this.sendUpAltitudeCommand(0);
	     this.sendDownAltitudeCommand(0);
	} else if(altitude < this.target_altitude) {
	     console.log("Going UP");
	     //this.sendDownAltitudeCommand(0);
	     this.sendUpAltitudeCommand(0.2);
	} else if(altitude > this.target_altitude) {
	     console.log("Going DOWN");
	     //this.sendUpAltitudeCommand(0);
	     this.sendDownAltitudeCommand(0.2); 
	}
    };

    Altitude.prototype.sendUpAltitudeCommand = function(value) {
         this.cockpit.socket.emit("/pilot/move", {
                    action : "up",
                    speed : value 
         });
    };

    Altitude.prototype.sendDownAltitudeCommand = function(value) {
         this.cockpit.socket.emit("/pilot/move", {
                    action : "down",
                    speed : value 
         });
    };

    Altitude.prototype.config = function(key_, value_) {
         this.cockpit.socket.emit("/pilot/config", {
                    key: key_,
                    value: value_
         });
    }

    Altitude.prototype.keyPress = function(ev) {
        console.log("Keypress: " + ev.keyCode);
        if (ev.keyCode == 109) { // 'm'
             ev.preventDefault();
             // enable keep altitude
	     this.enabled = !this.enabled;	
        } else if(ev.keyCode == 98) { // 'b'
             ev.preventDefault();
             // enable tag detection
	     console.log("ENABLE TAG DETECTION");
	     // <param name="detect_type" value="10" />
	     this.config('detect:detect_type', '10');
	     // <param name="detections_select_h" value="32" />  <!-- In the horizontal camera, look for the orange-blue-orange markers -->
	     this.config('detect:detections_select_h', '32');
	     // <param name="detections_select_v_hsync" value="128" />  <!-- In the vertical camera, detect the A4 marker -->
	     this.config('detect:detections_select_v_hsync', '128');
	     // <param name="enemy_colors" value="3" />  <!-- Orange-Blue-Orange = 3 -->
	     this.config('detect:enemy_colors', '3');
	     // <param name="enemy_without_shell" value="0" />  <!-- Detect the indoor stickers, rather than the outdoor hull -->
	     this.config('detect:enemy_without_shell', '0');
        } else if(ev.keyCode == 99) { // 'c'
	     if(this.front_camera) {
                 this.config('video:video_channel', 3);
             	 this.front_camera = false;
	     } else {
                 this.config('video:video_channel', 0);
             	 this.front_camera = true;
	     }
	     ev.preventDefault();
	} 
    };

    window.Cockpit.plugins.push(Altitude);

}(window, undefined));
