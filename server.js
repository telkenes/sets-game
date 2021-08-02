const http = require('http');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser')
const phin = require('phin')
const sassMiddleware = require("node-sass-middleware");

app.use(sassMiddleware({
  src: __dirname + '/public',
  dest: '/tmp'
}));

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.static('/tmp'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.get("/", async (req, res) => {
  res.render('index')
});

app.get("/game", async (req, res) => {
  res.render('game')
});

app.get("/api/game", async (req, res) => {
  let dummy = {}
  for (var i = 0; i < Object.keys(game).length; i++) {
    dummy[Object.keys(game)[i]] = {
      users: game[Object.keys(game)[i]].users,
      board: game[Object.keys(game)[i]].board,
      deck: game[Object.keys(game)[i]].deck
    }
  }
  res.send(dummy)
});

app.get("/api/owo", async (req, res) => {
  res.send({ length: solutions.length, solutions })
});

app.get("/api/force", async (req, res) => {
  let dummy = {}
  for (var i = 0; i < Object.keys(game).length; i++) {
    /*dummy[Object.keys(game)[i]] = {
      users: game[Object.keys(game)[i]].users,
      board: game[Object.keys(game)[i]].board,
      deck: game[Object.keys(game)[i]].deck
    }*/
    dummy[Object.keys(game)[i]] = findSets(game[Object.keys(game)[i]].board)
  }
  res.send(dummy)
})

app.get("/api/force-find", async (req, res) => {
  if (!req.query.board) return res.send("no board query")
  let b = req.query.board.split(',').map(x => Number(x))
  let dummy = findSets(b)
  res.send(dummy)
})


app.use(function (req, res) {
  res.status(404).render('404');
});


let listener = server.listen('3000', function () {
  console.log(`Website started on port 3000`)
});

let game = { "lobby": { "users": [], "board": [], "deck": [] } }

let cards = ["1-1-1-1", "1-1-1-2", "1-1-1-3", "1-1-2-1", "1-1-2-2", "1-1-2-3", "1-1-3-1", "1-1-3-2", "1-1-3-3", "1-2-1-1", "1-2-1-2", "1-2-1-3", "1-2-2-1", "1-2-2-2", "1-2-2-3", "1-2-3-1", "1-2-3-2", "1-2-3-3", "1-3-1-1", "1-3-1-2", "1-3-1-3", "1-3-2-1", "1-3-2-2", "1-3-2-3", "1-3-3-1", "1-3-3-2", "1-3-3-3", "2-1-1-1", "2-1-1-2", "2-1-1-3", "2-1-2-1", "2-1-2-2", "2-1-2-3", "2-1-3-1", "2-1-3-2", "2-1-3-3", "2-2-1-1", "2-2-1-2", "2-2-1-3", "2-2-2-1", "2-2-2-2", "2-2-2-3", "2-2-3-1", "2-2-3-2", "2-2-3-3", "2-3-1-1", "2-3-1-2", "2-3-1-3", "2-3-2-1", "2-3-2-2", "2-3-2-3", "2-3-3-1", "2-3-3-2", "2-3-3-3", "3-1-1-1", "3-1-1-2", "3-1-1-3", "3-1-2-1", "3-1-2-2", "3-1-2-3", "3-1-3-1", "3-1-3-2", "3-1-3-3", "3-2-1-1", "3-2-1-2", "3-2-1-3", "3-2-2-1", "3-2-2-2", "3-2-2-3", "3-2-3-1", "3-2-3-2", "3-2-3-3", "3-3-1-1", "3-3-1-2", "3-3-1-3", "3-3-2-1", "3-3-2-2", "3-3-2-3", "3-3-3-1", "3-3-3-2", "3-3-3-3"]

let solutions = require('./util/solutions.js')

/*
  * create game lobby
    * people join the lobby
    * the guy starts the game
      * the board is sent to everyone
      * people send the set they got to the socket
      * points are given/deducted when a set is taken, at the same time, cards are added
      * 

*/


io.on('connection', async (socket) => {
  let inLobby = false;

  //main server events
  socket.on('createLobby', async (lobby) => {
    if (inLobby) return;

    //create game lobby cache
    game[lobby] = {
      io: io.of('/' + lobby),
      started: false,
      added: false,
      users: [],
      board: [],
      deck: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81])
    }

    inLobby = true;

    //the game lobby socket events(fuck me commenting shit...)
    game[lobby].io.on('connect', (s) => { //secondary socket
      let addedUser = false;
      let currentGame = s.nsp

      //dood joinin a game like a flippin normie
      s.on('addUser', (name, id) => {
        if (game[lobby].started) return
        if (addedUser) return
        game[lobby].users.push({ n: name, id: id, s: 0 })
        addedUser = true
        s.username = name
        s.id = id
        currentGame.emit('joinLobby', lobby, {
          started: game[lobby].started,
          users: game[lobby].users,
          board: game[lobby].board,
          deck: game[lobby].deck
        })
      })

      s.on('removeUser', () => {
        console.log('?')
        /*
        if (addedUser) {
          game[lobby].users = game[lobby].users.filter(x => x.id !== s.id)
          currentGame.emit('leftLobby', lobby, {
            started: game[lobby].started,
            users: game[lobby].users,
            board: game[lobby].board,
            deck: game[lobby].deck
          });
          addedUser = false
          if (game[lobby].users.length === 0 && lobby !== 'lobby') delete game[lobby]
        }*/
      });

      //game bitch
      s.on('startGame', () => {
        if (game[lobby].started) return
        game[lobby].started = true
        game[lobby].time = Date.now(),
        game[lobby].last = [Date.now()]
        deal(lobby)
        currentGame.emit('startGame', {
          started: game[lobby].started,
          users: game[lobby].users,
          board: game[lobby].board,
          deck: game[lobby].deck,
          time: Date.now()
        })
      })

      
      s.on('set', (set) => {
        let user = game[lobby].users.findIndex(user => user.id == s.id)
        let userObj = {
          id: s.id,
          username: s.username
        }
        let c = set.map(x => parseInt(x.replace('card-', '')))
        let boardData = {
          board: null,
          added: null,
          set: set.map(x => parseInt(x.replace('card-', '')))
        }
        let score = {
          s: null,
          added: -1
        }


        //location of each card
        let i1 = game[lobby].board.indexOf(c[0])
        let i2 = game[lobby].board.indexOf(c[1])
        let i3 = game[lobby].board.indexOf(c[2])
        let cc = [cards[c[0] - 1], cards[c[1] - 1], cards[c[2] - 1]] //set array

        if (!game[lobby] || game[lobby].users.length === 0) return
        //check the set
        if (checkSet(cc)) {
          if (!game[lobby].users[user]) game[lobby].users[user] = { n: userObj.username, id: userObj.id, s: 0 }
          /*
            - Add user score
            - Add timestamp for set taken
          */
          game[lobby].users[user].s++;
          game[lobby].last.push(Date.now())

          score.added = 1
          score.s = game[lobby].users[user].s
    
          if (game[lobby].added || game[lobby].deck.length === 0) {
            //remove card not replace
            game[lobby].board = game[lobby].board.filter(x => x !== c[0] && x !== c[1] && x !== c[2])
            game[lobby].added = false
          } else {
            //replace cards
            game[lobby].board[i1] = game[lobby].deck[0]
            game[lobby].board[i2] = game[lobby].deck[1]
            game[lobby].board[i3] = game[lobby].deck[2]
            boardData.added = [game[lobby].deck[0], game[lobby].deck[1], game[lobby].deck[2]]
            game[lobby].deck.splice(0, 3)
          }

          boardData.board = game[lobby].board

          if (findSets(game[lobby].board).length === 0) {
            if (game[lobby].deck.length < 3) {
              let times = []
              for (var i = 0; i < game[lobby].last.length; i++) {
                if (i === 0) continue
                times.push(game[lobby].last[i] - game[lobby].last[i-1])
              }
              let avg = (times.reduce((a, b) => a + b, 0))/(times.length)
              let totalTime = Date.now() - game[lobby].time 
              //id, score, board data, win, users
              currentGame.emit('setTaken', userObj, score, boardData, true, game[lobby].users.sort((a, b) => b.s - a.s), s.username, totalTime, parseTime(avg))
              delete game[lobby]
            } else {
              for (var i = 0; i < 3; i++) {
                if (!boardData.added) boardData.added = []
                boardData.added.push(game[lobby].deck[i])

                game[lobby].board.push(game[lobby].deck[i])
              }
              game[lobby].deck.splice(0, 3)
              game[lobby].added = 1
            }
          }

          currentGame.emit('setTaken', userObj, score, boardData, false)
        } else {
          if (game[lobby] && game[lobby].users && game[lobby].users[user]) game[lobby].users[user].s--;
          score.s = game[lobby].users[user].s
          boardData.board = game[lobby].board
          currentGame.emit('setTaken', userObj, score, boardData, false)
        }
      })




    })
  });

});

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function deal(lobby) {
  for (var i = 0; i < 12; i++) {
    game[lobby].board[i] = game[lobby].deck[i]
  }
  game[lobby].deck.splice(0, 12)

  if (findSets(game[lobby].board).length === 0) {
    for (var i = 0; i < 3; i++) {
      game[lobby].board.push(game[lobby].deck[i])
    }
    game[lobby].deck.splice(0, 3)
    game[lobby].added = true
  }
}

