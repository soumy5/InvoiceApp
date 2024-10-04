const helpers = require("../helpers");
const knex = require('../db.js')

require("dotenv").config()

let product = {};

product.insertProduct = async (req, res) => {
    try {
        //insert_type=1 //insert product, insert_type=2 //update product
        var frombody = req.body
        var user = req.user
        let valid = false;

        if (req.body.insert_type == 1) {
            const category = await knex.select("*").from("category_details").where("category_code", req.body.product_category)
            if (category.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid category"))
            } else {
                delete frombody.insert_type
                delete frombody.product_id
                delete frombody.id
                console.log("frombody:",frombody)
                    let obj = {
                        product_name: frombody.product_name,
                        product_category: category[0].category_code,
                        product_quantity: frombody.product_quantity,
                        product_unit: frombody.product_unit,
                        product_stock: frombody.product_stock,
                        product_cost_price: frombody.product_cost_price,
                        product_sale_price: frombody.product_sale_price,
                        product_status: 1,
                        created_by: user.id
                    }
                    console.log("onj:",obj)
                    var resp = await knex("product_details").insert(obj)
                    return res.status(200).json(helpers.response("200", "success", "successfully inserted"))
            }
        }
        else if (frombody.insert_type == 2) { //edit category
            delete frombody.category_code
            let valid = false;
            Object.keys(frombody).forEach((element) => {
                if (frombody[element] === null || frombody[element] === "") {
                    delete frombody[element];
                }
            });
            const keyname = Object.keys(frombody);
            for (let i = 0; i < keyname.length; i++) {
                switch (keyname[i]) {
                    case "product_name":
                        var value = "";
                        if (keyname[i] === "product_name") { value = frombody.product_name; }
                        valid = (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/).test(value);
                        break;
                    case "product_quantity":
                        var value = "";
                        if (keyname[i] === "product_quantity") { value = frombody.product_quantity; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_unit":
                        var value = "";
                        if (keyname[i] === "product_unit") { value = frombody.product_unit; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_stock":
                        var value = "";
                        if (keyname[i] === "product_stock") { value = frombody.product_stock; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_cost_price":
                        var value = "";
                        if (keyname[i] === "product_cost_price") { value = frombody.product_cost_price; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;
                    case "product_sale_price":
                        var value = "";
                        if (keyname[i] === "product_sale_price") { value = frombody.product_sale_price; }
                        valid = (/^([1-9][0-9]*|0)(\.[0-9]+)?$/).test(value);
                        break;

                    default:
                        valid = true
                }
            }
            if (!valid) {
                return res.status(400).json(helpers.response("400", "error", "wrong and mismatch input"));
            }
            else {
                delete frombody.insert_type
                delete frombody.id
                frombody.updated_at = new Date()
                // frombody.updated_by=user.user_id
                if(req.body.product_id){
                    const prd = await knex.select("*").from("product_details").where("product_id", req.body.product_id)
                    if (prd.length === 0) {
                        return res.status(400).json(helpers.response("400", "error", "invalid product"))
                    } else {
                        var resp = await knex('product_details').where('product_id', req.body.product_id).update(frombody)
                        return res.status(200).json(helpers.response("200", "success", "Successfully product details are updated"));
                    }
                }else{
                    return res.status(400).json(helpers.response("400", "error", "you must provide the product id"))
                }
            }
        }
    } catch (e) {

        return res.status(500).json(helpers.response("500", "error", "something went wrong", e))
    }
}

product.getProductDetails = async (req, res) => {
    try {
        var category = await knex.select("*").from("category_details").where("category_status", 1)
        if (category.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid category"));
        } else {
            var pr = []
            for (let i = 0; i < category.length; i++) {
                pr.push(category[i].category_code)
            }
            var product = await knex.select("*").from("product_details").where("product_status", 1).where("product_category", "in", pr)
            if (product.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid product"));
            } else {
                var o = {}
                var product_details = product.reduce(function (r, el) {
                    var e = el.product_category;
                    if (!o[e]) {
                        o[e] = {
                            category_name: (el.product_category.split('_').pop()).replace("\n", ""),
                            products: []
                        }
                        r.push(o[e]);
                    }
                    o[e].products.push({ product_id: el.product_id, product_name: el.product_name, product_quantity: el.product_quantity, product_unit: el.product_unit, product_stock: el.product_stock, product_cost_price: el.product_cost_price, product_sale_price: el.product_sale_price });
                    return r;
                }, [])
                return res.status(200).json(helpers.response("200", "success", "get details successfully", product_details));
            }
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
    }
}

product.getProductDetailsByCategory = async (req, res) => {
    try {
        var category = await knex.select("*").from("category_details").where("category_code", req.query.category_code).where("category_status",1)
        if (category.length === 0) {
            return res.status(400).json(helpers.response("400", "error", "invalid category"));
        } else {
            var pr = []
            for (let i = 0; i < category.length; i++) {
                pr.push(category[i].category_code)
            }
            var product = await knex.select("*").from("product_details").where("product_status", 1).where("product_category", "in", pr)
            if (product.length === 0) {
                return res.status(400).json(helpers.response("400", "error", "invalid product"));
            } else {
                return res.status(200).json(helpers.response("200", "success", "get product details successfully", product));
            }
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
    }
}

module.exports = product;