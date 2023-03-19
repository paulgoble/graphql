module.exports = `
type User {
  username: String!
  favoriteGenre: String!
  id: ID!
}

type Token {
  userToken: String!
  userInfo: User!
}

type Query {
  bookCount(
    author: String
  ): Int!
  authorCount: Int!
  allBooks(
    author: String
    genre: String
    ): [Book!]!
  allAuthors: [Author!]
  allUsers: [User]!
  me: User
}

type Mutation {
  addBook(
    title: String!
    author: String!
    published: Int!
    genres: [String]
  ): Book
  editAuthor(
    name: String!
    setBornTo: Int!
  ): Author
  createUser(
    username: String!
    password: String!
    favoriteGenre: String!
    key: String!
  ): User
  login(
    username: String!
    password: String!
  ): Token
}

type Subscription {
  bookAdded: Book!
}

type Book {
  title: String!
  published: Int!
  author: Author!
  genres: [String!]!
  id: ID!
}

type Author {
  name: String!
  born: Int
  bookCount: Int!
  id: ID!
}
`