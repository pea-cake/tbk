var Common = function(){
}

Common.enum = {
    MessageType:{
        CONNECT: 0,
        CONNECTACK: 1,
        SEND: 2,
        SENDACK:3
    },
    HeaderType : {
        EndOfHeaders : 0,
        Custom: 1,
        StatusCode : 2,
        StatusPhrase: 3,
        Flag : 4,
        Token : 5
    },

    ValueFormat : {
        Void : 0,
        CountedString : 1,
        Byte : 2,
        Int16 : 3,
        Int32 : 4,
        Int64 : 5,
        Date : 6,
        ByteArray : 7
    },
    MessageKind :{
        None: 0,
        PullRequest : 1,
        Confirm : 2,
        Data : 3
    }
}

exports.Common = Common;