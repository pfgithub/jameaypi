var util = require('util');
var events = require('events');
var keys = require('./keys.json');
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
  
  screenObj.w = w;
  screenObj.h = h;
  
  ev.out('resize');
});

document.addEventListener('keydown',function(e){
  var key = keys[e.keyCode];
  ev.out('keydown', key);
  ev.out('keydown-'+key);
});

document.addEventListener('keyup',function(e){
  var key = keys[e.keyCode];
  ev.out('keyup', key);
  ev.out('keyup-'+key);
});

document.body.appendChild(screen);
document.body.appendChild(buffer);

function Events(){this.x = 0;}
util.inherits(Events, events.EventEmitter);
Events.prototype.out = function(data){
  this.emit.apply(this, arguments);
};

var screenObj = new Canvas(screen);
/**
 * The main canvas class. Do not change the width and height of the canvas.
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
  
  this.spriteList = new SpriteList(this);
  
  this.camera = {
    x: 0,
    y: 0
  };
}

/**
 * Draw an image onto the canvas
 *
 * @method drawImage
 * @param {Image} image The image to be drawn to the canvas
 * @param {int} x The x position to draw the image to
 * @param {int} y The y position to draw the image to
 * @return {Boolean} Weather the image drawing succeeded or not. If image drawing did not succeed, it is likley that the image was not loaded yet. Please use awaitImages to house your image loading.
 */

Canvas.prototype.drawImage = function(image,x,y){
  try {this.ctx.drawImage(image.canvas, x+this.camera.x,y+this.camera.y);return true;}
  catch(err) {console.log('Could not draw canvas',image,err);return false;}
};

/**
 * Register a sprite to the canvas's SpriteList
 *
 * @method registerSprite
 * @param {Sprite} sprite The sprite to be added to the SpriteList
 * @return
 */

Canvas.prototype.registerSprite = function(sprite,collisionType){
  this.spriteList.addSprite(sprite,collisionType);
};

Canvas.prototype.registerSprites = function(sprites,collisionType){
  sprites.forEach(function(sprite){this.spriteList.addSprite(sprite,collisionType);});
};

Canvas.prototype.registerCollider = function(collider){
  this.colliderList.addCollider(collider);
};

/**
 * Clear the canvas
 *
 * @method clear
 * @return
 */

