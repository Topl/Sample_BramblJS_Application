import app from "./server"
import { MongoClient } from "mongodb"
import KeyfilesDao from "./dao/keyfilesDAO"
import UsersDAO from "./dao/usersDAO"

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
   await KeyfilesDao.injectDB
   await UsersDAO.injectDB
   app.listen(port, () => {
       console.log(`listening on port ${port}`)
   }) 
})
