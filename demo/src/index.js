var Game = require("../../api/index.js");
var Image = Game.Image;
var screen = Game.screen;
var Sprite = Game.Sprite;
var Canvas = Game.Canvas;

var image = new Image('https://i-msdn.sec.s-msft.com/dynimg/IC131527.gif');
image.on('load',function(){
  image.draw(screen,50,50);
});
Game.events.on('resize',function(){
  image.draw(screen,50,50);
});