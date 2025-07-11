const express = require("express");
const mongoose = require("mongoose");

// MongoDB connection URI - Make sure this is correct!
// Replace username, password, and cluster details with your actual MongoDB Atlas credentials
const uri =
  "mongodb+srv://rajdeep:daTDpra6Bz0UcAlj@cluster0.chzavsy.mongodb.net/jobseeker?retryWrites=true&w=majority&appName=Cluster0";

// Configure mongoose connection with proper error handling
mongoose.set("strictQuery", false);

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected via Mongoose successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Please check your MongoDB URI, username, and password");
    // process.exit(1)
  }
}

// Connect to MongoDB
connectToMongoDB();

// Define MongoDB schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userType: { type: String, enum: ["job_seeker", "recruiter"], required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", userSchema);
const Job = mongoose.model("Job", jobSchema);

const app = express();

let job_seekers_register = [];
let recruiter_register = [];

let loggedin_users = [];
let job_Posts = [];

//username: rajdeep

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/success", (req, res) => {
  res.sendFile(__dirname + "/public/success.html");
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, userType, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !userType || !password) {
      return res
        .status(400)
        .json({ message: "Missing details, please add full details" });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: `User already exists with this email ${email}` });
    }

    // Create new user in MongoDB
    const newUser = new User({
      name,
      email,
      userType,
      password,
    });

    const savedUser = await newUser.save();

    res.status(200).json({
      message: `User registered as ${userType} successfully!`,
      data: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        userType: savedUser.userType,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user in MongoDB
    const user = await User.findOne({ email, password, userType });

    if (!user) {
      return res.status(403).json({
        message: "Either user does not exist or email-password does not match",
      });
    }

    // Check if user is already logged in (you can store this in memory or MongoDB)
    let loggedInUserIndex = loggedin_users.findIndex(
      (loggedUser) => loggedUser.email == email
    );

    if (loggedInUserIndex !== -1) {
      return res.status(400).json({ message: "User already logged in" });
    }

    // Add user to logged in users array
    loggedin_users.push({
      email: user.email,
      userType: user.userType,
      id: user._id,
      name: user.name,
    });

    res.status(200).json({
      message: "User logged in successfully",
      LoggedInUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const {
      email,
      userType,
      title,
      companyName,
      location,
      description,
      postedBy,
    } = req.body;

    // Check if user is logged in
    if (!email || !userType || !postedBy) {
      return res
        .status(400)
        .json({ message: "Provide email, user-type and user-id" });
    }

    const user = loggedin_users.find(
      (user) =>
        user.email == email &&
        user.userType == "recruiter" &&
        user.id == postedBy
    );

    if (!user) {
      return res.status(401).json({ message: "Please login first" });
    }

    // Check if all job fields are provided
    if (!title || !companyName || !location || !description || !postedBy) {
      return res.status(400).json({ message: "Fill all the fields" });
    }

    // Create new job in MongoDB
    const newJob = new Job({
      title,
      companyName,
      location,
      description,
      postedBy,
    });

    const savedJob = await newJob.save();

    res.status(200).json({
      message: "Job posted successfully",
      job: {
        id: savedJob._id,
        title: savedJob.title,
        companyName: savedJob.companyName,
        location: savedJob.location,
        description: savedJob.description,
        postedBy: savedJob.postedBy,
        createdAt: savedJob.createdAt,
      },
    });
  } catch (error) {
    console.error("Job posting error:", error);
    res.status(500).json({ message: "Server error during job posting" });
  }
});

// Get all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email");
    res.status(200).json({
      message: "Jobs retrieved successfully",
      jobs: jobs,
    });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    res.status(500).json({ message: "Server error while retrieving jobs" });
  }
});

// Get all users (for admin purposes)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Don't include passwords
    res.status(200).json({
      message: "Users retrieved successfully",
      users: users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: "Server error while retrieving users" });
  }
});

// Get jobs by user (for recruiters to see their posted jobs)
app.get("/api/jobs/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const jobs = await Job.find({ postedBy: userId }).populate(
      "postedBy",
      "name email"
    );
    res.status(200).json({
      message: "User jobs retrieved successfully",
      jobs: jobs,
    });
  } catch (error) {
    console.error("Error retrieving user jobs:", error);
    res
      .status(500)
      .json({ message: "Server error while retrieving user jobs" });
  }
});

app.listen(3000, () => {
  console.log("App is running on http://localhost:3000");
});
