$(function () {
  var socket = io();
  var l = null
  //action selection, either create or join a lobby
  $("#create").click(() => {
    $(".page.selection").fadeOut();
    $(".page.create").show();
    $(".page.selection").off('click');
  });

  $("#join").click(() => {
    $(".page.selection").fadeOut();
    $(".page.join").show();
    $(".page.selection").off('click');
  });


  //finish action, form has been filled and button is pressed
  $("#create-game").click(() => {
    if (!$('.username-create').val()) return
    let username = $('.username-create').val().trim()
    let lobby = lcode()
    $("#create-game").toggleClass("is-loading");
    socket.emit('createLobby', lobby);
    l = io('/' + lobby)
    createLobby(l)
    l.emit('addUser', username, createid());
  });

  $("#join-game").click(() => {
    if (!$('.username-join').val()) return
    if (!$('.join-code').val()) return
    let username = $('.username-join').val().trim()
    let lobby = $('.join-code').val().trim()
    $("#join-game").toggleClass("is-loading");
    l = io('/' + lobby)
    createLobby(l)
    l.emit('addUser', username, createid());
  });



  socket.on('disconnect', () => {
    console.log('disconnect');
  });

  socket.on('reconnect', () => {
    console.log('you have been reconnected');

  });

  socket.on('reconnect_error', () => {
    console.log('attempt to reconnect has failed');
  });
});


//lobby code function
function lcode() {
  var abc = 'abcdefghijklmnopqrstuvwxyz'.split('')
  let code = ''
  for (var i = 0; i < 6; i++) {
    code += abc[Math.floor(Math.random() * abc.length)]
  }
  return code
}

//its a pain to make this above so why not make it a function
function createLobby(l) {
  //joining lobbies fuck
  l.on('joinLobby', (lobby, data) => {
    //remove other pages
    $(".page.create").fadeOut();
    $(".page.join").fadeOut();
    $(".page.game").hide();
    $(".page.selection").hide();
    $(".page.queue").show();
    //game lobby code
    $("#game-code").text('Code: ' + lobby)

    //create user list
    let li = []
    for (var i = 0; i < data.users.length; i++) {
      li.push(`<li>${data.users[i].n}</li>`)
    }
    $('.players').html(li.join(''))
    if (data.users.length === 1) {
      $('#start-game').attr("disabled", false);
      $('#start-game').click(() => {
        l.emit('startGame')
      })
    }
  });


//lobby fuckery
  l.on('leftLobby', (lobby, data) => {
    //recreate user list
    let li = []
    for (var i = 0; i < data.users.length; i++) {
      li.push(`<li>${data.users[i].n}</li>`)
    }
    $('.players').html(li.join(''))
  });

  //game shit
  let selected = []  
  
$("#reset").click(() => {
  selected = []
  $('.card').removeClass('selected')
})
  /*
    * Number (1, 2, 3)
    * Color (red, green, purple)
    * Fill (none, solid, stripped)
    * Shape (diamond, oval, squiggle)
  */


//every loves when the game starts and u dont know how to do shit
  l.on('startGame', (data) => {
    let users = data.users
    let board = data.board
    //create player/user list
    for (var i = 0; i < users.length; i++) {
      $("#scores").find('tbody')
        .append($('<tr>')
          .append($(`<td id="${users[i].id.replace(/ /g, '--')}">`).text(users[i].n))
          .append($(`<td id="${users[i].id.replace(/ /g, '--')}-s">`).text(users[i].s))
    )
    }

    //add started game log
    addLog('GAME', 'Started Game', '-')
    addLog('GAME', 'Dealt Board', createBoard(board, true), true)


    //create board
    $('.board').html(createBoard(board))

    $(".page.queue").fadeOut();
    $(".page.game").show();
    $(`.card`).click(element => {
      if (selected.length >= 3) return l.emit('set', selected)
      let e = $(element.currentTarget);
      if (!e.hasClass("selected")) selected.push(element.currentTarget.id);
      else selected = selected.filter(x => x !== element.currentTarget.id);
      e.toggleClass("selected");
      if (selected.length >= 3) l.emit('set', selected)
    });
  })

  l.on('setTaken', (user, score, boardData, end, users, currentUser) => {
    if (boardData.set) addLog(user.username, 'Took Set', createBoard(boardData.set, true), true, score.added)
    $(`#${user.id.replace(/ /g, '--')}-s`).text(score.s)
    $('.board').html(createBoard(boardData.board, false, boardData.added)) 
    animateCards(100)
    $(`.card`).click(element => {
      if (selected.length >= 3) return
      let e = $(element.currentTarget);
      if (!e.hasClass("selected")) selected.push(element.currentTarget.id);
      else selected = selected.filter(x => x !== element.currentTarget.id);
      e.toggleClass("selected");
      if (selected.length >= 3) l.emit('set', selected)
    });
    if (boardData.added) addLog('GAME', 'Added Cards', createBoard(boardData.added, true), true)
    $('.card').removeClass('selected')
    selected = []
    if (end) {
      $("#winner").text(`${users[0].n} with ${users[0].s} sets!`)
      $('#end-modal').toggleClass('is-active')

      $("#play-again").click(() => {
        $(".page.game").hide();
        $(".page.selection").hide();
        let lobby = lcode()
        $("#create-game").toggleClass("is-loading");
        socket.emit('createLobby', lobby);
        l = io('/' + lobby)
        createLobby(l)
        l.emit('addUser', currentUser);
      })

    }
  })


  window.addEventListener("beforeunload", function (e) {
    l.emit('removeUser')
  });
}


