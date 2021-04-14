import app from "./server.js"
import pkg from 'mongodb';
const { MongoClient } = pkg;
import KeyfilesDAO from "./dao/keyfilesDAO.mjs"
import UsersDAO from "./dao/usersDAO.mjs"
import Envs from 'envs'

const port = process.env.PORT || 8082

// TODO: Configure maximum connection pool size

// TODO: Configure timeouts (to avoid the program from waiting indefinitely)

MongoClient.connect(
    process.env.TOPL_DB_URI,
    {useNewUrlParser: true}
    )
.catch(err => {
    console.error(err.stack)
    process.exit(1)
})
.then(async client => {
   await KeyfilesDAO.injectDB
   await UsersDAO.injectDB
   app.listen(port, () => {
       console.log(`listening on port ${port}`)
   }) 
})
