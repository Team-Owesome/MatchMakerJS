var MatchMakerJSCore=require("./MatchMakerJS.js");

var io=require("socket.io").listen(8001);

var matchMaker=new MatchMakerJSCore();


io.on("connection", function(socket)
{
    //data={id='UUID of player', name:player_NAME}
    socket.on('MATCHMAKERJS_JOIN_ROOM', function(data)
    {
        var result=matchMaker.assignePlayerToRoom(matchMaker.createPlayer({'socket':socket, 'id':data.id, 'name':data.name}));

        //define who gets debug statements
        matchMaker.setDebuggerTerminal(socket);

        //send a message to user 
        matchMaker.message(socket, result);
    });

    //data={'roomID': ID_OF_ROOM, ALL_OTHER_DATA}
    socket.on('MATCHMAKERJS_UPDATE', function(data)
    {
        //broadcast updates to a room
        matchMaker.broadcastToRoom("MATCHMAKERJS_UPDATE", socket, data);
    });
});