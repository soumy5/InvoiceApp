const helpers = require("../helpers");
const knex = require('../db.js')

require("dotenv").config()

let client = {};

client.clientList = async (req, res) => {
    try {
        var client = await knex.select("name", "mobileno").from("invoice_details").where("invoice_status", 1)
        if (client.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid client"))
        }
        else {
            return res.status(200).json(helpers.response("200", "success", "successfully get client details",client))
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "success", "something went wrong", e))
    }
};

client.InvoiceListByClient = async (req, res) => {
    try {
        const clinetinvoice = await knex.select("invoice_link").from("invoice_details").where("mobileno", req.query.mobileno)
        if (clinetinvoice.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid client"))
        } else {
            return res.status(200).json(helpers.response("200", "success", "successfully get client invoice list",clinetinvoice))
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "success", "something went wrong", e))
    }
}

module.exports = client;

