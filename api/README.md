# Documentation can be generated with yuidoc or might be available in the npm folder

## Example project:
https://github.com/pfgithub/jameaypi/tree/master/demo

## Usage:
I recommend you use this setup to require things:
    var Game = require("ja-game-api");
    var Image = Game.Image;
    var screen = Game.screen;
    var Sprite = Game.Sprite;
    var Canvas = Game.Canvas;
    var awaitImages = Game.awaitImages;
### Making a basic game:
    var playerImage = new Image('images/Idle.png'); // First require your image (spritesheets don't work yet, sorry)
    // You do all your game logic and stuff inside the awaitImages function
    
    awaitImages([playerImage],function(){ //  Arrays can easily be concatinated with [].concat([])
        var player = new Sprite(player,10,10); // Everything is a sprite
        // Sprites are organized into spritesheets, which handle collision and drawing.
        screen.registerSprite(sprite, "object"); // Register your sprite. "object" for a collider, background for a collider, WIP trigger for a trigger, WIP: and undefined for no collider
        
        // Let's make the sprite a rigidbody so we can control it
        var rigidPlayer = new Game.RigidBody(player,player.collision); // Make a new rigidbody for the player
        
        // Now for our game loop
        // The game calls update and then draw.
        
        Game.events.on('update',function(deltaTime){ // Deltatime is the ms since last update. Used for smooth motion
            if(Game.events.keys['left arrow']) // Check if the key is down (added in 1.3.1)
                rigidSprite.applyForce(-10,0); // Apply a leftwards force to the rigidbody
            if(Game.events.keys['right arrow'])
                rigidSprite.applyForce(10,0);
            if(Game.events.keys['up arrow'])
                if(rigidSprite.onGround) // Check if the rigidbody is on the ground
                    rigidSprite.applyForce(0,-200); // Apply an upwards force
            
            // Now we update the rigidsprite
            rigidSprite.update(deltaTime);
            
            // And we center the screen on the sprite (optional)
            screen.camera.centerOn(sprite,screen);
        }
        Game.events.on('draw',function(deltaTime){
            screen.clear(); // The draw is simple. We clear thes creen
            screen.spriteList.draw(); // and draw the spritelsit
        });
        
        // That's it, we have a basic game. Try adding some platforms to stand on.
    }