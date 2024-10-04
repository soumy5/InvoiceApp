const mysql=require('mysql')
const knex=require('knex');
require("dotenv").config()

const DB_CONNECTION=process.env.DB_CONNECTION
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const database= knex({
    client: DB_CONNECTION,
    connection: {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE
    }
  });
  module.exports=database;


