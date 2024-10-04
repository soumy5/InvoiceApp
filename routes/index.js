const express =require("express");
const middleware =require("../middleware");
const helpers =require("../helpers");
const categoryController =require("../controller/categoryController");
const productController =require("../controller/productController");
const invoiceController =require("../controller/invoiceController");
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const clientController=require('../controller/clientController')

const auth = require('../middleware');
const router = express.Router();
require("dotenv").config()

router.route('/')
  .get((req, res) => {
    res.status(200).send(helpers.response("200","success"))
  })

//user api
router.route('/userRegister').post(userController.userRegister);
router.route('/Login').post(userController.Login);
router.route('/verifyOTP').post(userController.verifyOTP);
router.route('/editRegister/:id').post(userController.editRegister);

//category API
router.route("/createCategory").post(auth.authentication, auth.authorisation,categoryController.createCategory);
router.route("/showCategoryDetails").get(auth.authentication, auth.authorisation,categoryController.showCategoryDetails);

//product API
router.route("/insertProduct").post(auth.authentication, auth.authorisation,productController.insertProduct);
router.route("/getProductDetails").get(auth.authentication, auth.authorisation,productController.getProductDetails);
router.route("/getProductDetailsByCategory").get(auth.authentication, auth.authorisation,productController.getProductDetailsByCategory);

//invoice API
router.route("/generateInvoice").get(auth.authentication, auth.authorisation,invoiceController.generateInvoice);
router.route("/pdfFile").get(invoiceController.pdfFile);
router.route("/invoiceList").get(invoiceController.invoiceList);

//cart api
router.post('/addCart',auth.authentication, auth.authorisation,cartController.addCart);
router.route('/showcartdetails').get(auth.authentication, auth.authorisation,cartController.showcartdetails);
router.route('/showDetails').get(auth.authentication, auth.authorisation,cartController.showDetails);

//client api
router.route('/clientList').get(auth.authentication, auth.authorisation,clientController.clientList);
router.route('/InvoiceListByClient').get(auth.authentication, auth.authorisation,clientController.InvoiceListByClient);










module.exports= router;
