const helpers = require("../helpers");
const knex = require('../db.js')
const easyinvoice = require('easyinvoice');
const pdf = require('html-pdf');
const fs = require('fs');

require("dotenv").config()

let invoice = {};

invoice.generateInvoice = async (req, res) => {
  try {
    const user = req.user;//token
    const result = await knex.select('*').from('cart_details').leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id").where({ "cart_user_id": user.id, "cart_status": 1 });
    if (result.length === 0) {
      return res.send({ code: "400", message: "no data found" });
    }
    const sum = result.reduce((acc, item) => acc + item.net_price, 0);
    const dateD = Date.now();
    const obj = {
      name: req.query.name,
      mobileno: req.query.mobileno,
      invoice_number: `I${dateD}${result[0].cart_id}`,
      net_price: sum,
      created_at: new Date(),
      created_by: result[0].cart_user_id,
      invoice_status: 1,
    };
    const [data] = await knex('invoice_details').insert(obj);
    await knex('cart_details').update({ 'cart_status': '3', 'cart_order': obj.created_at }).where({ 'cart_user_id': user.id, "cart_status": 1 });
    const invoiceUrl = `http://localhost:3012/pdfFile?id=${data}&user_id=${user.id}`;
    await knex("invoice_details").update({ invoice_link: invoiceUrl }).where("id", data);
    await generateAndSendInvoicePdf(data, user, res);
  } catch (e) {
    console.log(e);
    return res.send({ code: "500", message: " something went worng ", status: e.message });
  }

  async function generateAndSendInvoicePdf(id, user, res) {
    try {
      const order = await knex.select("*").from("invoice_details").where({ "id": id });
      if (order.length === 0) {
        return res.send({ code: "400", message: " invalid invoice" });
      } else {
        const cartproduct = await knex.select("*").from("cart_details")
          .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
          .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": user.id, "cart_details.cart_order": order[0].created_at });
        if (cartproduct.length === 0) {
          return res.send({ code: "400", message: " invalid " });
        } else {
          var details = await knex.select("*").from("company_details").where("id", user.id)
          if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 1) {
            let cm_logo = details[0].company_logo
            console.log("q", details[0].company_logo);
            var notice = details[0].note;
            var gst = details[0].gst;
            console.log("gst", gst)
            var logo = fs.readFileSync(`./uploads/${cm_logo}`, { encoding: 'base64' });
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, user, extractedData, notice, logo)
          }
          else if (details[0].note !== null && details[0].gst !== null && details[0].image_isenable == 0) {
            var notice = details[0].note;
            var gst = details[0].gst;
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": gst,
            }));
            createinvoice(order, user, extractedData, notice)
          }
          else {
            const extractedData = cartproduct.map(row => ({
              description: row.product_name,
              price: row.product_sale_price,
              quantity: row.cart_quantity,
              "tax-rate": 0,
            }));
            createinvoice(order, user, extractedData)
          }
        }
      }
    } catch (err) {
      console.log(err)
      return res.send({ code: "500", message: " something went worng here", status: err.message });
    }
  }
  function createinvoice(order, user, extractedData, notice, logo) {
    const dateTimeString = order[0].created_at.toISOString().split('T')[0];
    const invoiceData = {
      "client": {
        "company": `customer name: ${order[0].name}`,
        "zip": `contact number: ${order[0].mobileno}`
      },
      "sender": {
        "company": `sender name:${user.name}`,
        "address": `mobile number:${user.user_mobileno}`,
        // "zip": "1234 AB",
        // "city": "bokaro",
        // "country": "India"
      },
      "images": {
        "logo": logo,
        //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
      },
      "information": {
        "number": order[0].invoice_number,
        "date": dateTimeString,
      },
      "products": extractedData,
      "bottom-notice": notice,
      "settings": {
        "currency": "INR",
      },
      "translate": {
        "vat": "GST",
        "due-date": " "
      },
    };
    easyinvoice.createInvoice(invoiceData, function (result) {
      res.attachment('invoice.pdf');
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.send(pdfBuffer);
    });
  }
}

invoice.pdfFile = async (req, res) => {
  try {
    const order = await knex.select("*").from("invoice_details").where({ "id": req.query.id })
    if (order.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "invalid invoice"));
    }
    else {
      const cartproduct = await knex.select("*").from("cart_details")
        .leftJoin("product_details", "cart_details.cart_product_id", "=", "product_details.product_id")
        .where({ "cart_details.cart_status": "3", "cart_details.cart_user_id": req.query.user_id, "cart_details.cart_order": order[0].created_at })
      if (cartproduct.length === 0) {
        return res.status(400).json(helpers.response("400", "error", "invalid "));
      }
      else {
        const convertToProductsFormat = (cartproduct) => {
          return cartproduct.map((row) => ({
            description: row.product_name,
            price: row.product_sale_price,
            quantity: row.cart_quantity,
            tax_rate: 0
          }));
        };
        const products1 = convertToProductsFormat(cartproduct);
        const extractedData = products1.map(object => {
          return {
            description: object.description,
            quantity: object.quantity,
            price: object.price,
            tax_rate: object.tax_rate
          };

        });
        // const dateTimeString = (order[0].created_at).toString();
        const parts = ((((order[0].created_at).toString()).split('T')[0]).split(" ")).slice(0, 4).join(" ");
        var data = {
          "client": {
            "company": "customer name: " + order[0].name,
            // "address": req.query.contact_number,
            "zip": "contact number: " + order[0].mobileno,
            // "city": "Clientcity",
            // "country": "Clientcountry"
          },
          // "sender": {
          //   "company": "Ravi ",
          //   "address": "dhanbad 123",
          //   "zip": "1234 AB",
          //   "city": "bokaro",
          //   "country": "India"
          // },
          // "images": {
          //   // The logo on top of your invoice
          //   "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png",
          //   // The invoice background
          //   "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg"
          // },
          "information": {
            // Invoice number
            "number": order[0].invoice_number,
            // Invoice data
            "date": parts,
            // Invoice due date
            // "due-date": "31-12-2021"
          },
          "products": extractedData,
          "bottomNotice": "Kindly pay your invoice ",
          "settings": {
            "currency": "INR",
          },
        };
        easyinvoice.createInvoice(data, function (result) {
          res.attachment('invoice.pdf');
          let q = Buffer.from(result.pdf, 'base64')
          res.send(q);
        });
      }
    }
  } catch (err) {
    console.log("err", err)
    return res.status(500).json(helpers.response("500", "error", "something went wrong " + err + ""));
  }
}

invoice.invoiceList = async (req, res) => {
  try {
    const inv = await knex.select("invoice_link").from("invoice_details")
    if (inv.length === 0) {
      return res.status(400).json(helpers.response("400", "error", "invalid invoice", e));
    } else {
      return res.status(400).json(helpers.response("400", "error", "get the link history successfully", inv));
    }
  } catch (err) {
    return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""));
  }
}

module.exports = invoice;






