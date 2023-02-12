const { GraphQLError } = require('graphql')
const Author = require('../models/author')
const Book = require('../models/book')
const jwt = require('jsonwebtoken')
const { v4: uuid} = require('uuid')

const { users } = require('../test/mock-data')

//Queries:

const bookCount = async () => Book.collection.countDocuments()
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

  let author = await Author.findOne({ name: args.author })
  
  if (!author) {
    author = new Author({ name: args.author })
    try {
      author.save()
      console.log('New author added to DB!')
    } catch (error) {
      throw new GraphQLError('Validation error', {
        extensions: {
          code: 'BAD_USER_INPUT',
          invalidArgs: args.author,
          error
        }
      })
    }
  }
  const book = new Book({...args})
  book.author = author

  try {
    book.save()
    console.log('New book added to DB!')
  } catch (error) {
    throw new GraphQLError('Validation error', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args.title,
        error
      }
    })
  }

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
    throw new GraphQLError('Wrong credentials', {
      extensions: {
        code: 'BAD_USER_INPUT'
      }
    })
  }

  return { 
    value: jwt.sign({
      user: {  
        username: userOK.username,
        id: userOK.id 
      }
    }, 
    process.env.JWT_SECRET)
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
  }
}