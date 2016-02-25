var Game = require("../../api/index.js");
var Image = Game.Image;
var screen = Game.screen;
var Sprite = Game.Sprite;
var Canvas = Game.Canvas;
var awaitImages = Game.awaitImages;

var playerFacingLeft = new Image('images/Idle.png');
var playerFacingRight = new Image('images/IdleRight.png');
var floor = new Image('images/Floor.png');
var coins = [];
for (var i=1;i<=8;i++){
  coins[i-1] = new Image('images/Coin/coin_'+ i +'.png');
}
var waters = [];
for (var i=1;i<=8;i++){
  waters[i-1] = new Image('images/Water/water_'+ i +'.png');
}
var o = 0;
awaitImages([playerFacingRight,playerFacingLeft,floor].concat(coins).concat(waters),function(){
  coins.forEach(function(coin){
    coin.w = 64;
    coin.h = 64;
  });
  
  var sprite = new Sprite(playerFacingLeft,10,10);
  screen.registerSprite(sprite, "object");
  var rigidSprite = new Game.RigidBody(sprite,sprite.collision);
  var floorSprite = new Sprite(floor,10,300);
  var floorSprite2 = new Sprite(floor,200,250);
  var floorSprite3 = new Sprite(floor,200,10);
  var coin = new Sprite(coins[0],-80,250);
  var mousepos = new Sprite(coins[0],0,0);
  screen.registerSprite(floorSprite, "background");
  screen.registerSprite(floorSprite2, "background");
  screen.registerSprite(floorSprite3, "background");
  screen.registerSprite(coin, "trigger");
  screen.registerSprite(mousepos, "trigger");
  var coinState = 1;
  
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
    if(sprite.y > screen.h){
      rigidSprite.applyForce(0,-200);
    }
    screen.camera.centerOn(sprite,screen);
    
    coinState += deltaTime * 10;
    if(Math.floor(coinState) > 7){
      coinState = 0;
    }
    
    coin.update(coins[Math.floor(coinState)]);
    
    
    mousepos.x = screen.mouseX - screen.camera.x;
    mousepos.y = screen.mouseY - screen.camera.y;
  });
  rigidSprite.on('colliderEnter',function(){
    
  });
  Game.events.on('draw',function(deltaTime){
    screen.clear();
    screen.spriteList.draw();
  });
  Game.events.on('resize',function(){
    
  });
  Game.events.on('mousemove',function(mx,my){
    console.log(mx == screen.mouseX,my == screen.mouseY);
  });
});

