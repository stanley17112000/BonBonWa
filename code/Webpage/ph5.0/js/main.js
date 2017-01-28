var thisColor = 0;
var fingerFlag = 0;
var started = 0;
var playingFlag = 0;
var blueScore = 0, redScore = 0;
var homeA = new Audio('audio/home.mp3')
var playA = new Audio('audio/playing.mp3');

function displayLoading(){
  var c = $('.loading').children();
  for( var i = 0; i < c.length; i++){
    c[i].style.top = Math.sin(loading - i)*50 + "%";
  }

  loading += 1;
}



function playingClick(){
    $('.finger').hide();
    ws.send( JSON.stringify( {type:'click'} ) );
}

function showLoginStuff(){
  $('.loginStuff').show('slow');

}

function showMainPage(){
  $('.welcomepage').hide();
  $('.homepage').show( 'slow' );
  started = 1;
}

function sendPlayRequest(){
    ws.send( JSON.stringify( {type:'request'} ) );

}


function moveUpLogo(){

  $('.logo').animate(
      {
          marginTop: '10%',


      },2000,'swing', showLoginStuff

    );
}

function returnToMainPage(){
  $('.endingpage').hide();
  $('.playingpage').css({'opacity':1});
  $('.playingpage').hide();
  $('.bluewave').css({'height':'50%'});
  $('.redwave').css({'height':'50%'}); 
  $('.banner').css({'height': ''});
  $('.homepage').show();
  $('.rankstuff').hide();
  $('.bluebc').hide();
  $('.redbc').hide();
  homeA.play();
  playA.pause();

}

function showRankStuff(){
  $('.rankstuff').show('normal');
  $('.score-red,.score-blue').counterUp({
    delay: 10, // the delay time in ms
    time: 1000 // the speed time in ms
  });
  setTimeout( showEndingFooter, 2000 );

}

function showEndingFooter(){
  $('.endingpagefooter').show( 'slow' );
}

function moveUpRank(){

  $('.banner').animate(
      {
          height: '70%',


      },2000,'swing',showRankStuff

    );
}

function init(){


  loading = 0;
  homeA.play();
  setTimeout( moveUpLogo , 2000);
  setInterval( displayLoading , 100 );

  waiting = false;

  var height = 0.5;
  
  ws = new WebSocket("ws://103.253.147.252:8888/ws");
           
  // Handle incoming websocket message callback
  ws.onmessage = function(evt) {

      if ( !started ) return;

      var msg = JSON.parse( evt.data );
      console.log( evt.data )
      var state = msg['state'];


      if ( state == 'waiting-exp' ){
          // change the page to loading page

        $('.loadingpage').show();
        $('.homepage').hide();

      }
      else if ( state == 'init' ){
          var color = msg['color'];
          thisColor = color;
          fingerFlag = true;
          $('.pendingpage').show();
          $('.loadingpage').hide();

          for ( var i = 0 ; i < 5 ; i++ )
              $('.dot'+i).show();
          if ( color == 0 ){
            $('.bluebc').show();


          } // BLUE
          else{
            $('.redbc').show();
       
          }


      }

      else if ( state == 'playing' ){
          var flag = msg['flag'];
          
          if ( fingerFlag ){ 
               $('.finger').show();
              fingerFlag = false;
              /*
              var circle = new ProgressBar.Circle('#clock-container', {
                  color: '#FCB03C',
                  strokeWidth: 3,
                  trailWidth: 1,
                  duration: 1500,
                  text: {
                      value: '0'
                  },
                  step: function(state, bar) {
                      bar.setText((bar.value() * 100).toFixed(0));
                  }
              });

              circle.animate(1, function() {
                  circle.animate(0);
              })*/

          }

          if ( flag ){ // current playing is playing
              $('.playingpage').show();
              $('.pendingpage').hide();
              homeA.pause()
              playA.play()
              playingFlag = true;
              var scoreRed = msg['red'], scoreBlue = msg['blue'], remainSec = msg['secs'];
              //  100             120
              var delta = 0, avg = (scoreBlue + scoreRed ) / 2;
              if ( thisColor == 0 ) // blue
                  delta = scoreBlue - avg;              
              else
                  delta = scoreRed  - avg;

              var percent = 50 + delta * 6 / ( scoreBlue + scoreRed + 1) + "%";
              
              $('.wave').animate({
                height: percent
              },1000);

              $('.score-red').text(scoreRed);
              $('.score-blue').text(scoreBlue); 



          }
          else{
              var remainSec = msg['secs'];

          }

      }
      else if ( state == 'pending' ){
          var flag = msg['flag'];
          if ( flag ){ // after 5 secs the game will start
              var remainSec = msg['secs'];
              $('.dot'+(4-remainSec)).hide();
          }
          else{
              var remainSec = msg['secs'];
          }

      }
      else{ // waiting

          var currentPlayer = msg['currentPlayer'];
          var queuedPeople = document.getElementById( "playerCnt" );
          queuedPeople.innerHTML = currentPlayer;

          if ( playingFlag ){
              playingFlag = false;
              $('.playingpage').animate({
                opacity: 0.5
              },1000);
              $('.endingpage').show();
              setTimeout( moveUpRank , 1000); /// call rankstuff
          }

      }

      
  };

  // Close Websocket callback
  ws.onclose = function(evt) {
    //log("***Connection Closed***");
    alert("Connection close");

  };

  // Open Websocket callback
  ws.onopen = function(evt) { 

    //log("***Connection Opened***");
  };

  
  
}
