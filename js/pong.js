var canvas;

//scaleable
const movement = 5;
//ball
var ballX = 200;
var ballY = 200;
var diameter = 15;
var radius = diameter/2;
var ballSpeedX = 5;
var ballSpeedY = 3;
var bounceAngle;
//paddle
var paddleX = 50;
var paddleY = 200;
var paddleWidth = 10;
var paddleHeight = 60;
//prediction
var predictionX;
var predictionY;
var predictionSpeedX;
var predictionSpeedY;
var needPrediction = true;
var predictionStarted = false;
var finalprediction;
var offset;

//draws the ball and paddle
function animation() {
	ellipse(ballX, ballY, diameter, diameter);
	rect(paddleX, paddleY, paddleWidth, paddleHeight);
}


//collision
//bounces ball against the wall
function wallCollision() {
	if(ballY - radius <= 0){
		ballSpeedY *= -1;
	}

	if(ballY + radius >= windowHeight){
		ballSpeedY *= -1;
	}

	if(ballX - radius <= 0){
		failure();
	}

	if(ballX + radius >= windowWidth){
		ballSpeedX *= -1;
	}
}

function paddleCollision() {
	if(paddleX < ballX && ballX < paddleX+paddleWidth) {
		if(ballY > paddleY && ballY < paddleY + paddleHeight){
			setTimeout(function(){predictionStarted = false},100);
			setTimeout(function(){needPrediction = true},100);
			bounce();
		}
	}
}

function bounce() {
	bounceAngle = ((ballY-(paddleY+paddleHeight/2))/(paddleHeight/2))*5;
	ballSpeedY = bounceAngle;
	ballSpeedX *= -1;
}

//movement
//moves paddle
function paddleMovement() {
	if(paddleY + offset != Math.ceil(finalprediction / movement) * movement) {
		if(paddleY + offset < finalprediction){
			paddleY += movement;
		} else if(paddleY + offset > finalprediction) {
			paddleY -= movement;
		}

	}
}



function failure() {
	ballX = 200;
	ballY = 200;
	diameter = 15;
	radius = diameter/2;
	ballSpeedX = 5;
	ballSpeedY = 3;
	bounceAngle;
	//paddle
	paddleX = 50;
	paddleY = 200;
	paddleWidth = 10;
	paddleHeight = 60;
	//prediction
	predictionX;
	predictionY;
	predictionSpeedX;
	predictionSpeedY;
	needPrediction = true;
	predictionStarted = false;
	finalprediction;
	offset;
}
//moves ball
function ballMovement(){
	ballX += ballSpeedX;
	ballY += ballSpeedY;
}
  






function predictionBounce() {

	if(predictionY - radius <= 0){
		predictionSpeedY *= -1;
	}

	if(predictionY + radius >= windowHeight){
		predictionSpeedY *= -1;
	}

	if(predictionX - radius <= 0){
		predictionSpeedX *= -1;
	}

	if(predictionX + radius >= windowWidth){
		predictionSpeedX *= -1;
	}
}

function mouseClicked() {
	console.log('clickedBall');
	ballSpeedX *= Math.floor(Math.random()*1)-1;
	ballSpeedY *= Math.floor(Math.random()*1)-1;
	window.setTimeout(function(){
		needPrediction = true;
		predictionStarted = false;
	}, 100);
}


function prediction() {
	fill('red');
	ellipse(predictionX, predictionY, diameter, diameter);
	if(needPrediction == true){
		if(predictionStarted == false){
			predictionX = ballX;
			predictionY = ballY;
			predictionSpeedX = ballSpeedX * 3;
			predictionSpeedY = ballSpeedY * 3;
			predictionStarted = true;
			offset = (Math.floor(Math.random()*8) + 4) * movement;
			console.log()
		}
		if(predictionX - paddleWidth/2 <= paddleX) {
			finalprediction = predictionY;
			finalpredictionX = predictionX;
			needPrediction = false;
			predictionStarted = false;
			predictionX = -10;
			predictionY = -10;
			predictionSpeedX = 0;
			predictionSpeedY = 0;
		} else {
			predictionX += predictionSpeedX;
			predictionY += predictionSpeedY;
		}
	}
}









function resize() {
	resizeCanvas(windowWidth, windowHeight);
}




function setup() {
	frameRate(60);
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0,0, 'fixed');
	canvas.style('z-index', '-5');
}

function draw() {
	resize();
	fill('white');
	animation();
	paddleMovement();
	wallCollision();
	paddleCollision();
	predictionBounce();
	ballMovement();
	prediction();
}