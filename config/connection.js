const {MongoClient} = require('mongodb')
const state = {
    db:null
}
module.exports.connect=function(done){
    const client = new MongoClient('mongodb://localhost:27017')
    const dbname = client.db('shopping')
    state.db = dbname 
   
}

module.exports.get=function(){
    return state.db
}