const express = require("express");
const app = express.Router();
const db = require("../db/db");

app.put("/trans_booking/:bookingId/", (req, res) => {
  const bookingId = req.params.bookingId;
  const { Payment_status } = req.body;

  if (Payment_status !== "paid" && Payment_status !== "unpaid") {
    return res.status(400).json({ error: "Invalid payment status value" });
  }

  db.query(
    "UPDATE trans_booking SET Payment_status= ? WHERE booking_Id = ?",
    [Payment_status, bookingId],
    (error, results) => {
      if (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ error: "Internal server error" });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: "Booking not found" });
      } else {
        res.json({ message: "Payment status updated successfully" });
      }
    }
  );
});

app.post('/trans_booking/:user_id', (req, res) => {
  const user_id = req.params.user_id; 
  const {
    booking_date,
    from_latitude,
    from_longitude,
    from_Place,
    to_latitude,
    to_longitude,
    to_Place,
    km_distance,
    is_confirm,
    driver_id,
    Amount,
    Coupon_amount,
    total_amount,
    Payment_status,
    booking_status,
    vehicle_Id
  } = req.body;

  const fromPlaceString = typeof from_Place === 'object' ? JSON.stringify(from_Place) : from_Place;
  const toPlaceString = typeof to_Place === 'object' ? JSON.stringify(to_Place) : to_Place;

  db.query(
    'INSERT INTO trans_booking (booking_date, user_id, from_latitude, from_longitude, from_Place, to_latitude, to_longitude, to_Place, km_distance, is_confirm, driver_id, Amount, Coupon_amount, total_amount, Payment_status, booking_status, vehicle_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      booking_date,
      user_id, 
      from_latitude,
      from_longitude,
      fromPlaceString,
      to_latitude,
      to_longitude,
      toPlaceString,
      km_distance,
      is_confirm,
      driver_id,
      Amount,
      Coupon_amount,
      total_amount,
      Payment_status,
      booking_status,
      vehicle_Id
    ],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(201).json({ message: 'Booking created successfully', bookingId: results.insertId });
      }
    }
  );
});


app.post('/mas_vehicles', (req, res) => {
  const vehicle = req.body;

  vehicle.vehicle_Name = JSON.stringify(vehicle.vehicle_Name);
  vehicle.vehicle_Number = JSON.stringify(vehicle.vehicle_Number);
  vehicle.vehicle_Type = JSON.stringify(vehicle.vehicle_Type);


  db.query('INSERT INTO mas_vehicle SET ?', vehicle, (error, results) => {
    if (error) {
      console.error('Error inserting vehicle data:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Vehicle created successfully' });
    }
  });
});


app.post('/mas_fav_Place', (req, res) => {
  const favoritePlace = req.body;

  favoritePlace.place_Name = JSON.stringify(favoritePlace.place_Name);
  favoritePlace.latitude = JSON.stringify(favoritePlace.latitude);
  favoritePlace.longitude = JSON.stringify(favoritePlace.longitude);

  db.query('INSERT INTO mas_fav_place SET ?', favoritePlace, (error, results) => {
    if (error) {
      console.error('Error inserting favorite place data:', error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Favorite place created successfully' });
    }
  });
});


const vehicleCharges = [
  { vehicle_Type_Id: 1, vehicle_Type: 'bike', charge_per_km: 10 },
  { vehicle_Type_Id: 2, vehicle_Type: 'car', charge_per_km: 25 },
  { vehicle_Type_Id: 3, vehicle_Type: 'auto', charge_per_km: 20 },
  { vehicle_Type_Id: 4, vehicle_Type: 'electrical vehicle', charge_per_km: 40 },
  { vehicle_Type_Id: 5, vehicle_Type: 'premium car', charge_per_km: 50 },
];

// Define a GET route to get the charge for a vehicle
app.get('/vehicle_charge', (req, res) => {
  const vehicle_Type_Id = req.query.vehicle_Type_Id;
  const distance = req.query.distance;

  const vehicleCharge = vehicleCharges.find(
    (v) => v.vehicle_Type_Id === parseInt( vehicle_Type_Id, 10)
  );

  if (!vehicleCharge) {
    res.status(404).json({ message: 'Vehicle type not found' });
  } else if (isNaN(distance)) {
    res.status(400).json({ message: 'Invalid distance' });
  } else {
    const charge = vehicleCharge.charge_per_km * parseFloat(distance);
    res.json({ charge });
  }
});
//================================faremanagement=======================
// app.post('/flat_fare', (req, res) => {
//   const flatfare = req.body;
//  db.query('INSERT INTO flat_fare SET ?', flatfare, (error, results) => {
//     if (error) {
//       console.error('Error inserting flat_fare data:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     } else {
//       res.json({ message: ' flatfare successfully' });
//     }
//   });
// });





app.get('/flatfare', (req, res) => {
  const query = 'SELECT *  FROM flat_fare';

  db.query(query, (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Database error' });
          return;
      }

      res.json(results);
  });
});
app.get('/rangefare', (req, res) => {
  const query = 'SELECT *  FROM range_fare';

  db.query(query, (err, results) => {
      if (err) {
          res.status(500).json({ error: 'Database error' });
          return;
      }

      res.json(results);
  });
});

