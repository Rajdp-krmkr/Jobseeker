const express = require("express");
const app = express();

let job_seekers_register = [];
let recruiter_register = [];

let loggedin_users = [];
let job_Posts = [];

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/success", (req, res) => {
  res.sendFile(__dirname + "/public/success.html");
});

app.post("/api/register", (req, res) => {
  const { name, email, userType, password } = req.body;

  // to check if all the fields are available
  if (!name || !email || !userType || !password) {
    return res
      .status(400)
      .json({ message: "Missing details, please add full details" });
  }

  let id;

  if (userType == "job_seeker") {
    //checking if the user already exists in the register
    const userIndex = job_seekers_register.findIndex(
      (user) => user.email == email
    );

    if (userIndex != -1) {
      return res
        .status(400)
        .json({ message: `user already exists with this email ${email}` });
    }

    //code of job seekers
    id = job_seekers_register.length + 1;

    const job_seekers_data = { id, name, email, userType, password };

    job_seekers_register.push(job_seekers_data);
  } else {
    //checking if the user already exists in the register
    const userIndex = recruiter_register.findIndex(
      (user) => user.email == email
    );

    if (userIndex != -1) {
      return res
        .status(400)
        .json({ message: `user already exists with this email ${email}` });
    }

    //code of recruiters
    id = recruiter_register.length + 1;

    const recruiter_data = { id, name, email, userType, password };

    recruiter_register.push(recruiter_data);
  }

  res.status(200).json({
    message: `user registered in ${
      userType == "job_seeker" ? "job seekers" : "recruiters"
    } successfully!`,
    data: { id, name, email, userType },
  });
});

app.post("/api/login", (req, res) => {
  //comming from user's desktop
  const { email, password, userType } = req.body;

  // !undefined = true
  // !null = true

  if (!email || !password || !userType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let user;

  if (userType === "job_seeker") {
    user = job_seekers_register.find(
      (user) => user.email == email && user.password == password
    );
  } else {
    //recruiter case
    user = recruiter_register.find(
      (user) => user.email == email && user.password == password
    );
  }

  // case: user does not exist or email-password unmatched
  if (!user) {
    return res.status(403).json({
      message: "Either user does not exist or email-password does not match",
    });
  }

  // if user exists in loggedinUser array
  let loggedInUserIndex = loggedin_users.findIndex(
    (user) => user.email == email
  );

  if (loggedInUserIndex !== -1) {
    return res.status(400).json({ message: "user already loggedin" });
  }

  // user exists
  loggedin_users.push({ email, userType, id: user.id, name: user.name });

  res.status(200).json({
    message: "user loggedin successfully",
    LoggedInUser: loggedin_users,
  });
});

app.post("/api/jobs", (req, res) => {
  const {
    email,
    userType,
    title,
    companyName,
    location,
    description,
    postedBy,
  } = req.body;

  // checking if user is logged in

  if (!email || !userType || !postedBy) {
    return res
      .status()
      .json({ message: "Provide email, user-type and user-id" });
  }

  const user = loggedin_users.find(
    (user) =>
      user.email == email && user.userType == "recruiter" && user.id == postedBy
  );

  if (!user) {
    return res.redirect("http://localhost:3000/api/login");
  }

  // user exists

  if (!title || !companyName || !location || !description || !postedBy) {
    return res.status(400).json({ message: "Fill all the fields" });
  }

  const newJob = {
    id: job_Posts.length + 1,
    title,
    companyName,
    location,
    description,
    postedBy,
  };

  job_Posts.push(newJob);

  res.status(200).json({ message: "Job posted successfully" });

});

app.listen(3000, () => {
  console.log("App is running on http://localhost:3000");
});
