var lettersLeft = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
var guesses = [];

var wordOptions = "career,guarantee,image,program,pattern,splurge,fairy,wake,imagine,small,spy,safari,assumption,paper,owner,oil,complex,wriggle,proud,ready,hiccup,drug,ward,fresh,agent,senior,means,level,vision,marsh,node,bang,fraud,manufacturer,hardship,potential,leg,sweet,mind,concept,infect,effect,produce,budget,likely,chalk,part,quarter,personality,degree,coup,fence,win,adult,knit,slam,falsify,suite,concern,object,introduction,riot,seller,location,driver,pastel,agony,tumour,variation,separation,ideal,opposed,audience,"



var winningWord = [];
var currentStatus = ['_'];
var correct;
var temp;
var gameState;
var n;

function newWord(){
  wordOptions = wordOptions.split(',');
  n = Math.floor(Math.random()*wordOptions.length)+1;
  winningWord = wordOptions[n].split('');
}

newWord();

function game(){
  document.getElementById('lettersleft').innerHTML = lettersLeft;
}

function guess(letter){
document.getElementById('inputForm').reset();
if(gameState != 'lost' && gameState != 'won' && letter != ' ' && letter != ''){
if(lettersLeft.indexOf(letter) >= 0){
  guesses.push(letter);
  for(i=0;i<winningWord.length; i++){
    if(letter.toLowerCase() == winningWord[i]){
      currentStatus[i] = letter;
      correct = true;
      updateWord();
  }
}
if(correct != true){
  add();
}
correct = false;
}

lettersLeft = lettersLeft.replace(letter.toLowerCase(), '');
}
}

function updateWord(){
  temp = currentStatus.toString();
  temp = temp.replace(/,/g, ' ');
  document.getElementById('word').innerHTML = temp;
}

function start() {
  for(i=0; i < winningWord.length-1; i++) {
    currentStatus.push('_');
  }
  updateWord();
}

function checkWin(){
  if(temp.indexOf('_') == -1){
    win();
  }
}


function lose(){
  gameState = 'lost';
  document.getElementById('word').innerHTML = winningWord.toString().replace(/,/g, ' ');
  document.getElementById('word').style.color = 'red';
}
function win(){
  gameState = 'won';
  document.getElementById('word').style.color = 'green';
}


start();
//updates the screen every 100 miliseconds
window.setInterval(() => {
checkWin();
game();
}, 100)
