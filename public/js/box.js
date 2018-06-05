// class Box {
//   constructor(x,y) {
//     const box = game.add.sprite(x,y,'box');
//     box.anchor.setTo(0.5,0.5);
//     box.enableBody = true;
//     box.physicsBodyType = Phaser.Physics.ARCADE;
//     game.physics.enable(box, Phaser.Physics.ARCADE);
//     game.physics.enable(box)
//   this.sprite= box;
//  }
//
// }
//
// window.Box = Box;

/* global game */

var Box = function (game,box, startX, startY) {
  var x = startX
  var y = startY

  this.game = game
  this.health = 3
  this.alive = true

  this.box = game.add.sprite(x, y, 'box')
  this.box.anchor.setTo(0.5, 0.5)

  game.physics.enable(this.box, Phaser.Physics.ARCADE)
  this.box.body.immovable = true
  this.box.body.collideWorldBounds = true
}

Box.prototype.update = function () {

}

window.Box = Box
