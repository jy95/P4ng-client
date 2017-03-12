const props = require('../../../properties-loader.js')
const {NORTH, EAST, WEST, SOUTH} = props.gameConsts
const Game = require('./objects/Game.js')

var gameEventEmitter = new (require('events'))()

var currentGame = null

var timeoutExpired = true

var updateTimeout

// beginningDirection is used only when joining an existing game
module.exports.initGame = function(id){
    timeoutExpired = true
    currentGame = new Game(id)
    timeoutExpired = true
    return currentGame.ball.direction;
}

// subscribe to state update
module.exports.subscribe = function(callback){
    gameEventEmitter.on('gameStateUpdate', function(){
        callback()
    })
}


module.exports.subscribeStart = function(callback){
    gameEventEmitter.on('gameStart', function(){
        callback()
    })
}
// this JSON player needs an id and a side
// if he has no side, he is given a remaining side
module.exports.addPlayer = function(player){
    if(currentGame && !currentGame.isFinished)
    currentGame.addPlayer(player)
}

module.exports.startGame = function({angle}){
    if(currentGame && !currentGame.isFinished){
        console.log('gameLogic - startGame')

        for(let i = currentGame.sides.length; i < 4; i++){
            currentGame.addPlayer({id: -i})
            currentGame.wallPlayer(-i)
        }

        currentGame.ball.direction = angle
        currentGame.ball.beginningDirection = angle
        doUpdate()
        gameEventEmitter.emit('gameStart')
    }
}

function doUpdate(){
    if(currentGame.canUpdate() && timeoutExpired){
        currentGame.ball.move()

        for (let paddle of currentGame.sides)
        paddle.move()

        gameEventEmitter.emit('gameStateUpdate')
        timeoutExpired = false
        updateTimeout = setTimeout(function(){
            timeoutExpired = true
            doUpdate()
        }, 17)
    }
}

module.exports.killGame = function(){
    if(currentGame){
        if(updateTimeout)clearTimeout(updateTimeout)
        delete currentGame.ball.game // I'm afraid of circular references
        currentGame = null
        gameEventEmitter.emit('gameStateUpdate')
    }
}
// returns a JSON with all the data needed to display the game
module.exports.getState = function(){
    return currentGame ? currentGame.toJSON() : null
}

module.exports.updatePlayer = function({id,position}){
    if(currentGame){
        let p = currentGame.players[id]
        if(!p.isLocal){
            p.setPosition(position)
            doUpdate()
        }
    }
}

module.exports.movePlayerLeft = function({side}){
    if(currentGame)
    currentGame.sides[side].movingLeft()
}

module.exports.movePlayerRight = function({side}){
    if(currentGame)
    currentGame.sides[side].movingRight()
}

module.exports.stopPlayer = function({side}){
    if(currentGame)
    currentGame.sides[side].stop()
}

module.exports.wallPlayer = function({id}){
    if(currentGame && !currentGame.isFinished){
        currentGame.players[id].wallMe()
        currentGame.players[id].move()
        doUpdate()
    }
}
