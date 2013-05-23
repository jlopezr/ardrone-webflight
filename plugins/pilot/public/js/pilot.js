PILOT_ACCELERATION = 0.08;

(function(window, document) {
	'use strict';

	// Static keymap used within this module
	var Keymap = {
			87 : {
				ev : 'move',
				action : 'front'
			},
			83 : {
				ev : 'move',
				action : 'back'
			},
			65 : {
				ev : 'move',
				action : 'left'
			},
			68 : {
				ev : 'move',
				action : 'right'
			},
			38 : {
				ev : 'move',
				action : 'up'
			},
			40 : {
				ev : 'move',
				action : 'down'
			},
			37 : {
				ev : 'move',
				action : 'counterClockwise'
			},
			39 : {
				ev : 'move',
				action : 'clockwise'
			},
			32 : {
				ev : 'drone',
				action : 'stop'
			},
			84 : {
				ev : 'drone',
				action : 'takeoff'
			},
			76 : {
				ev : 'drone',
				action : 'land'
			},
			69 : {
				ev : 'drone',
				action : 'disableEmergency'
			}
		};

	/*
	 * Constructuor
	 */
	var Pilot = function Pilot(cockpit) {
                console.log("Loading Pilot plugin.");
		this.cockpit = cockpit;
		this.speed = 0;
		this.listen();
	};

	/*
	 * Register keyboard event listener
	 */
	Pilot.prototype.listen = function listen() {
		var pilot = this;
		$(document).keydown(function(ev) {
			pilot.keyDown(ev);
		});

		$(document).keyup(function(ev) {
			pilot.keyUp(ev);
		});
	};

	Pilot.prototype.keyDown = function keyDown(ev) {
		console.log("Keydown: " + ev.keyCode);
		if (Keymap[ev.keyCode] == null) {
			return;
                }
		var evData;
		ev.preventDefault();
		this.speed = this.speed >= 1 ? 1 : this.speed + PILOT_ACCELERATION / (1 - this.speed);
		evData = Keymap[ev.keyCode];
		this.cockpit.socket.emit("/pilot/" + evData.ev, {
			action : evData.action,
			speed : this.speed
		});
	};

	Pilot.prototype.keyUp = function keyUp(ev) {
		console.log("Keyup: " + ev.keyCode);
		if (Keymap[ev.keyCode] == null) {
			return;
                }
                ev.preventDefault();
		this.speed = 0;
		this.cockpit.socket.emit("/pilot/drone", {
			action : "stop"
		});
	};

	window.Cockpit.plugins.push(Pilot);

}(window, document));
