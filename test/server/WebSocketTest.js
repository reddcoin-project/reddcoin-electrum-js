function WebSocketTest()
{
    if ("WebSocket" in window)
    {
        // Let us open a web socket
        var ws = new WebSocket("ws://uk.rddelectrum.com:5001");
        ws.onopen = function()
        {
            // Web Socket is connected, send data using send()
            ws.send('{"id": "1", "method": "example.ping", "params": ["First message"]}\n');
            ws.send('{"id": "2", "method": "example.ping", "params": ["Second message"]}\n'+
                '{"id": "3", "method": "example.ping", "params": ["Third message"]}\n');
            alert("Message is sent...");
        };
        ws.onmessage = function (evt)
        {
            var received_msg = evt.data;
            alert("Message is received:\n" + received_msg);
        };
        ws.onclose = function()
        {
            // websocket is closed.
            alert("Connection is closed...");
        };
    }
    else
    {
        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }
}

function HttpServerTest(){
    var url = 'http://uk.rddelectrum.com:8081',
        data = '{"id": 1, "method": "blockchain.address.get_balance", "params": ["Rcv2GrdBV5F7Js4qwggrDjwzes69qpCJCB"]}',
        success = function(response){
            console.log(response);
        };



    $.ajax({
        type: "POST",
        url: url,
        data: data,
        contentType : 'application/json-rpc',
        success: success,
        dataType: 'json'
    });
}


$(function(){
//    $("#importButton").click(WebSocketTest)
    $("#importButton").click(HttpServerTest)
})