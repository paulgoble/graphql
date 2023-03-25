const typeDefs = require("./graphql/typeDefs")
const resolvers = require("./graphql/resolvers")

const express = require("express")
const cors = require("cors")
const http = require("http")
const jwt = require("jsonwebtoken")

const { ApolloServer } = require("@apollo/server")
const { expressMiddleware } = require("@apollo/server/express4")
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer")
const { makeExecutableSchema } = require("@graphql-tools/schema")

const { WebSocketServer } = require("ws")
const { useServer } = require("graphql-ws/lib/use/ws")

const User = require("./models/user")

const startServer = async (PORT) => {
  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  })

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await server.start()

  app.use(
    "/",
    cors(),
    express.json(),
    expressMiddleware(server, {
      listen: { port: PORT, host: "0.0.0.0" },
      context: async ({ req, res }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith("Bearer ")) {
          const userToken = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET
          )
          const currentUser = await User.findById(userToken.userInfo._id)

          return { currentUser }
        }
      },
    })
  )

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on port ${PORT}`)
  )
}

module.exports = startServer