function findSets(board) {
  let setsFound = []
  for (var x = 0; x < board.length; x++) {
    for (var y = 1; y < board.length; y++) { //reduce the first card
      for (var z = 2; z < board.length; z++) { //reduce the second card
        let owo = [cards[board[x] - 1], cards[board[y] - 1], cards[board[z] - 1]]
        //if (checkSet(owo)) console.log(owo)
        if (board[x] !== board[y] && checkSet(owo)) setsFound.push(owo)
      }
    }
  }
  return setsFound
}

function checkSet(cards) {
  let set = true
  var data = {
    number: [],
    color: [],
    fill: [],
    shape: [],
  };
  for (var i = 0; i < cards.length; i++) {
    if (!cards[i]) return
    let card = cards[i].split('-')
    data.number.push(card[0])
    data.color.push(card[1])
    data.fill.push(card[2])
    data.shape.push(card[3])
  }
  for (var array in data) {
    if (checkIfSameOrDifferent(data[array]) === false) set = false;
  }
  return set
}

function checkIfSameOrDifferent(array) {
  var t = false
  var same = true, different = true;
  if (array[0] === array[1]) {
    different = false;
  } else {
    same = false;
  }
  if (array[1] === array[2]) {
    different = false;
  } else {
    same = false;
  }
  if (array[0] === array[2]) {
    different = false;
  } else {
    same = false;
  }

  if (same) t = true
  if (different) t = true
  return t;
}


