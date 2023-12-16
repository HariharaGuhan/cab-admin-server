const express = require("express");
const app = express.Router();
const db = require("../db/db");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'public/images');
    },
    filename: (req, file, callback) => {
      callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  app.put('/upload/:user_id', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
  
    const user_id = req.params.user_id;
    const imageUrl = `/images/${req.file.filename}`;
  
  
    db.query('SELECT * FROM mas_user WHERE user_id = ?', [user_id], (err, results) => {
      if (err) {
        console.error('Error checking user ID:', err);
        res.status(500).send('Error checking user ID.');
      } else if (results.length === 0) {
        res.status(404).send('userid not found.');
      } else {
  
        console.log(imageUrl);
        const updateQuery = 'UPDATE mas_user SET profile_Image = ? WHERE user_id = ?';
        db.query(updateQuery, [imageUrl, user_id], (err, result) => {
          if (err) {
            console.error('Error uploading image:', err);
            res.status(500).send('Error uploading image.');
          } else {
            console.log('Image uploaded:', result.insertId);
            res.status(200).send('Image uploaded successfully.');
          }
        });
      }
    });
  });
  app.put("/update_user/:user_id", (req, res) => {
    const userId = req.params.user_id;
    const userData = req.body;
    const mobileNo = userData.MobileNo;
  
  
    const checkUserQuery = "SELECT user_id FROM mas_user WHERE user_id = ?";
    db.query(checkUserQuery, [userId], (checkUserError, checkUserResults) => {
      if (checkUserError) {
        console.error("Error checking user in the database:", checkUserError);
        return checkUserError;
      }
  
      if (checkUserResults.length === 0) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      }
  
      const checkMobileNoQuery =
        "SELECT user_id FROM mas_user WHERE MobileNo = ? AND user_id != ?";
      db.query(
        checkMobileNoQuery,
        [mobileNo, userId],
        (checkMobileNoError, checkMobileNoResults) => {
          if (checkMobileNoError) {
            console.error(
              "Error checking MobileNo in the database:",
              checkMobileNoError
            );
            return checkMobileNoError;
          }
  
          if (checkMobileNoResults.length > 0) {
            return res
              .status(409)
              .json({
                status: "error",
                message: "Mobile Number is already in use.",
              });
          }
  
          const updateQuery = `
            UPDATE mas_user
            SET user_Name = ?,
                pass_word = ?,
                first_Name = ?,
                last_Name = ?,
                MobileNo = ?,
                OTP = ?,
                OTP_Exp = ?,
                is_AcceptTerms = ?,
                profile_Image = ?,
                Wallet_Amount = ?,
                gender = ?,
                Emergency_No = ?
                
            WHERE user_id = ?
          `;
  
          const values = [
            userData.user_Name,
            userData.pass_word,
            userData.first_Name,
            userData.last_Name,
            userData.MobileNo,
            userData.OTP,
            userData.OTP_Exp,
            userData.is_AcceptTerms,
            userData.profile_Image,
            userData.Wallet_Amount,
            userData.gender,
            userData.Emergency_No,
           
            userId
          ];
  
          db.query(updateQuery, values, (updateError, results) => {
            if (updateError) {
              console.error("Error updating user data:", updateError);
              return updateError;
            }
  
            console.log("User data updated successfully.");
            res
              .status(200)
              .json({
                status: "success",
                message: "User data updated successfully",
                results,
              });
          });
        }
      );
    });
  });
  module.exports = app;