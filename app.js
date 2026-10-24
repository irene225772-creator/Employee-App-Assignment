
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the provided frontend without modifying its files
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Employee schema and model
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true }
});

const Employee = mongoose.model('Employee', employeeSchema);

// GET: Retrieve all employees
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve employees' });
    }
});

// GET: Retrieve one employee by ID
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve employee' });
    }
});

// POST: Add a new employee
app.post('/api/employeelist', async (req, res) => {
    try {
        const { name, location, position, salary } = req.body;

        if (!name || !location || !position || salary === undefined ||
            salary === null || salary === '' || !Number.isFinite(Number(salary))) {
            return res.status(400).json({
                message: 'Please provide valid name, location, position and salary'
            });
        }

        const employee = await Employee.create({
            name, location, position, salary: Number(salary)
        });

        res.status(201).json(employee);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to add employee' });
    }
});

// PUT: Update an employee using the ID in the request body
app.put('/api/employeelist', async (req, res) => {
    try {
        const { _id, id, name, location, position, salary } = req.body;
        const employeeId = _id || id;

        if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
            return res.status(400).json({
                message: 'Provide a valid employee ID in _id or id'
            });
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (location !== undefined) updates.location = location;
        if (position !== undefined) updates.position = position;
        if (salary !== undefined) {
            if (!Number.isFinite(Number(salary)) || salary === '') {
                return res.status(400).json({ message: 'Invalid salary' });
            }
            updates.salary = Number(salary);
        }

        const employee = await Employee.findByIdAndUpdate(
            employeeId,
            updates,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update employee' });
    }
});

// DELETE: Remove one employee by ID
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete employee' });
    }
});

// Keep the provided frontend fallback
app.get('/{*path}', function (req, res) {
    res.sendFile(
        path.join(__dirname, 'dist', 'Frontend', 'index.html')
    );
});

// Connect to MongoDB, then start the server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    });