//var cards = ["1-1-1-1", "1-1-1-2", "1-1-1-3", "1-1-2-1", "1-1-2-2", "1-1-2-3", "1-1-3-1", "1-1-3-2", "1-1-3-3", "1-2-1-1", "1-2-1-2", "1-2-1-3", "1-2-2-1", "1-2-2-2", "1-2-2-3", "1-2-3-1", "1-2-3-2", "1-2-3-3", "1-3-1-1", "1-3-1-2", "1-3-1-3", "1-3-2-1", "1-3-2-2", "1-3-2-3", "1-3-3-1", "1-3-3-2", "1-3-3-3", "2-1-1-1", "2-1-1-2", "2-1-1-3", "2-1-2-1", "2-1-2-2", "2-1-2-3", "2-1-3-1", "2-1-3-2", "2-1-3-3", "2-2-1-1", "2-2-1-2", "2-2-1-3", "2-2-2-1", "2-2-2-2", "2-2-2-3", "2-2-3-1", "2-2-3-2", "2-2-3-3", "2-3-1-1", "2-3-1-2", "2-3-1-3", "2-3-2-1", "2-3-2-2", "2-3-2-3", "2-3-3-1", "2-3-3-2", "2-3-3-3", "3-1-1-1", "3-1-1-2", "3-1-1-3", "3-1-2-1", "3-1-2-2", "3-1-2-3", "3-1-3-1", "3-1-3-2", "3-1-3-3", "3-2-1-1", "3-2-1-2", "3-2-1-3", "3-2-2-1", "3-2-2-2", "3-2-2-3", "3-2-3-1", "3-2-3-2", "3-2-3-3", "3-3-1-1", "3-3-1-2", "3-3-1-3", "3-3-2-1", "3-3-2-2", "3-3-2-3", "3-3-3-1", "3-3-3-2", "3-3-3-3"]

