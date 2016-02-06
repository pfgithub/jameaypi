var util = require('util');
var events = require('events');
/**
 * The game api
 *
 * @module Game
 */
 
var screen = document.createElement('canvas');

screen.width  = window.innerWidth;
screen.height = window.innerHeight;
screen.style.position = "fixed";
screen.style.top   = "0";
screen.style.left   = "0";
screen.style.width  = "100%";
screen.style.height = "100%";
 
var buffer = document.createElement('canvas');

buffer.width  = window.innerWidth;
buffer.height = window.innerHeight;
buffer.style.display = "none";

function clone(obj) {
  if(obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
    return obj;

  var temp = obj.constructor(); // changed

  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      obj['isActiveClone'] = null;
      temp[key] = clone(obj[key]);
      delete obj['isActiveClone'];
    }
  }    

  return temp;
}

window.addEventListener("resize", function(){
  var w = window.innerWidth;
  var h = window.innerHeight;
  buffer.width = w;
  buffer.height = h;
  buffer.getContext('2d').drawImage(screen, 0, 0);
  
  screen.width = w;
  screen.height = h;
  screen.getContext('2d').drawImage(buffer, 0, 0);
  
  ev.out('resize');
});

document.body.appendChild(screen);
document.body.appendChild(buffer);

function Events(){this.x = 0;}
util.inherits(Events, events.EventEmitter);
Events.prototype.out = function(data){
  this.emit(data);
};

var screenObj = new Canvas(screen);
var bufferObj = new Canvas(screen);
/**
 * The main canvas class
 *
 * @class Canvas
 * @param {int} width The width
 * @param {int} height The height
 * @namespace Game
 * @constructor
 */
function Canvas(w,h){
  if(typeof w != "number")this.canvas = w;
  else{
    this.canvas = document.createElement('canvas');
    this.canvas.width  = w;
    this.canvas.height = h;
  }
  this.ctx = this.canvas.getContext("2d");
  this.w = this.canvas.width;
  this.h = this.canvas.height;
}

Canvas.prototype.drawImage = function(image,x,y){
  try {this.ctx.drawImage(image.canvas, x,y);return true;}
  catch(err) {console.log('Could not draw canvas',image,err);return false;}
};

/**
 * Do not load an image multiple times. Reuse your image variables
 *
 * @class Canvas
 * @param {int} width The width
 * @param {int} height The height
 * @namespace Game
 * @constructor
 */

function convertImageToCanvas(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	canvas.getContext("2d").drawImage(image, 0, 0);

	return canvas;
}

function Image(url){
  this.img = document.createElement('img');
  this.img.src = url;
  this.img.addEventListener("load",function(){
    this.canvas = convertImageToCanvas(this.img);
    this.w = this.img.clientWidth;
    this.h = this.img.clientHeight;
    this.emit('load');
  }.bind(this));
}
util.inherits(Image, events.EventEmitter);
Image.prototype.draw = function(canvas, x, y){
  canvas.drawImage(this,x,y);
};

function SpriteList(canvas){
  this.sprites = [];
  this.canvas = canvas;
}
SpriteList.prototype.addSprite = function(sprite){
  this.sprites.push(sprite);
};
SpriteList.prototype.draw = function(callback){
  if(this.sprites.length == 0) {callback(true);return;}
  this.sprites.forEach(function(sprite){
    sprite.update();
      
    sprite.draw(this.canvas);
  });
  return true;
};

function Sprite(image,x,y){
  if(typeof image == "string") this.image = new Image(image);
  else this.image = image;
  this.canvas = new Canvas();
  
  this.x = 0;
  this.y = 0;
}
util.inherits(Sprite,events.EventEmitter);
Sprite.prototype.draw = function(canvas){
  this.image.draw(canvas,this.x,this.y);
};
Sprite.prototype.update = function(callback){
  return this.image.draw(this.canvas,0,0);
};


function BoxCollider(){
}

var ev = new Events();

module.exports = {};
module.exports.Canvas = Canvas;
module.exports.screen = screenObj;
module.exports.Sprite = Sprite;
module.exports.Image = Image;
module.exports.events = ev;
