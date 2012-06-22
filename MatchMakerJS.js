/**
 By Team Owesome
 Documentation:
    https://github.com/Team-Owesome/MatchMakerJS/wiki/_pages
 Group: 
	https://github.com/Team-Owesome
	
Version 0.1
Date:2012-06-22

By Till Hagger & Fabio Gianini
*/

var PLAYER_ASSIGNED=0x000001;
var ROOM_CREATED=0x000002;
var PLAYER_QUEUED=0x000003;
var PLAYER_NAME_EXIST=0x000004;

var JOIN_ROOM="MATCHMAKERJS_JOIN_ROOM";
var MESSAGE="MATCHMAKERJS_MESSAGE";
var DEBUG="MATCHMAKERJS_DEBUG";
var ORDER="MATCHMAKERJS_ORDER";
var UPDATE="MATCHMAKERJS_UPDATE";
var NAME_EXIST="MATCHMAKERJS_NAME_EXIST";

var MESSAGES=
{
    IN_QUEUE:"no free slots found. You are in the queue now"
}

var ROOM_CONFIG=
{
    maxPlayers:2,
    maxRooms:1

}
var UUIDConf=
{
    digits:2,
    groups:2
}

function MatchMakerJS()
{
    this.rooms=new Array();
    this.players=new Array();
    this.queuedPlayers=[];
    this.codes=new Array();
    this.debugPipe=null;
    
    this.debug=true;
    
    this.codes[PLAYER_ASSIGNED]={text:'player assigned', code:PLAYER_ASSIGNED};
    this.codes[ROOM_CREATED]={text:'room created', code:ROOM_CREATED};
    this.codes[PLAYER_QUEUED]={text:'player added to queue', code:PLAYER_QUEUED};
    this.codes[PLAYER_NAME_EXIST]={text:'player name alreqdy exist', code:PLAYER_NAME_EXIST};


    if(this.debug){
        this.DEBUG("new MatchMakerJS created");
    }

    if(false === (this instanceof MatchMakerJS)) {
        return new MatchMakerJS();
    }
}
MatchMakerJS.prototype.getCode=function(code)
{
    if(this.code[code]==null)
    {
        return {text:'unknown error', code:0x000000};
    }
    return this.code[code];
}
MatchMakerJS.prototype.setDebuggerTerminal=function (socket)
{
    this.debugPipe=socket;
}

MatchMakerJS.prototype.DEBUG=function(text)
{
    if(this.debugPipe!=null)
    {
        this.debugPipe.emit(DEBUG, {'text':"DEBUG :: "+text});
    }
    console.log(text);
}
//---
//MESSAGING
//---
MatchMakerJS.prototype.message=function(socket, type)
{
    this.DEBUG(type);
    socket.emit("MATCHMAKERJS_MESSAGE", {text:this.codes[type].text});
}

MatchMakerJS.prototype.sendMessageToPlayer=function(player, text)
{
    player.socket.emit(MESSAGE, {'text':text});
}

MatchMakerJS.prototype.sendRoomAssignementToPlayer=function(player, room)
{
    player.socket.emit(JOIN_ROOM, {text:"Slot found", 'roomID':room.roomID});
}

MatchMakerJS.prototype.broadcastToRoom=function(type, socket, data, roomID)
{
    socket.broadcast.to(roomID).emit(type, data);

	if(this.debug)
		this.DEBUG("send {"+type+"} '"+data+"' to room '"+roomID+"'");
}

MatchMakerJS.prototype.sendOrder=function(socket, data)
{
    socket.emit(MATCHMAKERJS_ORDER, data);
}

//creating unique id
MatchMakerJS.prototype.createUniqueID=function()
{
    var UUID="UUID-";
    for(var i=0;i<UUIDConf.groups;i++)
    {
        var digitsGroup="";
        for(var x=0;x<UUIDConf.digits;x++)
        {
            digitsGroup+=Math.round(Math.random()*9);
        }
        UUID+=digitsGroup;
    }
    if(this.debug)
        this.DEBUG("UUID created {"+UUID+"}");
    
    return UUID;
}

//Assigne player to a room
MatchMakerJS.prototype.assignePlayerToRoom=function(player)
{
    if(this.players[player.id]!=null)
    {
        return PLAYER_NAME_EXIST;
    }

    if(this.debug)
        this.DEBUG("checking "+this.rooms.length+" rooms");
    
    return this.searchSlot(player);
}

//Searching a slot for the player
MatchMakerJS.prototype.searchSlot=function(player)
{
    for(var r in this.rooms)
    {
        var room=this.rooms[r];
        if(room != null && room != undefined)
        {
            if(room.connected<room.maxPlayer)
            {
                room.connected++;
                this.joinRoom(player, room);
                this.sendRoomAssignementToPlayer(player, room);

                this.DEBUG("players "+room.connected+" connected to room "+room.roomID);
				
                if(this.debug)
					this.DEBUG("Player "+player.id+" assigned to room "+room.roomID);
                
                return PLAYER_ASSIGNED;
            }
        }
    }
    
    if(ROOM_CONFIG.maxRooms>this.rooms.length)
    {
        var room=this.createRoom(
            {
                'roomID':this.createUniqueID()
            }
        );

        this.saveRoom(room);
    	this.joinRoom(player, room); 
        return ROOM_CREATED;
    }
    else
    {
       
       
        this.queuePlayer(player);
        return PLAYER_QUEUED;
    }
	
    //this.searchSlot(player);
}

MatchMakerJS.prototype.queuePlayer=function(player)
{
        this.queuedPlayers[player.id]=player;

        if(this.debug)
        {
            this.DEBUG("player "+player.id+" queued");
            this.DEBUG(this.queuedPlayers.length+" players in queue");
        }
}

//player joins a room
MatchMakerJS.prototype.joinRoom=function(player, room)
{

    this.players[player.id]={'player':player, 'room':room);
    room.players[player.id]=player;
    player.socket.join(room.roomID);
}

//Room
MatchMakerJS.prototype.createRoom=function(config)
{
    var roomID=config.roomID;
    var maxPlayer=ROOM_CONFIG.maxPlayers;
    
    if(this.debug)
        this.DEBUG("room "+roomID+" created maxPlayer"+maxPlayer);
        
    return {'roomID':roomID, 'maxPlayer':maxPlayer, 'connected':0, 'players':new Array()};
}

MatchMakerJS.prototype.saveRoom = function(room)
{
    //this.rooms[room.roomID]=room;
    this.rooms.push(room);

    if(this.debug)
        console.log(this.rooms);
}

//Player
MatchMakerJS.prototype.createPlayer=function(config)
{
    var socket=config.socket;
    var id=config.id;
    var name=config.name;
    
    return {'id':id, 'socket':socket, 'name':name};
}

module.exports = MatchMakerJS;