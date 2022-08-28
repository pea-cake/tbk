var Common = require('./common.js').Common;

var TmcCodec = function(){

}

TmcCodec.prototype.writeMessage = function(message) {
    var buffer = new Buffer(256);
    buffer.writeUInt8(2,0);
    buffer.writeUInt8(message.messageType,1);
    var index = 2;

    if(message.statusCode && message.statusCode > 0){
        buffer.writeUInt16LE(Common.enum.HeaderType.StatusCode,index);
        buffer.writeUInt32LE(message.statusCode,index+2);
        index += 6;
    }

    if(message.flag && message.flag > 0){
        buffer.writeUInt16LE(Common.enum.HeaderType.Flag,index);
        buffer.writeUInt32LE(message.flag,index+2);
        index += 6;
    }

    if(message.token){
        buffer.writeUInt16LE(Common.enum.HeaderType.Token,index);
        var length = Buffer.byteLength(message.token);
        buffer.writeUInt32LE(length,index+2);
        buffer.write(message.token,index+6,'UTF-8');
        index = index + length + 6;
    }

    if(message.content){
        for(var key in message.content){
            buffer.writeUInt16LE(Common.enum.HeaderType.Custom,index);
            var length = Buffer.byteLength(key);
            buffer.writeUInt32LE(length,index+2);
            buffer.write(key,index+6,'UTF-8');
            index = index + length + 6;

            length = Buffer.byteLength(message.content[key]);
            if(length == 0){
                buffer.writeUInt8(Common.enum.ValueFormat.Void,index);
            }else{
                var type = typeof message.content[key];
                if(key == '__kind'){
                    buffer.writeUInt8(Common.enum.ValueFormat.Byte,index);
                    buffer.writeUInt8(message.content[key],index+1);
                    index += 2;
                } else if(type == 'number'){
                    buffer.writeUInt8(Common.enum.ValueFormat.Int64,index);
                    const big = ~~(message.content[key] / (0xFFFFFFFF + 1));
                    const low = (message.content[key] % (0xFFFFFFFF + 1));
                    buffer.writeUInt32LE(low,index + 1);
                    buffer.writeUInt32LE(big,index + 5);
                    index += 9;
                } else{
                    buffer.writeUInt8(Common.enum.ValueFormat.CountedString,index);
                    buffer.writeUInt32LE(length,index+1);
                    buffer.write(message.content[key],index+5,'UTF-8');
                    index = index + length + 5;
                }
            }
        }
    }
    buffer.writeUInt16LE(Common.enum.HeaderType.EndOfHeaders,index);
    return buffer.slice(0,index+2);
}

TmcCodec.prototype.readMessage = function(buffer) {
    var message = {};
    message.protocolVersion = buffer.readUInt8(0);
    message.messageType = buffer.readUInt8(1);
    try{
        var headerType = buffer.readUInt16LE(2);
        var index = 4;
        while(headerType != Common.enum.HeaderType.EndOfHeaders){
            if(headerType === Common.enum.HeaderType.StatusCode){
                message.statusCode = buffer.readUInt32LE(index);
                index += 4;
            } else if(headerType === Common.enum.HeaderType.StatusPhrase){
	            var length = buffer.readUInt32LE(index);
	            message.statusPhase = buffer.toString('UTF-8',index+4,index+length+4);
	            index = index + length + 4;
	        } else if(headerType === Common.enum.HeaderType.Flag){
                message.flag = buffer.readUInt32LE(index);
                index += 4;
            } else if(headerType === Common.enum.HeaderType.Token){
                var length = buffer.readUInt32LE(index);
                message.token = buffer.toString('UTF-8',index+4,index+length+4);
                index = index + length + 4;
            } else if(headerType === Common.enum.HeaderType.Custom){
                var length = buffer.readUInt32LE(index);
                var key = buffer.toString('UTF-8',index+4,index+length+4);
                index = index + length + 4;

                var format = buffer.readUInt8(index);
                index += 1;
                if(format == Common.enum.ValueFormat.Int64 || format == Common.enum.ValueFormat.Date){
                    message[key] = buffer.readUInt32LE(index) + buffer.readUInt32LE(index+4) * 4294967296;
                    index += 8;
                }else if(format == Common.enum.ValueFormat.CountedString){
                    length = buffer.readUInt32LE(index);
                    message[key] = buffer.toString('UTF-8',index+4,index+length+4);
                    index = index + length + 4;
                }else if(format == Common.enum.ValueFormat.Byte){
	                message[key] = buffer.readUInt8(index);
	                index += 1;
                }else if(format == Common.enum.ValueFormat.Int32){
	                message[key] = buffer.readUInt32LE(index);
	                index += 4;
                }else if(format == Common.enum.ValueFormat.Int16){
	                message[key] = buffer.readUInt16LE(index);
	                index += 2;
                }
            }
            headerType = buffer.readUInt16LE(index);
            index += 2;
        }
    }catch (err) {
        console.log(err);
        return null;
    }
    return message;
}

exports.TmcCodec = TmcCodec;