/*
for (var i = 0; i < cards.length; i++) {
  var a = cards[i].split('-')
  for (var x = 0; x < cards.length; x++) {
    var b = cards[x].split('-')
    for (var y = 0; y < cards.length; y++) {
      var c = cards[y].split('-')
      if (a[0] !== b[0]
          && a[1] !== b[1]
          && a[2] !== b[2]
          && a[3] !== b[3]

          && a[0] !== c[0]
          && a[1] !== c[1]
          && a[2] !== c[2]
          && a[3] !== c[3]

          && b[0] !== c[0]
          && b[1] !== c[1]
          && b[2] !== c[2]
          && b[3] !== c[3]
         ) {

        solutions.push((i+1) + '-' + (x+1) + '-' + (y+1))
      } else if (a[0] === b[0]
          && a[1] === b[1]
          && a[2] === b[2]
          && a[3] !== b[3]

          && a[0] === c[0]
          && a[1] === c[1]
          && a[2] === c[2]
          && a[3] !== c[3]

          && b[0] === c[0]
          && b[1] === c[1]
          && b[2] === c[2]
          && b[3] !== c[3]

        ) {
        solutions.push((i+1) + '-' + (x+1) + '-' + (y+1))
      } else if (a[0] === b[0]
          && a[1] === b[1]
          && a[2] !== b[2]
          && a[3] === b[3]

          && a[0] === c[0]
          && a[1] === c[1]
          && a[2] !== c[2]
          && a[3] === c[3]

          && b[0] === c[0]
          && b[1] === c[1]
          && b[2] !== c[2]
          && b[3] === c[3]

        ) {
        solutions.push((i+1) + '-' + (x+1) + '-' + (y+1))
      } else if (a[0] === b[0]
          && a[1] !== b[1]
          && a[2] === b[2]
          && a[3] === b[3]

          && a[0] === c[0]
          && a[1] !== c[1]
          && a[2] === c[2]
          && a[3] === c[3]

          && b[0] === c[0]
          && b[1] !== c[1]
          && b[2] === c[2]
          && b[3] === c[3]

        ) {
        solutions.push((i+1) + '-' + (x+1) + '-' + (y+1))
      } else if (a[0] !== b[0]
          && a[1] === b[1]
          && a[2] === b[2]
          && a[3] === b[3]

          && a[0] !== c[0]
          && a[1] === c[1]
          && a[2] === c[2]
          && a[3] === c[3]

          && b[0] !== c[0]
          && b[1] === c[1]
          && b[2] === c[2]
          && b[3] === c[3]

        ) {
        solutions.push((i+1) + '-' + (x+1) + '-' + (y+1))
      }
    }
  }
}*/

let parseTime = function (ms) {
        let seconds = Math.floor(ms / 1000); ms %= 1000;
        let minutes = Math.floor(seconds / 60); seconds %= 60;
        let hours = Math.floor(minutes / 60); minutes %= 60;
        let days = Math.floor(hours / 24); hours %= 24;
        let written = false;
        return (days ? (written = true, days + " d") : "") + (written ? ", " : "")
            + (hours ? (written = true, hours + " h") : "") + (written ? ", " : "")
            + (minutes ? (written = true, minutes + " m") : "") + (written ? ", " : "")
            + (seconds ? (written = true, seconds + " s") : "") + (written ? ", " : "")
            + (ms ? Math.round(ms) + " ms" : "");
    }