const express = require("express");
const app = express.Router();
const db = require("../db/db");


app.get("/user_details", (req, res) => {
    const userId = req.params.user_id;


    const query = `
        SELECT
          u.*,
          e.*,
          a.*
        FROM mas_user AS u
        LEFT JOIN mas_user_emg_Contact AS e ON u.user_id = e.user_id
        LEFT JOIN mas_UserAddress AS a ON u.user_id = a.user_id
       
      `;

    db.query(query, [userId], (error, results) => {
        if (error) {
            console.error("Error retrieving user details:", error);
            res.status(500).json({ status: "error", message: "An error occurred" });
        } else if (results.length === 0) {
            res.status(404).json({ status: "error", message: "User not found" });
        } else {
            res.status(200).json({ status: "success", results });
        }
    });
});


app.get('/totaluser', (req, res) => {
    const query = 'SELECT user_id, first_Name, last_Name, MobileNo, gender, Date_time, Referal_Code FROM mas_user ORDER BY user_id DESC';

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }

        res.json(results);
    });
});

app.get('/totalbooking', (req, res) => {
    const query = 'SELECT  booking_id,user_id, booking_date,from_Place,to_Place,km_distance, Amount, Coupon_amount, total_amount, Payment_status, booking_status, vehicle_Id  FROM trans_booking ORDER BY booking_id DESC';

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }

        res.json(results);
    });
});

app.get("/totalUserCount", (req, res) => {
    const countUsersQuery = "SELECT COUNT(DISTINCT user_id) AS totalUsers FROM mas_user";

    db.query(countUsersQuery, (error, results) => {
        if (error) {
            console.error("Error counting users:", error);
            res.status(500).json({ status: "error", message: "An error occurred" });
        } else {
            const totalUsers = results[0].totalUsers;
            res.status(200).json({
                status: "success",
                message: "Total number of users",
                totalUsers: totalUsers,
            });
        }
    });
});

app.get("/totalUserbooking", (req, res) => {
    const countUsersQuery = "SELECT COUNT(DISTINCT user_id) AS totalUsers FROM mas_user";

    db.query(countUsersQuery, (error, results) => {
        if (error) {
            console.error("Error counting users:", error);
            res.status(500).json({ status: "error", message: "An error occurred" });
        } else {
            const totalUsers = results[0].totalUsers;
            res.status(200).json({
                status: "success",
                message: "Total number of users",
                totalUsers: totalUsers,
            });
        }
    });
});

// app.get("/pendingUsers", (req, res) => {
//     const countUsersQuery = "SELECT COUNT(DISTINCT booking_Id) AS totalUsers FROM trans_booking";

//     db.query(countUsersQuery, (error, results) => {
//         if (error) {
//             console.error("Error counting users:", error);
//             res.status(500).json({ status: "error", message: "An error occurred" });
//         } else {
//             const totalUsers = results[0].totalUsers;
//             res.status(200).json({
//                 status: "success",
//                 message: "Total number of users",
//                 totalUsers: totalUsers,
//             });
//         }
//     });
// });

app.get("/pendingUsers", (req, res) => {
    const selectQuery = "SELECT * FROM mas_user WHERE profile_Image ||  Emergency_No IS NULL";

    db.query(selectQuery, (error, results) => {
        if (error) {
            console.error("Error retrieving user data:", error);
            return res.status(500).json({ status: "error", message: "An error occurred" });
        }

        const pendingUsers = results.length;

        res.status(200).json({
            status: "success",
            message: "Total pending users without profile image",
            pendingUsersCount: pendingUsers,
        });
    });
});

app.get("/freshUsers", (req, res) => {
    const currentDate = new Date();
    const tenDayAgo = new Date(currentDate);

    tenDayAgo.setDate(tenDayAgo.getDate() - 4);
    const cDate = new Date();
    const sixDayAgo = new Date(cDate);
    sixDayAgo.setDate(sixDayAgo.getDate() - 6);
    const selectQuery = `
      SELECT COUNT(*) AS freshUsers 
      FROM mas_user 
      WHERE Date_time >= ?;
    `;

    db.query(selectQuery, [tenDayAgo, sixDayAgo], (error, results) => {
        if (error) {
            console.error("Error counting fresh users:", error);
            res.status(500).json({ status: "error", message: "An error occurred" });
        } else {
            const freshUsers = results[0].freshUsers;
            const freshUserss = results[0].freshUserss;
            res.status(200).json({
                status: "success",
                message: "Total number of fresh users in the last 15 minutes",
                freshUsers: freshUsers,
                freshUserss: freshUserss,
            });
        }
    });
});
app.get('/bell_notifications', (req, res) => {
    const currentDate = new Date();
    const tenDayAgo = new Date(currentDate);
    tenDayAgo.setDate(tenDayAgo.getDate() - 4);

    const selectQuery = `
      SELECT 
        COUNT(*) AS user_count,
        GROUP_CONCAT(first_Name) AS user_names
      FROM mas_user
      WHERE Date_time >= ?;
    `;

    db.query(selectQuery, [tenDayAgo], (error, results) => {
        if (error) {
            console.error("Error counting fresh users:", error);
            res.status(500).json({ status: "error", message: "An error occurred" });
        } else {
            const user_count = results[0].user_count;
            const user_names = results[0].user_names.split(',');

            res.status(200).json({
                status: "success",
                user_count: user_count ,
                user_names: user_names,
            });
        }
    });
});

app.get('/chartcount', (req, res) => {
    const query = `
      SELECT
        calendar.month_name as month,
        COALESCE(SUM(CASE WHEN booking_status = 'booked' THEN 1 ELSE 0 END), 0) as bookings,
        COALESCE(SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancel
      FROM
        (
          SELECT 1 as month, 'Jan' as month_name
          UNION SELECT 2, 'Feb'
          UNION SELECT 3, 'Mar'
          UNION SELECT 4, 'Apr'
          UNION SELECT 5, 'May'
          UNION SELECT 6, 'Jun'
          UNION SELECT 7, 'Jul'
          UNION SELECT 8, 'Aug'
          UNION SELECT 9, 'Sep'
          UNION SELECT 10, 'Oct'
          UNION SELECT 11, 'Nov'
          UNION SELECT 12, 'Dec'
        ) as calendar
        LEFT JOIN trans_booking ON calendar.month = MONTH(trans_booking.booking_date)
      GROUP BY
        calendar.month_name
      ORDER BY
        FIELD(calendar.month_name, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing MySQL query: ' + err.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results);
    });
});

module.exports = app;