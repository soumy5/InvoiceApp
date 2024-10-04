require("dotenv").config()

let helpers = {};

//Send Response
helpers.response = (code, status, msg, data = "") => {
    let response = {};
    if (code) {
        response.code = code;
    }
    if (status) {
        response.status = status;
    }
    if (msg) {
        response.msg = msg;
    }
    if (data) {
        response.data = data;
    }
    return response;
};

helpers.validInputValue = (value) => {
    if (typeof value !== 'undefined' && value !== null && typeof value === 'string' && value.length > 0) {
        return true;
    } else {
        throw new Error('Invalid value');
    }
};

helpers.validOnlyCharacters = (value) => {
    const regexForChar = /^[A-Za-z\s]+$/;
    return regexForChar.test(value)

}

helpers.validEmail = (email) => {
    const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regexForEmail.test(email)
};

helpers.validPhone = (phone) => {
    // Assuming a valid phone number is a 10-digit number
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

helpers.validPincode = (pincode) => {
    const regexForPass = /^[1-9][0-9]{5}$/
    return regexForPass.test(pincode);
};

helpers.validPAN_no = (input) => {
    const pattern = /^([A-Z]{5})(\d{4})([A-Z]{1})$/;
    if (pattern.test(input)) {
        return true;
    }
};

helpers.validGST_no = (input) => {
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    if (pattern.test(input)) {
        return true;//29ABCDE1234F1Z5
    }
};

helpers.validAadhaar = (aadharNumber) => {
    const pattern = /^\d{12}$/;
    return pattern.test(aadharNumber)
};

// Generate a 6-digit OTP with only digits
helpers.generateOTP = (length) => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

module.exports = helpers;