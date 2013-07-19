(function (window, undefined) {
    'use strict';

    var Altitude;

    Altitude = function Altitude(cockpit) {
        console.log("Loading ALTITUDE indicator plugin.");

        // Instance variables
        this.cockpit = cockpit;
        this.target_altitude = 1;
        this.accepted_error = 0.05;
        this.altitude_lock_enable = false;
        this.front_camera = true;
	this.detection_enable = false;

        this.flight_plan = [ 
            { action: 'clockwise', speed:0.1, time: 1000},
            { action: 'counterclockwise', speed:0.1, time: 1000},
            { action: 'front', speed:0.1, time: 1000},
            { action: 'back', speed:0.1, time: 1000},
            { action: 'back', speed:0.1, time: 1000},
            { action: 'hover', speed:0.1, time: 5000},
            { action: 'doWathever', speed:0.1, time: 1000},
	];

	this.fp_enabled = false;
	this.fp_index = 0;
	this.fp_time = 0;

	// Add required UI elements
	this.ctx = $("#horizon").get(0).getContext('2d'); //required hud plugin to be loaded before
	console.log("WIDTH="+this.ctx.canvas.width);
	console.log("HEIGHT="+this.ctx.canvas.height);
        
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
        this.draw();
    };

    Altitude.prototype.startAutopilot = function() {
         console.log("Start autopilot");
	 this.fp_index = 0;
 	 this.fp_enabled = true;
         this.doWaypoint();
    }

    Altitude.prototype.stopAutopilot = function() {
         console.log("Stop autopilot");
         this.fp_enabled = false;
	 this.hover();
    }

    Altitude.prototype.doWaypoint = function() {
	if(!this.fp_enabled) {
		//do not execute this step nor programme the following
		console.log("Cancelling next wp execution");
		return;
	}

	//send the command
	var action = this.flight_plan[this.fp_index].action;
	var speed =this.flight_plan[this.fp_index].speed;
	var timeout = this.flight_plan[this.fp_index].time;
        console.log("action: "+action+" speed: "+speed);	
        //TODO Call jason's code
        		
	//programme to execute the next step after the timeout
	this.fp_index++;
        console.log("NEXT COMMAND ON "+timeout+" milliseconds");
	var self = this;
	if(this.fp_index < this.flight_plan.length) {
	    setTimeout(function() { self.doWaypoint(); } , timeout);
         } else {
	    setTimeout(function() { console.log("End of flightplan"); self.stopAutopilot(); } , timeout);
	 }
    }

    Altitude.prototype.render = function(data) {
        //console.log("ALTITUDE = "+data.demo.altitudeMeters);
        //console.log(data.visionDetect);
	if(data.visionDetect.nbDetected > 0) {
            console.log("TAG DETECTED!");
	    console.log(data.visionDetect);
	    //LAND ?
            //this.land();
	    this.ctx.strokeStyle = '#fff';
            this.ctx.fillStyle = 'white';
            this.ctx.lineWidth = 2;

            this.ctx.save();
            this.ctx.scale((this.ctx.width/1000.0),(this.ctx.height/1000.0)); 
            this.ctx.beginPath();
            this.ctx.moveTo(1, 999);
            this.ctx.lineTo(999, 999);
            this.ctx.lineTo(999, 1);
            this.ctx.lineTo(1, 1);
            this.ctx.closePath();
            this.ctx.stroke();
            
	    this.ctx.restore();
	}
	if(this.altitude_lock_enable) {
	    this.keepAltitude(data);
	}

	this.draw();
    };

    Altitude.prototype.draw = function() {
        this.ctx.strokeStyle = '#fff';
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(-10, 10);
        this.ctx.lineTo(10, 10);
        this.ctx.lineTo(10, -10);
        this.ctx.lineTo(-10, -10);
        this.ctx.closePath();
        this.ctx.stroke();
    }

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

    Altitude.prototype.hover = function() {
         //TODO implement hover
    }

    Altitude.prototype.land = function() {
         this.cockpit.socket.emit("/pilot/drone", {
                    action : "land",
         });
    }

    Altitude.prototype.keyPress = function(ev) {
        console.log("Keypress: " + ev.keyCode);
        if (ev.keyCode == 109) { // 'm'
             ev.preventDefault();
             // enable keep altitude
	     this.altitude_lock_enable = !this.altitude_lock_enable;
        } else if(ev.keyCode == 98) { // 'b'
             ev.preventDefault();
             // enable tag detection
	     if(!this.detection_enable) {
	       console.log("ENABLE TAG DETECTION");
	       this.config('detect:detect_type', '10');
	       // <!-- In the horizontal camera, look for the orange-blue-orange markers -->
	       this.config('detect:detections_select_h', '32');
	       // <!-- In the vertical camera, detect the A4 marker -->
	       this.config('detect:detections_select_v_hsync', '128');
	       // <!-- Orange-Blue-Orange = 3 -->
	       this.config('detect:enemy_colors', '3');
	       // <!-- Detect the indoor stickers, rather than the outdoor hull -->
	       this.config('detect:enemy_without_shell', '0');
	       this.detection_enable = true;
             } else {
	       console.log("DISABLE TAG DETECTION");
	       this.config('detect:detect_type', '0');
	       this.detection_enable = false;
	     }
	 } else if(ev.keyCode == 99) { // 'c'
	     console.log("Changing camera!");
	     if(this.front_camera) {
                 this.config('video:video_channel', 3);
             	 this.front_camera = false;
	     } else {
                 this.config('video:video_channel', 0);
             	 this.front_camera = true;
	     }
	     ev.preventDefault();
	} else if(ev.keyCode == 111) { // 'o'
             ev.preventDefault();
             if(this.fp_enabled) {
                  this.stopAutopilot();
		  this.fp_enabled=false;
	     } else {
                  this.startAutopilot();
		  this.fp_enabled=true;
	     }
	} 
    };

    window.Cockpit.plugins.push(Altitude);

}(window, undefined));
