const helpers = require("../helpers");
const knex = require('../db.js')

require("dotenv").config()

let category = {};

category.createCategory = async (req, res) => {
    try {
        //insert_type=1 //create category, insert_type=2 //update category, insert_type=3 //features enable/disable
        const frombody = req.body;
        var user = req.user
        if (frombody.insert_type == 1) { //insert category
            if (!typeof frombody.category_name == "string") {
                return res.status(400).json(helpers.response("400", "error", "invalid input"))
            }
            let obj = {
                category_name: frombody.category_name,
                category_status: 1,
                created_by: user.id
            }
            obj.category_code = user.user_mobileno + "-" + obj.category_name
            knex("category_details").insert(obj).then((resp) => {
                return res.status(200).json(helpers.response("200", "success", "successfully inserted"))
            }).catch((e) => {
                return res.status(400).json(helpers.response("400", "error", "can not be added", e))
            })
        }
        else if (frombody.insert_type == 2) { //edit category
            let valid = false;
            Object.keys(frombody).forEach((element) => {
                if (frombody[element] === null || frombody[element] === "") {
                    delete frombody[element];
                }
            });
            const keyname = Object.keys(frombody);
            for (let i = 0; i < keyname.length; i++) {
                switch (keyname[i]) {
                    case "category_name":
                        var value = "";
                        if (keyname[i] === "category_name") { value = frombody.category_name; }
                        valid = (/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/).test(value);
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
                knex('category_details').where('category_id', req.body.category_id).update(frombody).then((resp) => {
                    return res.status(200).json(helpers.response("200", "success", "Successfully category details are updated"));
                }).catch((e) => {
                    return res.status(500).json(helpers.response("500", "error", "category details can not be updated " + e + ""));
                })
            }
        }
    } catch (e) {
        return res.status(500).json(helpers.response("500", "error", "something went wrong " + e + ""))
    }
}

category.showCategoryDetails = async (req, res) => {
    try {
        console.log("showCategoryDetails API");
        let q = await knex("category_details").select("*").where("category_status", 1);
        res.json({ code: "200", message: " successfully ", data: q });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            code: "500",
            status: "error",
            message: "Something went wrong: " + error.message,
        });
    }
};

category.getImageUrl = async (req, res) => {
    try {
        if (req.query.type == 1) {
            var targetPath = "./category_images/"
            geturl(targetPath,req.query.type)
        }
        else if (req.query.type == 2) {
            var targetPath = "./product_images/"
            geturl(targetPath,req.query.type)
        }
        else if (req.query.type == 3) {
            var targetPath = "./uploads/"
            geturl(targetPath,req.query.type)
        }
        else {
            return res.status(400).json(helpers.response("400", "error", "please insert 1 or 2 or 3 in type"));
        }
    }
    catch (e) {
        return res.status(500).json(helpers.response("500", "something went wrong", e));
    }
    async function geturl(targetPath,type) {
        var files = [], i;
        var arr = [];
        var query = url.parse(req.url, true).query;
        let pic = query.image;
        if (pic == undefined || pic == null) {
            fs.readdir(targetPath, function (err, list) {
                for (i = 0; i < list.length; i++) {
                    files.push(list[i]);
                    var image = "";
                    image = files[i];
                    arr.push({
                        id: i,
                        url: 'http://localhost:3010/getImageUrl?_format=json&image=' + image+"&type="+type
                        // url: 'https://invoice.apptimates.com/getImageUrl?_format=json&image=' + image+"&type="+type
                    });
                }
                return res.status(200).json(helpers.response("200", "success","targetPath:"+targetPath, arr));
            });
        } else {
            fs.readFile(targetPath + pic, function (err, content) {
                if (err) {
                    res.writeHead(404, { 'Content-type': 'text/html' })
                    res.end("No such image");
                } else {
                    res.writeHead(200, { 'Content-type': 'image/png' });
                    res.end(content);
                }
            });
        }
    }
}

module.exports = category;