app.post('/flat_fare', (req, res) => {
  const q = "INSERT INTO flat_fare(`vehicle_Type`, `per_km`, `Amount`) VALUES(?)";
  const values = [
      req.body.vehicle_Type,
      req.body.per_km,
      req.body.Amount,];
  db.query(q, [values], (err) => {
      if (err) return res.json(err);
     return res.status(200).json("flatfare add successfully.");
  });
});

app.delete('/flat_fare/:id', (req, res) => {
  const flatFareId = req.params.id;

  db.query('SELECT * FROM flat_fare WHERE flat_fare_id = ?', [flatFareId], (err, results) => {
    if (err) {
      console.error('Error checking if flat_fare data exists:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (results.length === 0) {
        res.status(404).json({ error: 'Id not found' });
      } else {
        db.query('DELETE FROM flat_fare WHERE flat_fare_id = ?', [flatFareId], (err, deleteResults) => {
          if (err) {
            console.error('Error deleting flat_fare data:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
           
            res.status(200).json({ id: flatFareId, message: 'Successfully deleted' });
          }
        });
      }
    }
  });
});




app.put('/flat_fare/:id', (req, res) => {
  const flatFareId = req.params.id;
  const updatedData = req.body; 

  db.query('SELECT * FROM flat_fare WHERE flat_fare_id = ?', [flatFareId], (err, preUpdateResults) => {
    if (err) {
      console.error('Error checking if flat_fare data exists:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (preUpdateResults.length === 0) {
        res.status(404).json({ error: 'Id not found' });
      } else {
       
        db.query('UPDATE flat_fare SET ? WHERE flat_fare_id = ?', [updatedData, flatFareId], (err, updateResults) => {
          if (err) {
            console.error('Error updating flat_fare data:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
                res.status(200).json({ id: flatFareId, message: 'Update successful' });
          }
        });
      }
    }
  });
});

app.post('/Range_fare', (req, res) => {
  const q = "INSERT INTO range_fare(`vehicle_Type`, `from_km`, `to_km`,`Amount`) VALUES(?)";
  const values = [
      req.body.vehicle_Type,
      req.body.from_km,
      req.body.to_km,
      req.body.Amount,];
  db.query(q, [values], (err) => {
      if (err) return res.json(err);
     return res.status(200).json("Rangefare add successfully.");
  });
});


app.delete('/range_fare/:id', (req, res) => {
  const rangeFareId = req.params.id;

  db.query('SELECT * FROM range_fare WHERE range_fare_id = ?', [rangeFareId], (err, results) => {
    if (err) {
      console.error('Error checking if flat_fare data exists:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (results.length === 0) {
        res.status(404).json({ error: 'Id not found' });
      } else {
        db.query('DELETE FROM range_fare WHERE range_fare_id = ?', [rangeFareId], (err, deleteResults) => {
          if (err) {
            console.error('Error deleting flat_fare data:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
           
            res.status(200).json({ id: rangeFareId, message: 'Successfully deleted' });
          }
        });
      }
    }
  });
});

app.put('/range_fare/:id', (req, res) => {
  const rangeFareId = req.params.id;
  const updatedData = req.body; 

  db.query('SELECT * FROM range_fare WHERE range_fare_id = ?', [rangeFareId], (err, preUpdateResults) => {
    if (err) {
      console.error('Error checking if range_fare data exists:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (preUpdateResults.length === 0) {
        res.status(404).json({ error: 'Id not found' });
      } else {
       
        db.query('UPDATE range_fare SET ? WHERE range_fare_id = ?', [updatedData, rangeFareId], (err, updateResults) => {
          if (err) {
            console.error('Error updating range_fare data:', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
                res.status(200).json({ id: rangeFareId, message: 'Update successful' });
          }
        });
      }
    }
  });
});
module.exports = app; 