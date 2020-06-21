var charState = 0;

function add() {

  if(charState == 6){
    lose();
  } else {
    charState++;
  }

switch(charState){
  case 0:
    document.getElementById('charImage').src = 'images/char/char0.6.png'
    break;
  case 1:
    document.getElementById('charImage').src = 'images/char/char1.6.png'
    break;
  case 2:
    document.getElementById('charImage').src = 'images/char/char2.6.png'
    break;
  case 3:
      document.getElementById('charImage').src = 'images/char/char3.6.png'
      break;
  case 4:
      document.getElementById('charImage').src = 'images/char/char4.6.png'
      break;
  case 5:
      document.getElementById('charImage').src = 'images/char/char5.6.png'
      break;
  case 6:
      document.getElementById('charImage').src = 'images/char/char6.6.png'
      break;

}
  }
