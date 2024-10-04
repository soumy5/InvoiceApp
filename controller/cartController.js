const helpers = require("../helpers");
const knex = require('../db.js')

require("dotenv").config()

let cart = {};

cart.addCart = async (req, res) => {
  try {
    console.log("req.body",req.body)
    var users = req.user, qty = 0;
    let product = await knex.select('*').from('product_details').where({ 'product_id': req.body.product_id, 'product_status': "1" })
    if (product.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "product is invalid"));
    }
    else {
      let cart = await knex.select('*').from('cart_details').where({ 'cart_product_id': req.body.product_id, 'cart_user_id': users.id }).where("cart_status", 1)
      if (cart.length === 0) {
        if (req.body.type === 1) {
          if (product[0].product_quantity > JSON.parse(req.body.cart_quantity)) {
            let obj = {
              cart_user_id: users.id,
              cart_product_id: req.body.product_id,
              cart_quantity: req.body.cart_quantity,
              product_mrp: product[0].product_sale_price,
              cart_status: "1",
              created_by: users.id
            }
            obj.net_price = obj.product_mrp * obj.cart_quantity
            insertProduct(obj, product)
          } else {
            return res.status(500).json(helpers.response("500", "error", "out of stock1"));
          }
        }
        else {
          return res.status(400).json(helpers.response("400", "error", "choose type 1 for add the product"));
        }
      } else {
        if (JSON.parse(product[0].product_quantity) >= 0 && JSON.parse(product[0].product_quantity) >= req.body.cart_quantity) {
          qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
          if (req.body.type === 1) {//add
            if (req.body.cart_quantity > 1) {
              qty = JSON.parse(cart[0].cart_quantity) + JSON.parse(req.body.cart_quantity)
              let obj1 = {
                cart_user_id: users.id,
                cart_product_id: req.body.product_id,
                cart_quantity: qty,
                product_mrp: product[0].product_sale_price,
                cart_status: "1",
                updated_at: new Date(),
                updated_by: users.id
              }
              obj1.net_price = obj1.product_mrp * obj1.cart_quantity
              updateQuantity(obj1, cart, product)
            }
            else {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) + 1
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              updateQuantity(obj, cart, product)
            }
          }
          if (req.body.type === 2) { //sub
            if (JSON.parse(cart[0].cart_quantity) > 0) {
              let obj = {
                cart_quantity: JSON.parse(cart[0].cart_quantity) - 1,
              }
              obj.net_price = JSON.parse(cart[0].product_mrp) * obj.cart_quantity
              await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
              await knex("product_details").update("product_quantity", JSON.parse(product[0].product_quantity) + 1).where("product_id", req.body.product_id)
              showDetails()
              // return res.status(200).json(helpers.response("200", "success", "updated successfully"));
            }
            else {
              await knex('cart_details').del().where('cart_id', cart[0].cart_id)
              showDetails()
              // return res.status(200).json(helpers.response("200", "success", "Your product is removed from cart"));
            }
          }
        } else {
          return res.status(500).json(helpers.response("500", "error", "out of stock2"));
        }
      }
    }
  }
  catch (e) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong", e));
  }
  async function updateQuantity(obj, cart, product) {
    console.log("obj1:",obj)
    if (JSON.parse(product[0].product_quantity) > JSON.parse(req.body.cart_quantity)) {
      await knex('cart_details').update(obj).where('cart_id', cart[0].cart_id)
      updateProductQuantity(product)
    } else {
      return res.status(500).json(helpers.response("500", "error", "out of stock3"));
    }
  }
  async function insertProduct(obj, product) {
    console.log("obj2:",obj)

    await knex('cart_details').insert(obj)
    updateProductQuantity(product)
  }
  async function updateProductQuantity(product) {
    console.log("product3:",product)

    if (product[0].product_quantity > req.body.cart_quantity) {
      var p = product[0].product_quantity - req.body.cart_quantity
      console.log("quantity234:",p)
      await knex('product_details').update({ "product_quantity": p }).where('product_id', req.body.product_id)
      showDetails()
      // return res.status(200).json(helpers.response("200", "success", "Your product is added to cart"));
    }
    else {
      return res.status(500).json(helpers.response("500", "error", "out of stock4"));
    }
  }
  async function showDetails(){
    console.log()
      const tokenId = req.user.id;
      const cartQuery = await knex.select("*").from("cart_details").where("cart_status",1).where("cart_user_id", tokenId);
      if (cartQuery.length === 0) {
        return res.send({ code: "400",status:"error", message: "No data found in cart_details" });
      }else{
        return res.json({ code: "200",status:"success", message: "Successful", data: cartQuery });
      }    
  }

}

cart.showcartdetails = async (req, res) => {
  try {
    console.log("showCartDetails API");
    let q = await knex("cart_details").select("*").where("cart_status", 1);
    res.json({ code: "200", message: " successfully ", data: q });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }

}

cart.showDetails = async (req, res) => {
  try {
    console.log("total API");

    let tokenId = req.user.id
    console.log("tokenId", tokenId)

    let q = await knex.select("cart_product_id", "cart_quantity", "product_mrp", "net_price").from("cart_details").where("cart_user_id", tokenId);
    if (q.length == 0) {
      return res.send({ code: "400", message: " no data found " });
    };



    const items = q.map(async (object) => {
      const { cart_product_id, cart_quantity, product_mrp, net_price } = object;

      const productDetails = await knex
        .select("product_name")
        .from("product_details")
        .where("product_id", cart_product_id)
        .first();

      return {
        cart_product_id,
        cart_quantity,
        product_mrp,
        net_price,
        product_name: productDetails.product_name,
      };
    });

    const itemsWithProductNames = await Promise.all(items);
    // console.log("itemsWithProductNames", itemsWithProductNames);

    console.log("items", items);
    let amount = 0;
    itemsWithProductNames.forEach((object) => {
      amount += object.net_price;
    });

    console.log("Total amount:", amount);
    let GST = 10;

    let Items = {
      cart_products: itemsWithProductNames,
      amount: amount,
      GST: GST,
      total_amount: GST + amount
    };

    res.json({ code: "200", message: " successfully ", data: Items });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }

}

module.exports = cart