Canvas.prototype.clear = function(){
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

function convertImageToCanvas(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	canvas.getContext("2d").drawImage(image, 0, 0);

	return canvas;
}

/**
 * Images to be used in your sprites. Please load all your images with awaitImages(array,callback) before actually running any code. All events are outputted to Game.events.on in the awaitImages callback
 *
 * @class Image
 * @param {url} url The url to the image. This can be in data:image format or an actuall https:// url
 * @namespace Game
 * @constructor
 */
 
/**
 * Fired the image loads. Instead of using this event, you can use awaitImages to wait for all images in an array to load.
 *
 * @event load
 */
function Image(url){
  this.img = document.createElement('img');
  this.img.src = url;
  this.img.addEventListener("load",function(){
    this.canvas = convertImageToCanvas(this.img);
    this.w = this.img.width;
    this.h = this.img.height;
    
    this.emit('load');
  }.bind(this));
}
util.inherits(Image, events.EventEmitter);

/**
 * Draw the image to a canvas
 *
 * @method drawImage
 * @param {Canvas} canvas The canvas to draw the image to (not a RenderingContext2d)
 * @return
 */
Image.prototype.draw = function(canvas, x, y){
  canvas.drawImage(this,x,y);
};
function Size(w,h){
  this.w = w;
  this.h = h;
  this.canvas = document.createElement("canvas");
  this.canvas.width = this.w;
  this.canvas.height = this.h;
}
util.inherits(Size,events.EventEmitter);
Size.prototype.draw = function(canvas,x,y){
  this.emit("draw",canvas,x,y);
};

/**
 * Lists of sprites that can be drawn quickly
 *
 * @class SpriteList
 * @param {Canvas} canvas The canvas to draw your sprites to
 * @param OR
 * @param {Array(Canvas)} canvases The canvases to draw your sprites to formated in [canvas,canvas,canvas]. If no canvases are given, nothing will be drawn with draw()
 * @namespace Game
 * @constructor
 */
function SpriteList(canvas){
  this.sprites = [];
  this.canvas = canvas;
  this.colliderList = new ColliderList();
}

/**
 * Add a sprite to the SpriteList
 *
 * @method addSprite
 * @param {Sprite} sprite The sprite to be added to the SpriteList
 * @return
 */
SpriteList.prototype.addSprite = function(sprite,colliderType){
  this.sprites.push(sprite);
  sprite.onSpriteListed(this,colliderType);
};

/**
 * Draws all the sprites to be updated
 *
 * @method draw
 * @param {Boolean} [update=false] Weather the sprites should have their images updated first. Disabling this can get better performance, only use when neccessary.
 * @return
 */
SpriteList.prototype.draw = function(update){
  if(this.sprites.length == 0) return;
  this.sprites.forEach(function(sprite){
    if(update) sprite.update();
    
    //if(this.canvas.prototype == [].prototype){
      sprite.draw(this.canvas);
    //}else{
    //  this.canvas.forEach(function(canva){
    //    sprite.draw(canva);
    //  });
   // }
  }.bind(this));
  return true;
};


function ColliderList(){
  this.colliders = [];
}
ColliderList.prototype.addCollider = function(collider){
  this.colliders.push(collider);
};

/**
 * Sprites. The basic object which has your character or monster or npc. It has an X and a Y to be moved around, and can be drawn in the canvas's spritelist
 *
 * @class Sprite
 * @param {image} image The first image for the sprite. If this image is given before it is loaded, the sprite WILL NOT load properly. Make sure to load ALL your images before doing anything, or serious errors could occur.
 * @param {int} x The starting x position of the sprite
 * @param {int} y The starting y position of the sprite
 * @namespace Game
 * @constructor
 */
function Sprite(image,x,y){
  this.image = image;
  this.canvas = new Canvas(this.image.w,this.image.h);
  
  this.x = x;
  this.y = y;
  
  this.do = {};
  this.collision = "Add your sprite to a SpriteList for collision";
  
  this.update();
}
util.inherits(Sprite,events.EventEmitter);
// not documented yet
Sprite.prototype.onSpriteListed = function(spriteList,colliderType){
  this.collision = new BoxCollider(spriteList,this.x,this.y,this.image.w,this.image.h,colliderType);
  this.collision.on('updateLocations',function(){
    this.collision.update(this.x,this.y,this.image.w,this.image.h);
  }.bind(this));
};

Sprite.prototype.draw = function(canvas){
  this.image.draw(canvas,this.x,this.y);
};
// not documented yet
Sprite.prototype.update = function(image){
  this.canvas.clear();
  if(image) this.image = image;
  return this.image.draw(this.canvas,0,0);
};


/**
 * All the main events for your game to run. Handle any events with Game.events.on(event,callback). Call any events with Game.events.out(event,paramaters...)
 *
 * @class events
 * @namespace Game
 * @static
 */
/**
 * When a key is first pressed
 *
 * @event keydown
 * @param {String} key The key that was pressed formatted according to keys.json (Expect these to be changed)
 */
/**
 * When a key is let go of
 *
 * @event keyup
 * @param {String} key The key that was released formatted according to keys.json (Expect these to be changed)
 */
/**
 * When the screen is resized. Make sure to redraw on this event and reformat your screen.
 *
 * @event resize
 */
/**
 * Called when your game should draw
 *
 * @event draw
 */
/**
 * Called when your game should update
 *
 * @event error
 * @param {number} deltaTime How long (in seconds) since the last frame. Multiply it by your speed for constant movement (in px/s)
 */

/** 
 * These methods can be accessed directly with Game.[method]
 * 
 * @class GLOBAL
 * @static
 */
 
/**
 * Waits for all the images in an array to load. 
 *
 * @method awaitImages
 * @param {Array(Image)} images The images to load
 * @param {Function()} callback Called when all the images load
 * @return
 */

function awaitImages(images,callback){
  var counter = images.length;
  if(counter == 0) {callback(images);return;}
  images.forEach(function(image){
    if(image.w) counter--;
    if(counter == 0) {callback(images);return;}
    image.on('load',function(){
      counter --;
      
      if(counter == 0) {callback(images);return;}
    });
  });
}

setInterval(onTimerTick, 33); // 33 milliseconds = ~ 30 frames per sec

function onTimerTick() {
  ev.out('update', 0.033);
  ev.out('draw');
}

function BoxCollider(spriteList,x,y,w,h,colliderType){
  this.colliderList = spriteList.colliderList;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.colliderType = colliderType ? colliderType : "background"; // none, background, or object
  this.colliderList.addCollider(this);
}
util.inherits(BoxCollider,events.EventEmitter);

BoxCollider.prototype.colliding = function(){
  this.emit('updateLocations');
  if(this.colliderType == "object"){
    var collided = this.colliderList.colliders.some(function(collider,i){
      if(collider == this) return false;
      if(
        this.x < collider.x + collider.w &&
        this.x + this.w > collider.x &&
        this.y < collider.y + collider.h &&
        this.h + this.y > collider.y
      ){
        return true;
      }else return false;
    }.bind(this));
    return collided;
  }else{
    throw new Error("Collider type " + this.colliderList +" can not be on the ground. Remove this check");
  }
};

BoxCollider.prototype.update = function(x,y,w,h){
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};

function RigidBody(sprite,collider){
  this.sprite = sprite;
  this.collider = collider;
  
  this.vx = 0;
  this.vy = 0;
}
RigidBody.prototype.applyForce = function(x,y){
  this.vx += x;
  this.vy += y;
};
RigidBody.prototype.setForce = function(x,y){
  this.vx = x;
  this.vy = y;
};
RigidBody.prototype.update = function(deltaTime){
  this.sprite.x += this.vx * deltaTime;
  
  if(this.collider.colliding()){
    this.sprite.x -= this.vx * deltaTime;
    this.vx = 0;
  }
  
  this.sprite.y += this.vy * deltaTime;
  
  if(this.collider.colliding()){
    this.sprite.y -= this.vy * deltaTime;
    if(this.vy > 0)this.onGround = true;
    this.vy = 0;
  }else{
    this.onGround = false;
  }
  
  this.vy += 10;
  if(this.vx > 0){
    this.vx -= 5;
    if(this.vx < 0) this.vx = 0;
  }else if(this.vx < 0){
    this.vx += 5;
    if(this.vx > 0) this.vx = 0;
  }
};

var ev = new Events();

module.exports = {};
module.exports.Canvas = Canvas;
module.exports.screen = screenObj;
module.exports.Sprite = Sprite;
module.exports.SpriteList = SpriteList;
module.exports.BoxCollider = BoxCollider;
module.exports.RigidBody = RigidBody;
module.exports.Image = Image;
module.exports.awaitImages = awaitImages;
module.exports.events = ev;
