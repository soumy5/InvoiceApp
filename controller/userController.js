
const helpers = require("../helpers");
const knex = require('../db.js')
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require('path');

require("dotenv").config()

let user = {};

user.userRegister = async (req, res) => {
  try {
    const data = req.body;
    if (
      !data.user_name ||
      !helpers.validInputValue(data.user_name) ||
      !helpers.validOnlyCharacters(data.user_name)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "user_name is required and should contain only alphabets",
      });
    };
    if (
      !data.mobile_no ||
      !helpers.validInputValue(data.mobile_no) ||
      !helpers.validPhone(data.mobile_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "mobile_no is required and should contain only number",
      });
    };
    let result0 = await knex("company_details")
      .select("*")
      .where("user_mobileno", data.mobile_no);

    if (result0.length !== 0) {
      return res.json({
        code: "400",
        status: false,
        message: `Account already registered with this ${data.mobile_no}, please login`,
      });
    };
    if (
      !data.email_id ||
      !helpers.validInputValue(data.email_id) ||
      !helpers.validEmail(data.email_id)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "email_id address is required and should be a valid email address",
      });
    }
    if (
      !data.aadhar_no ||
      !helpers.validInputValue(data.aadhar_no) ||
      !helpers.validAadhaar(data.aadhar_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "aadhar_no address is required and should be a valid aadhar_no ",
      });
    }

    // Validate company_name
    if (
      !data.company_name ||
      !helpers.validInputValue(data.company_name) ||
      !helpers.validOnlyCharacters(data.company_name)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_name is required and should contain only alphabets",
      });
    };

    if (
      !data.company_mobileno ||
      !helpers.validInputValue(data.company_mobileno) ||
      !helpers.validPhone(data.company_mobileno)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_mobileno is required and should contain only number",
      });
    };
    let result = await knex("company_details")
      .select("*")
      .where("company_mobileno", data.company_mobileno);

    if (result.length !== 0) {
      return res.json({
        code: "400",
        status: false,
        message: "this comapny number is already register",
      });
    };

    if (
      !data.company_email ||
      !helpers.validInputValue(data.company_email) ||
      !helpers.validEmail(data.company_email)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "company_email address is required and should be a valid email address",
      });
    };

    if (
      !data.company_pin ||
      !helpers.validInputValue(data.company_pin) ||
      !helpers.validPincode(data.company_pin)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "company_pin is required and should be a valid pin",
      });
    };
    if (!data.company_address) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "company_address is required",
      });
    };
    if (
      !data.company_city ||
      !helpers.validInputValue(data.company_city) ||
      !helpers.validOnlyCharacters(data.company_city)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "company_city is required and should contain only alphabets",
      });
    };
    if (
      !data.company_pan_no ||
      !helpers.validInputValue(data.company_pan_no) ||
      !helpers.validPAN_no(data.company_pan_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "company_pan_no is required and should be a valid pan",
      });
    };
    if (
      !data.company_gst_no ||
      !helpers.validInputValue(data.company_gst_no) ||
      !helpers.validGST_no(data.company_gst_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message:
          "company_gst_no is required and should be a valid gst",
      });
    };

    const options = {
      method: "GET",
      url: `https://api.postalpincode.in/pincode/${data.company_pin}`,
    };

    const pincodeDetail = await axios(options);

    if (pincodeDetail.data[0].PostOffice === null) {
      return res.json({
        code: "400",
        status: "failed",
        message: "pin code should be valid ",
      });
    }

    const City = pincodeDetail.data[0].PostOffice[0].Division;
    const District = pincodeDetail.data[0].PostOffice[0].District;
    const State = pincodeDetail.data[0].PostOffice[0].State;

    console.log("x", pincodeDetail.data[0].PostOffice[0])

    //________________________________________________________________________________________________________

    if (!req.files) return res.status(400).json({ status: false, message: "logo required" })

    const profile = req.files.company_logo;
    console.log("profile", profile)
    const fileSize = profile.size / 1000;//convert into kb
    const arr = profile.name.split(".");

    const fileExt = arr[arr.length - 1]

    if (fileSize > 1000) {
      return res
        .status(400)
        .json({ message: "file size must be lower than 1000kb" });
    };
    console.log("fileExt", fileExt);

    if (!["jpeg", "pdf", "jpg", "png"].includes(fileExt)) {
      return res
        .status(400)
        .json({ message: "file extension must be jpg,png and jpeg" });
    };
    const fileName = `${req.body.company_name}${path.extname(profile.name)}`;
    console.log(fileName)

    profile.mv(`uploads/${fileName}`, async (err) => { //mv:its function helps to upload file
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
    });

    //genrate otp
    let otp = helpers.generateOTP(4);
    console.log("Generated otp:", otp);

    // Perform database insertion
    await knex("company_details")
      .insert({
        user_name: data.user_name,
        user_mobileno: data.mobile_no,
        user_email: data.email_id,
        user_aadhar_no: data.aadhar_no,
        otp: otp,
        company_name: data.company_name,
        company_mobileno: data.company_mobileno,
        company_email: data.company_email,
        company_address: data.company_address,
        company_pin: data.company_pin,
        company_pan_no: data.company_pan_no,
        company_logo: fileName,
        company_city: City,
        company_gst_no: data.company_gst_no,

        company_state: State,
        company_status: 1
      })
      .then((resp) => {
        return res.status(201).json({
          code: "200",
          status: true,
          message: "Inserted successfully",
          OTP: otp,
        });
      })
      .catch((error) => {
        return res.status(500).json({ code: "500", error: error.message });
      });
  } catch (error) {
    return res.status(500).json({ code: "500", error: error.message });
  }
};

