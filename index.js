import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken'; 

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
});

const JWT_SECRET = process.env.JWT_SECRET || "JUSB098";

// Define a schema and model for User
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    pwd: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Define a schema and model for tabelData
const tableDataSchema = new mongoose.Schema({
    id: Number,
    projectname: String,
    description: String,
    technologies: String,
    deadlines: String,
    projectMembers: String,
    status: String,
    client: String,
    budget: String,
    priority: String
});

const TableData = mongoose.model('tabelData', tableDataSchema);

// Routes
app.get('/get', async (req, res) => {
    try {
        const projects = await TableData.find({}).sort({ id: 1 });  
        res.send(projects);  
    } catch (err) {
        res.status(500).send('Error fetching projects');
    }
}); 

// Add  
app.post('/add', async (req, res) => {
    const newProject = req.body;

    try {
        const latestProject = await TableData.findOne().sort({ id: -1 });   
        newProject.id = latestProject ? latestProject.id + 1 : 1;

        const project = new TableData(newProject);
        await project.save();
        res.status(201).send("Project Added Successfully!");
    } catch (err) {
        res.status(500).send("Error adding project");
    }   
});


// update  
app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const result = await TableData.updateOne({ id: parseInt(id) }, { $set: updatedData });
        res.send("Row Updated Successfully !");
    } catch (err) {
        res.status(500).send("Error updating project"); 
    }
});   
 
// delete  
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await TableData.deleteOne({ id: parseInt(id) });
        if (result.deletedCount === 0) {
            res.status(404).send("No project found with that id");
        } else {
            res.send("Row Deleted Successfully!");  
        }
    } catch (err) {
        res.status(500).send("Error deleting project");
    }
});         

app.post('/signup', async (req, res) => {
    try {
        const { email, pwd } = req.body;

        if (!email || !pwd) {
            return res.status(400).send('Email and password are required');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(pwd, salt);

        const newUser = new User({
            email,
            pwd: hashedPassword
        });

        await newUser.save();

        res.status(201).send(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, pwd } = req.body;

        if (!email || !pwd) {
            return res.status(400).send('Email and password are required');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Invalid email or password');   
        }

        const isMatch = await bcrypt.compare(pwd, user.pwd);
        if (!isMatch) {
            return res.status(401).send('Invalid email or password');
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).send({ token });
    } catch (error) {
        console.error('Error logging in:', error);  
        res.status(500).send('Error logging in');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 
