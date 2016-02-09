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
  var floorSprite = new Sprite(floor,10,300);
  screen.registerSprite(floorSprite, "background");
  sprite.do.jump = function(){
    direction['jump'] = true;
  };
  
  var velocity = 0;
  var velocityX = 0;
  
  var speed = 100;
  
  var direction = {};
  Game.events.on('keydown',function(key){
    if(key == "right arrow"){
      direction['right'] = true;
      sprite.image = playerFacingRight;
    }
    if(key == "up arrow"){
      if(sprite.collision.colliding()){
        velocity = -100;
      }
    }
    if(key == "left arrow"){
      direction['left'] = true;
      sprite.image = playerFacingLeft;
    }
  });
  Game.events.on('keyup',function(key){
    if(key == "left arrow"){
      direction['left'] = false;
    }
    if(key == "right arrow"){
      direction['right'] = false;
    }
  });
  Game.events.on('update',function(deltaTime){
    screen.clear();
    //sprite.x += 100 * deltaTime;
    if(direction['left']){
      sprite.x -= speed * deltaTime;
    }
    if(direction['right']){
      sprite.x += speed * deltaTime;
    }
    sprite.y += velocity * deltaTime;
    velocity += 5;
    if(sprite.collision.onGround()){
      velocity = 0;
    }
  });
  Game.events.on('draw',function(){
    screen.spriteList.draw(true);
  });
  Game.events.on('resize',function(){
    
  });
});

