var Game = require("../../api/index.js");
var Image = Game.Image;
var screen = Game.screen;
var Sprite = Game.Sprite;
var Canvas = Game.Canvas;
var awaitImages = Game.awaitImages;

var playerFacingLeft = new Image('images/Idle.png');
var playerFacingRight = new Image('images/IdleRight.png');
var floor = new Image('images/Floor.png');
var o = 0;
awaitImages([playerFacingRight,playerFacingLeft,floor],function(){
  var sprite = new Sprite(playerFacingLeft,10,10);
  screen.registerSprite(sprite, "object");
  var rigidSprite = new Game.RigidBody(sprite,sprite.collision);
  var floorSprite = new Sprite(floor,10,300);
  var floorSprite2 = new Sprite(floor,200,250);
  var floorSprite3 = new Sprite(floor,200,10);
  screen.registerSprite(floorSprite, "background");
  screen.registerSprite(floorSprite2, "background");
  screen.registerSprite(floorSprite3, "background");
  sprite.do.jump = function(){
    direction['jump'] = true;
  };
  
  var velocity = 0;
  var velocityX = 0;
  
  var speed = 100;
  var toJump;
  
  var direction = {};
  Game.events.on('keydown',function(key){
    if(key == "right arrow"){
      direction['right'] = true;
      sprite.update(playerFacingRight);
    }
    if(key == "up arrow"){
      toJump = true;
    }
    if(key == "left arrow"){
      direction['left'] = true;
      sprite.update(playerFacingLeft);
    }
  });
  Game.events.on('keyup',function(key){
    if(key == "left arrow"){
      direction['left'] = false;
    }
    if(key == "up arrow"){
      toJump = false;
    }
    if(key == "right arrow"){
      direction['right'] = false;
    }
  });
  Game.events.on('update',function(deltaTime){
    if(direction.left){
      rigidSprite.applyForce(-10,0);
    }
    if(direction.right){
      rigidSprite.applyForce(10,0);
    }
    rigidSprite.update(deltaTime);
    
    if(toJump){
      if(rigidSprite.onGround){
        rigidSprite.applyForce(0,-200);
      }
    }
    console.log(sprite.y);
    if(sprite.y > screen.h){
      rigidSprite.applyForce(0,-200);
    }
    screen.camera.x = -sprite.x + screen.w / 2 - sprite.image.w/2;
    screen.camera.y = -sprite.y + screen.h / 2 - sprite.image.h/2;
  });
  Game.events.on('draw',function(){
    screen.clear();
    screen.spriteList.draw();
  });
  Game.events.on('resize',function(){
    
  });
});

