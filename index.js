const express = require("express");
const app = express();

let job_seekers_register = [];
let recruiter_register = [];

app.use(express.json());

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

app.listen(3000, () => {
  console.log("App is running on http://localhost:3000");
});