//VERIFY OTP
user.verifyOTP = async (req, res) => {
  try {
    console.log("verifyOTP API");
    const OTP = req.body.OTP;
    console.log("v", OTP);

    const result0 = await knex("company_details").select("*").where("otp", OTP);

    if (result0.length == 0) {
      return res.json({
        code: "400",
        status: false,
        message: "OTP does not match",
      });
    };

    let email = result0[0].user_email;
    let name = result0[0].user_name;
    let id = result0[0].id;
    let company_name = result0[0].company_name;
    let mobileno = result0[0].user_mobileno;

    console.log("ID", id);

    let token = jwt.sign(
      {
        email: email,
        name: name,
        user_mobileno: mobileno,
        id: id,
        company_name,
      },
      "invoice_APP"
    );

    return res.status(200).json({

      code: "200",
      status: true,
      message: "OTP verified successfully",
      userID: id,
      token: token,
      name: name,
      email: email

    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error,

    });
  }
};

//LOGIN
user.Login = async (req, res) => {
  try {
    console.log("Login API");
    let data = req.body;

    if (
      !data.mobile_no ||
      !helpers.validInputValue(data.mobile_no) ||
      !helpers.validPhone(data.mobile_no)
    ) {
      return res.status(400).json({
        code: "400",
        status: false,
        message: "mobile_no is required and should be a correct mobile_no",
      });
    }

    let result0 = await knex("company_details")
      .select("*")
      .where("user_mobileno", data.mobile_no);

    if (result0.length === 0) {
      return res.json({
        code: "400",
        status: false,
        message: "account not found , please register first",
      });
    };

    let otp = helpers.generateOTP(4);
    console.log("Generated OTP:", otp);

    //update query

    await knex("company_details")
      .where("user_mobileno", data.mobile_no)
      .update("otp", otp);

    res.json({ code: "200", message: "OTP successfully sent", otp: otp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "500",
      status: "error",
      message: "Something went wrong: " + error.message,
    });
  }
};

user.editRegister = async (req, res) => {
  try {
    console.log("editRegister")
    const data = req.body; console.log("data:", data)
    const ID = req.params.id;
    console.log("ID", ID)

    const store = {};

    if (data.user_name) {
      if (!helpers.validInputValue(data.user_name) || !helpers.validOnlyCharacters(data.user_name)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_name is required and should contain only alphabets",
        });
      }
      store["user_name"] = data.user_name;
    };
    if (data.user_mobileno) {
      if (!helpers.validInputValue(data.user_mobileno) || !helpers.validPhone(data.user_mobileno)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_mobileno is required and should contain only  10 number",
        });
      }
      store["user_mobileno"] = data.user_mobileno;
    };
    if (data.user_email) {
      if (!helpers.validInputValue(data.user_email) || !helpers.validEmail(data.user_email)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_email is required and should contain only valid email",
        });
      }
      store["user_email"] = data.user_email;
    };

    if (data.user_aadhar_no) {
      if (!helpers.validInputValue(data.user_aadhar_no) || !helpers.validAadhaar(data.user_aadhar_no)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "user_aadhar_no is required and should contain only valid aadhar",
        });
      }
      store["user_aadhar_no"] = data.user_aadhar_no;
    };
    if (data.company_name) {
      if (!helpers.validInputValue(data.company_name) || !helpers.validOnlyCharacters(data.company_name)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "company_name is required and should contain only alphabets",
        });
      }
      store["company_name"] = data.company_name;
    };

    if (data.company_mobileno) {
      if (!helpers.validInputValue(data.company_mobileno) || !helpers.validPhone(data.company_mobileno)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "company_mobileno is required and should contain only  10 number",
        });
      }
      store["company_mobileno"] = data.company_mobileno;
    };

    if (data.company_email) {
      if (!helpers.validInputValue(data.company_email) || !helpers.validEmail(data.company_email)) {
        return res.status(400).json({
          code: "400",
          status: false,
          message: "company_email is required and should contain only valid email",
        });
      }
      store["company_email"] = data.company_email;
    };
    console.log("store", store)

    //  Check if the employee exists and update
    const results = await knex.select("*").from("company_details").where("id", ID);
    if (results.length !== 1) {
      return res.status(404).json({ code: "404", status: "error", message: "Invalid ID" });
    } else {
      await knex("company_details").where("id", ID).update(store);
      return res.status(200).json({ code: "200", status: "success", message: "Successfully Update", data: store });
    }
  } catch (error) {
    console.log("Error:", error)
    return res.status(500).json({ code: "500", status: "error", message: "Something went wrong: " + error });
  }
};

module.exports = user;

