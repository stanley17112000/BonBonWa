import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
import socket
import random
import datetime
import sys
import select
import re
import json
'''
This is a simple Websocket Echo server that uses the Tornado websocket handler.
Please run `pip install tornado` with python of version 2.7.9 or greater to install tornado.
This program will echo back the reverse of whatever it recieves.
Messages are output to the terminal for debuggin purposes. 
''' 

#=============

showLogDetail = 1


#=============


BLUE = 0
RED = 1


colorRed = 0
colorBlue = 0

timer = 0
queuedPlayer = 0

# playing   -> waiting-2 -> pending
#                 |
# waiting-1   -> waiting-2 -> pending
#    |                       
# waiting-1   -> waiting-2 -> waiting-3
#                            | 

# gameStart -> nope    -> gameReady

isGameStart = 0
isGameReady = 0

connections = []

network_loop = tornado.ioloop.IOLoop.instance()

class WSHandler(tornado.websocket.WebSocketHandler):
    
    
    def open(self):
        global RED, BLUE
        self.Id = random.randint( 0, 71227122 )
        self.color = -1
        self.state = 'waiting'
        connections.append( self )
        print ('new connection with Id = %d' % ( self.Id ) )
        
    def on_message(self, message):
        global colorRed, colorBlue, isGameStart, queuedPlayer
        print ('message received:  %s from %d' % (message , self.Id) )
        # Reverse Message and send it back
        msg = json.loads( message )

        if msg['type'] == 'click' and self.state == 'playing':
            if self.color == RED:
                if showLogDetail:
                    print( '%d scored on RED' % self.Id )
                colorRed += 1
            elif self.color == BLUE:
                if showLogDetail:
                    print( '%d scored on BLUE' % self.Id )
                colorBlue += 1
        elif msg['type'] == 'request':
            if self.state == 'waiting' and not isGameReady and not isGameStart:
                queuedPlayer += 1
                self.state = 'waiting-exp'
                self.write_message( {'state':'waiting-exp'} )
                print( 'waiting-exp %d' % self.Id )



    def on_close(self):
        global connections
        connections.remove( self )
        print 'connection closed'
 
    def check_origin(self, origin):
        return True


 
application = tornado.web.Application([
    (r'/ws', WSHandler),
])
 

def SendCurrentState():

    global connections, colorBlue, colorRed, isGameStart, isGameReady

    for socket in connections:

        if isGameStart:

            if socket.state == 'playing':
                socket.write_message( {'state':'playing','blue':colorBlue,'red':colorRed,'flag':True,'secs':timer} )

            else:
                socket.write_message( {'state':'playing','flag':False,'secs':timer} )


        elif isGameReady:
            if socket.state == 'pending':
                socket.write_message( {'state':'pending','flag':True, 'secs':timer} )

            else:
                socket.write_message( {'state':'pending','flag':False,'secs':timer} )

        else:
            socket.write_message( {'state':'waiting', 'currentPlayer':queuedPlayer} )   


def ChangeWaitToPend():
    global connections

    for socket in connections:
        if socket.state == 'waiting-exp':
            socket.state = 'pending'

def ChangePendToStart():
    global connections

    for socket in connections:
        if socket.state == 'pending':
            socket.state = 'playing'

def SeperateTeam():
    global connections



    sz = 0

    for socket in connections:
        if socket.state == 'pending':
            sz += 1
    sz = sz / 2
    cnt = 0

    for socket in connections:

        if not socket.state == 'pending':
            continue

        if cnt < sz:
            socket.color = RED
        else:
            socket.color = BLUE

        socket.write_message( {'state':'init','color':socket.color} )

        cnt += 1

def ResetPlayersToWait():
    global connections

    for socket in connections:
        socket.state = 'waiting'

def game_start( ):
    
    global RED, BLUE, colorRed, colorBlue, isGameStart, isGameReady, queuedPlayer
    global timer

    
    if isGameStart:
        # playing state



        timer -= 1
        if timer == 0:
            isGameStart = 0
            timer = 5
            queuedPlayer = 0
            ResetPlayersToWait()


    elif isGameReady:
        # pending state


        timer -= 1
        if timer == 0:
            isGameReady = 0
            isGameStart = 1
            timer = 5
            ChangePendToStart()
            

    else:
        # waiting state
        colorRed = 0
        colorBlue = 0


        timer -= 1
        if timer <= 0:
            isGameReady = 1
            timer = 5
            # next state is game ready
            ChangeWaitToPend()
            SeperateTeam()

    SendCurrentState()


    cs = ''
    if isGameReady:
        cs = 'pending'
    elif isGameStart:
        cs = 'playing'
    else:
        cs = 'waiting' 

    print( 'Current State : %s , queuedPlayer : %d, timer : %d' % ( cs , queuedPlayer , timer ) )
    print( 'Red Score: %d, Blue Score: %d' % ( colorRed , colorBlue ) )

    network_loop.add_timeout(datetime.timedelta(seconds=1), game_start)
    
    
    
if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    myIP = socket.gethostbyname(socket.gethostname())
    print ('*** Websocket Server Started at %s***' % myIP)
    network_loop.add_timeout(datetime.timedelta(seconds=1), game_start)
    network_loop.start()
