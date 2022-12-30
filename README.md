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

## out of time
To complete all the APIs it took me about 5 hours, writing all the test cases took me a while but i think it's worth the extra effort. 
I took also some times to add the swagger of the APIs in order to test them. 

## What's missing
### Authentication/Authorization mechanism 
at least a simple basic auth is in my opinion mandatory, a client-credentials flow if they are machine-to-machine APIs

### Health routes
I use to deploy on kubernetes so healtiness and readiness routes are mandatory to implement, in this case the probes should check if the connection to the database is healthy

### Environment Variable Setup
In this exercise we are connecting to a local DB but in a real scenario we would need env variable to specifica database connection string and credentials

