var interval = setInterval(engine, 20);
var text = document.getElementById('title');
var container = document.getElementById('container');
var x = 100;
var y = 100;
var xSpeed = 3;
var ySpeed = 2;

function engine() {
	textMovement();
	bounce();
}

function textMovement() {
	x += xSpeed;
	y += ySpeed;
	text.style.left = x + 'px';	
	text.style.top = y + 'px';
}

function bounce() {
	if(x -5 < 0 || x + text.offsetWidth + 5 > container.offsetWidth) {
		xSpeed *= -1;
	}

	if(y - 10 < 0 || y + text.offsetHeight - 7 > container.offsetHeight) {
		ySpeed *= -1;
	}
}