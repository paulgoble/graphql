const { GraphQLError } = require('graphql')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const Author = require('../models/author')
const Book = require('../models/book')
const jwt = require('jsonwebtoken')
const { v4: uuid} = require('uuid')

const { users } = require('../test/mock-data')

//Queries:

const bookCount = async (_, args) => {
  if (!args.author) {
    return booksTotal = Book.collection.countDocuments()
  } else {
    const author = await Author.findOne({ name: args.author })
    filteredBooks = await Book.find({ author: author }).populate('author')
  }
  return filteredBooks.length
}

const authorCount = async () => Author.collection.countDocuments()

const allBooks = async (_,args) => {
  let filteredBooks = []

  if (!args.author) {
    filteredBooks = await Book.find({}).populate('author')
  } else {
    const author = await Author.findOne({ name: args.author })
    filteredBooks = await Book.find({ author: author }).populate('author')
  }
  
  if (args.genre) {
    filteredBooks = filteredBooks.filter((book) => book.genres.includes(args.genre))
  }
  
  return filteredBooks
}

const allAuthors = async () => {
  let authors = await Author.find({})

  authors = authors.map((a) => {
    a.bookCount = bookCount({}, { author: a.name })
    return a
  })
  return authors
}

const allUsers = () => users

const me = (_, args, { currentUser }) => {
  return currentUser
}

//Mutations:

const addBook = async (_, args, { currentUser }) => {
  if (!currentUser) {
    throw new GraphQLError('Wrong credentials', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }

  if (!args.title) {
    throw new GraphQLError('Error: A title is required', {
      extensions: { 
        code: 'BAD_USER_INPUT',
        invalidArgs: args.title,
      }
    })
  }

  if (!args.author) {
    throw new GraphQLError('Error: Author name is required', {
      extensions: { 
        code: 'BAD_USER_INPUT',
        invalidArgs: args.author,
      }
    })
  }

  let author = await Author.findOne({ name: args.author })
  
  if (!author) {
    author = new Author({ name: args.author })
    try {
      author.save()
      console.log('New author added to DB!')
    } catch (err) {
      console.log(err)
    }
  }
  const book = new Book({...args})
  book.author = author

  try {
    book.save()
    console.log('New book added to DB!')
  } catch (err) {
    console.log(err)
  }
  book.author.bookCount = bookCount({}, { author: author.name })

  pubsub.publish('BOOK_ADDED', { bookAdded: book })
  return book
}

const editAuthor = async (_, args, { currentUser }) => {
  if (!currentUser) {
    throw new GraphQLError('Wrong credentials', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }

  const author = await Author.findOne({ name: args.name })
  author.born = args.setBornTo

  try {
    author.save()
    console.log('Author updated!')
  } catch (error) {
    throw new GraphQLError('Validation error', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args.name,
        error
      }
    })
  }

  return author
}

const createUser = (_, args) => {
  const newUser = {...args}
  newUser.id = uuid()
  users.push(newUser)
  return newUser
}

const login = (_, args) => {
  const user = {...args}
  const userOK = users.find((u) => u.username === user.username && u.password === user.password)

  if (!userOK) {
    throw new GraphQLError('Invalid username or password', {
      extensions: {
        code: 'BAD_USER_INPUT'
      }
    })
  }

  const userInfo = {
    username: userOK.username,
    favoriteGenre: userOK.favoriteGenre,
    id: userOK.id
  }
  
  return { 
    userToken: jwt.sign({ userInfo }, process.env.JWT_SECRET),
    userInfo
  }
}

//Export resolvers:

module.exports = {
  Query: {
    bookCount,
    authorCount,
    allBooks,
    allAuthors,
    allUsers,
    me
  },
  Mutation: {
    addBook,
    editAuthor,
    createUser,
    login
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    }
  },
}