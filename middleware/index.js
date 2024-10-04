const jwt = require('jsonwebtoken');

const authentication = function (req, res, next) {
    try {
        let token = req.headers['authorization']

        if (!token) {
            return res.status(400).send({ code: "400", status: false, message: "neccessary header token is missing" })
        }

        jwt.verify(token, "invoice_APP", (err, Decoded) => {
            if (err) { return res.status(401).send({ code: "401", status: false, message: "failed authentication" }) }

            // console.log(Decoded)
            req.user = Decoded

        })
        next()

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
};


const authorisation = async function (req, res, next) {
    try {
        const userID = req.params.id;
        let userIDnumber = Number(userID);


        const user = req.user; //decoded token


        if (userID && user.id !== userIDnumber) {
            return res.json({
                code: "403",
                status: false,
                message: "userID does not match with token",
            });
        }else{
            next()
        }
        
    }
    catch (err) {
        return res.json({ code: "500", message: "error" })
    }

}
module.exports = { authentication, authorisation }