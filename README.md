# Getting Set Up

  
The exercise requires [Node.js](https://nodejs.org/en/) to be installed. We recommend using the LTS version.

  

1. Start by cloning this repository.

  

1. In the repo root directory, run `npm install` to gather all dependencies.

  

1. Next, `npm run seed` will seed the local SQLite database. **Warning: This will drop the database if it exists**. The database lives in a local file `database.sqlite3`.

  

1. Then run `npm start` which should start both the server and the React client.

## Try the APIs

after calling `npm start` the server will start on `http://localhost:3001` navigating on `http://localhost:3001/api-docs/` it will be possible to navigate the swagger and try the APIs

## Test the APIs
to test the APIs it's possible to run the `npm test` command