let cards = ["1-1-1-1", "1-1-1-2", "1-1-1-3", "1-1-2-1", "1-1-2-2", "1-1-2-3", "1-1-3-1", "1-1-3-2", "1-1-3-3", "1-2-1-1", "1-2-1-2", "1-2-1-3", "1-2-2-1", "1-2-2-2", "1-2-2-3", "1-2-3-1", "1-2-3-2", "1-2-3-3", "1-3-1-1", "1-3-1-2", "1-3-1-3", "1-3-2-1", "1-3-2-2", "1-3-2-3", "1-3-3-1", "1-3-3-2", "1-3-3-3", "2-1-1-1", "2-1-1-2", "2-1-1-3", "2-1-2-1", "2-1-2-2", "2-1-2-3", "2-1-3-1", "2-1-3-2", "2-1-3-3", "2-2-1-1", "2-2-1-2", "2-2-1-3", "2-2-2-1", "2-2-2-2", "2-2-2-3", "2-2-3-1", "2-2-3-2", "2-2-3-3", "2-3-1-1", "2-3-1-2", "2-3-1-3", "2-3-2-1", "2-3-2-2", "2-3-2-3", "2-3-3-1", "2-3-3-2", "2-3-3-3", "3-1-1-1", "3-1-1-2", "3-1-1-3", "3-1-2-1", "3-1-2-2", "3-1-2-3", "3-1-3-1", "3-1-3-2", "3-1-3-3", "3-2-1-1", "3-2-1-2", "3-2-1-3", "3-2-2-1", "3-2-2-2", "3-2-2-3", "3-2-3-1", "3-2-3-2", "3-2-3-3", "3-3-1-1", "3-3-1-2", "3-3-1-3", "3-3-2-1", "3-3-2-2", "3-3-2-3", "3-3-3-1", "3-3-3-2", "3-3-3-3"]

let colors = ["e74c3c", "27ae60", "8e44ad"]
function createBoard(b, small, added) {
  let board = []
    for (var i = 0; i < b.length; i++) {
      let card = cards[b[i] - 1].split('-')
      var color = ''
      if (card[1] == 1) color = 'red'
      else if (card[1] == 2) color = 'green'
      else if (card[1] == 3) color = 'purple'

      var fill = '#' + colors[parseInt(card[1]) - 1]
      if (card[2] == 1) fill = 'none'
      else if (card[2] == 2) fill = '#' + colors[parseInt(card[1]) - 1]
      else if (card[2] == 3) {
        fill = `url(#striped-${color}` 
        if (small) fill += added && added.includes(b[i]) ? '-small' : '' 
        fill += ')'
      }

      let path = paths[parseInt(card[3])-1]
      let clas = small ? 'card-small' : 'card'
      let eclass = added && added.includes(b[i]) ? '' : 'fadeIn'
      let str = `<div id="card-${b[i]}" class="${clas} fill-${color} ${eclass}"><div class="card-content">`
      for (var y = 0; y < card[0]; y++) {
        str += `<svg viewBox="-2 -2 54 104"><path d="${path}" fill="${fill}"></path></svg>`
      }

      str += `</div></div>`
      
      board.push(str)
    }
    return board.join('')
}

function addLog(user, action, desc, cards, color) {
  let clas = cards ? 'class="card-group"' : ''
  let cclass = ''
  if (color == 1) cclass = 'class="has-background-success"'
  if (color == -1) cclass = 'class="has-background-danger"'
  $("#logs").find('tbody')
  .prepend(`<tr ${cclass}><td>${user}</td> <td>${action}</td> <td ${clas}>${desc}</td></tr>`)
}


function animateCards(delay){
  $('.card:not(.fadeIn)').each(function(i){
    var card = $(this);
    setTimeout(function(){
      card.addClass('fadeIn');
    },delay*i);
  });
}

function createid() {
  let abc = "abcdefghijklmnopqrstuv1234567890".split("");
  let str = "";
  for (var i = 0; i < 15; i++) {
    str += abc[Math.floor(Math.random() * abc.length)];
  }
  return str;
}

const paths = ["M25 0 L50 50 L25 100 L0 50 Z", "M25,99.5C14.2,99.5,5.5,90.8,5.5,80V20C5.5,9.2,14.2,0.5,25,0.5S44.5,9.2,44.5,20v60 C44.5,90.8,35.8,99.5,25,99.5z", "M38.4,63.4c0,16.1,11,19.9,10.6,28.3c-0.5,9.2-21.1,12.2-33.4,3.8s-15.8-21.2-9.3-38c3.7-7.5,4.9-14,4.8-20 c0-16.1-11-19.9-10.6-28.3C1,0.1,21.6-3,33.9,5.5s15.8,21.2,9.3,38C40.4,50.6,38.5,57.4,38.4,63.4z"]


