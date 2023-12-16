const express = require("express");
const app = express.Router();
const db = require("../db/db");

app.post("/Create_user", (req, res) => {
  const userData = req.body;
  const { MobileNo, first_Name, last_Name, is_AcceptTerms, gender } = userData;

  function generateReferralCode(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklMNOPQRSTUVWXYZ0123456789";
    const codeLength = 7 || length;
    let referralCode = "";

    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters.charAt(randomIndex);
    }

    return referralCode;
  }

  if (!first_Name) {
    res.status(400).json({
      status: "error",
      message: "First Name is required",
    });
    return;
  }

  if (!last_Name) {
    res.status(400).json({
      status: "error",
      message: "Last Name is required",
    });
    return;
  }

  if (!MobileNo) {
    res.status(400).json({
      status: "error",
      message: "Mobile Number is required",
    });
    return;
  }

  if (!is_AcceptTerms) {
    res.status(400).json({
      status: "error",
      message: "You must accept the terms and conditions",
    });
    return;
  }

  if (!gender) {
    res.status(400).json({
      status: "error",
      message: "Gender is required",
    });
    return;
  }

  const Referal_Code = generateReferralCode(7);
  const Date_time=new Date();

  const checkUserQuery = "SELECT user_id FROM mas_user WHERE MobileNo = ?";
  db.query(checkUserQuery, [MobileNo], (error, results) => {
    if (error) {
      console.error("Error checking user:", error);
      res.status(500).json({ status: "error", message: "An error occurred" });
    } else if (results.length > 0) {
      res.status(400).json({ status: "error", message: "User already exists" });
    } else {
      const sql = `
          INSERT INTO mas_user (
            user_Name, pass_word, first_Name, last_Name, MobileNo, OTP, OTP_Exp,
            is_AcceptTerms, profile_Image, Wallet_Amount, gender, Emergency_No, Referal_Code,Date_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
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
        Referal_Code,
        Date_time
      ];

      db.query(sql, values, (regError, regResults) => {
        if (regError) {
          console.error("Error inserting data:", regError);
          res
            .status(500)
            .json({ status: "error", message: "Failed to insert data" });
        } else {
          console.log("Data inserted successfully.");
          console.log("User registered with referral code:", Referal_Code);
          console.log("new user time:",Date_time);
          res.status(200).json({
            status: "success",
            message: "Data inserted successfully",
            results: regResults,
          });
        }
      });
    }
  });
});
app.post("/send_OTP", (req, res) => {
  const { MobileNo } = req.body;

  const OTP = generateOTP();
  const OTP_Exp = new Date(Date.now() + 300000);
  saveOTPInDatabase(MobileNo, OTP, OTP_Exp);
  res
    .status(200)
    .json({ status: "success", message: "OTP sent successfully", OTP: OTP });
});
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function OTP_ExpTimeOut() {
  return (OTP_Exp = new Date(Date.now() + 180000));
}
function saveOTPInDatabase(MobileNo, OTP, OTP_Exp) {
  const sql =
    "UPDATE mas_user SET MobileNo = ?, OTP = ?, OTP_Exp = ? WHERE MobileNo = ?";
  db.query(sql, [MobileNo, OTP, OTP_Exp, MobileNo], (error, result) => {
    if (error) {
      console.error("Error saving OTP:", error);
    } else {
      console.log("OTP saved successfully.");
    }
  });
}

app.post("/verify_OTP", (req, res) => {
  const { MobileNo, OTP } = req.body;

  const currentTimestamp = new Date();

  const sql =
    "SELECT * FROM mas_user WHERE MobileNo = ? and OTP = ? and OTP_Exp > ?";
  db.query(sql, [MobileNo, OTP, currentTimestamp], (error, results) => {
    if (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ status: "error", message: "An error occurred" });
    } else if (results.length > 0) {
      const OTP_verified = true;
      saveOTPVerifiedDatabase(MobileNo, OTP_verified);
      res
        .status(200)
        .json({
          status: "success",
          message: "OTP verified and login successfully",
          OTP_Exp: results[0].OTP_Exp,
        });
    } else {
      res.status(400).json({ status: "error", message: "Invalid OTP" });
    }
  });
});
function saveOTPVerifiedDatabase(MobileNo, OTP_verified) {
  const sql = "UPDATE mas_user SET OTP_verified= ? WHERE MobileNo = ?";
  db.query(sql, [OTP_verified, MobileNo], (error, result) => {
    if (error) {
      console.error("Error saving OTP:", error);
    } else {
      console.log("OTP saved successfully.", result);
    }
  });
}
app.post("/login", (req, res) => {
  const { MobileNo } = req.body;

  const sql = "SELECT * FROM mas_user WHERE MobileNo = ?";

  db.query(sql, [MobileNo], (error, result) => {
    if (error) {
      console.error("Error during login:", error);
      res
        .status(500)
        .json({ status: "error", message: "An error occurred during login" });
    } else if (result.length > 0) {
      const OTP = generateOTP();
      const OTP_Exp = OTP_ExpTimeOut();
      saveOTPInDatabase(MobileNo, OTP, OTP_Exp);
      res
        .status(200)
        .json({ status: "success", message: "Login successful", OTP: OTP });
    } else {
      res
        .status(400)
        .json({ status: "error", message: "Invalid MobileNo or user_ID" });
    }
  });
});


app.get("/getuser/:userId", (req, res) => {
  const userId = req.params.userId;

  const selectQuery = `
      SELECT user_id, user_Name, first_Name, last_Name, MobileNo, OTP, OTP_Exp,
        is_AcceptTerms, profile_Image, Wallet_Amount, gender, Emergency_No, Referal_Code
      FROM mas_user
      WHERE user_id = ?;
    `;

  db.query(selectQuery, [userId], (error, results) => {
    if (error) {
      console.error("Error retrieving user data:", error);
      return error;
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const user = results[0];
    res.status(200).json({ status: "success", user });
  });
});

app.get("/getuser", (req, res) => {
  const selectQuery = `SELECT * FROM mas_user `;

  db.query(selectQuery, (error, results) => {
    if (error) {
      console.error("Error retrieving user data:", error);
      return error;
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Database empty" });
    }

    res.status(200).json({ status: "success", results });
  });
});

app.post("/mas_UserAddress/:user_id", (req, res) => {
  const {
    addresstype_id,
    address,
    city_Name,
    state_Name,
    pincode,
    latitude,
    longitude,
    is_Default,
  } = req.body;

  const user_id = req.params.user_id;

  const userExistQuery = "SELECT user_id FROM mas_user WHERE user_id = ?";
  db.query(userExistQuery, [user_id], (userExistError, userExistRows) => {
    if (userExistError) {
      console.error("Error checking for existing user:", userExistError);
      res.status(500).json({ error: "Error checking for an existing user" });
    } else if (userExistRows.length === 0) {
      res.status(400).json({ error: "User ID does not exist" });
    } else {
      const query = "INSERT INTO mas_UserAddress SET ?";

      const newAddress = {
        addresstype_id,
        user_id,
        address,
        city_Name,
        state_Name,
        pincode,
        latitude,
        longitude,
        is_Default,
      };

      db.query(query, newAddress, (insertError, result) => {
        if (insertError) {
          console.error("Error adding user address:", insertError);
          res.status(500).json({ error: "Error adding user address" });
        } else {
          res
            .status(201)
            .json({
              message: "User address added successfully",
              insertId: result.insertId,
            });
        }
      });
    }
  });
});

app.post('/add_emergency_contact/:user_id', (req, res) => {
  const user_id = req.params.user_id;
  const { emg_Contact } = req.body;

  const checkUserQuery = 'SELECT user_id FROM mas_user WHERE user_id = ?';
  db.query(checkUserQuery, [user_id], (checkUserError, checkUserResults) => {
    if (checkUserError) {
      console.error('Error checking user in the database:', checkUserError);
      res.status(500).json({ status: 'error', message: 'An error occurred in check primary' });
    } else if (checkUserResults.length === 0) {
      res.status(404).json({ status: 'error', message: 'User not found' });
    } else {
      const checkMobileNoQuery = 'SELECT user_id FROM mas_user_emg_Contact WHERE  emg_Contact= ? and user_id = ?';
      db.query(checkMobileNoQuery, [emg_Contact, user_id], (checkMobileNoError, checkMobileNoResults) => {
        if (checkMobileNoError) {
          console.error('Error checking MobileNo in the database:', checkMobileNoError);
          res.status(500).json({ status: 'error', message: 'An error occurred' });
        } else if (checkMobileNoResults.length > 0) {
          res.status(409).json({ status: 'error', message: 'Mobile Number is already in use.' });
        } else {
          const query = 'INSERT INTO mas_user_emg_Contact (user_id, emg_Contact) VALUES (?, ?)';
          const values = [user_id, emg_Contact];
          db.query(query, values, (error, result) => {
            if (error) {
              console.error('Error adding emergency contact:', error);
              res.status(500).json({ status: 'error', message: 'Error adding emergency contact' });
            } else {
              res.status(201).json({ status: 'success', message: 'Emergency contact added successfully' });
            }
          });
        }
      });
    }
  });
});
app.post('/addresstypes/:user_id', (req, res) => {
  const user_id = req.params.user_id;
  const { addresstype } = req.body;
  const sql = 'INSERT INTO mas_AddressType (addresstype,user_id) VALUES (?,?)';
  db.query(sql, [addresstype, user_id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.status(201).json({ message: 'Address type added successfully', insertId: result.insertId });
  });
});
app.get('/addresstypes/:user_id', (req, res) => {
  const addresstype = req.params.user_id;
  const sql = 'SELECT * FROM mas_AddressType';
  db.query(sql, [addresstype], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json({ addressTypes: results });

  });
 });
module.exports = app;

