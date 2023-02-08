const Author = require('../models/author')
const Book = require('../models/book')

module.exports = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allBooks: (_,args) => {
      let filteredBooks = books
      if (args.author) {
        filteredBooks = filteredBooks.filter((book) => book.author == args.author)
      }
      if (args.genre) {
        filteredBooks = filteredBooks.filter((book) => book.genres.includes(args.genre))
      }
      return filteredBooks
    },
    allAuthors: () => authors.map((author) => {
      return {
        name: author.name,
        born: author.born,
        bookCount: books.filter((book) => book.author == author.name).length
      }
    }),
  },
  Mutation: {
    addBook: async (_, args) => {
      let author = await Author.findOne({ name: args.author })
      
      if (!author) {
        author = new Author({ name: args.author })
        try {
          author.save()
          console.log('new author added to DB!')
        } catch (error) {
          console.log(error)
        }
      }
      const book = new Book({...args})
      book.author = author

      try {
        book.save()
        console.log('new book added to DB!')
      } catch (error) {
        console.log(error)
      }

      return book
    },
    editAuthor: async (_, args) => {
      const author = await Author.findOne({ name: args.name })
      author.born = args.setBornTo

      try {
        author.save()
      } catch (error) {
        throw new GraphQLError('Editing author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }

      return author
    }
  }
}