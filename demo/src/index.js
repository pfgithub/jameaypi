var Game = require("../../api/index.js");
var Image = Game.Image;
var screen = Game.screen;
var Sprite = Game.Sprite;
var Canvas = Game.Canvas;
var awaitImages = Game.awaitImages;

var image = new Image('https://i-msdn.sec.s-msft.com/dynimg/IC131527.gif');
var o = 0;
awaitImages([image],function(){
  var sprite = new Sprite(image,10,10);
  screen.registerSprite(sprite);
  
  var speed = 500;
  
  var direction = {};
  Game.events.on('keydown',function(key){
    if(key == "left arrow"){
      direction['left'] = true;
    }
    if(key == "right arrow"){
      direction['right'] = true;
    }
    if(key == "up arrow"){
      direction['up'] = true;
    }
    if(key == "down arrow"){
      direction['down'] = true;
    }
  });
  Game.events.on('keyup',function(key){
    if(key == "left arrow"){
      direction['left'] = false;
    }
    if(key == "right arrow"){
      direction['right'] = false;
    }
    if(key == "up arrow"){
      direction['up'] = false;
    }
    if(key == "down arrow"){
      direction['down'] = false;
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
    if(direction['up']){
      sprite.y -= speed * deltaTime;
    }
    if(direction['down']){
      sprite.y += speed * deltaTime;
    }
  });
  Game.events.on('draw',function(){
    screen.spriteList.draw();
  });
  Game.events.on('resize',function(){
    
  });
});

