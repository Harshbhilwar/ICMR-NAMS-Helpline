require("dotenv").config();

const dns = require("dns");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const expressLayouts = require("express-ejs-layouts");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo").default || require("connect-mongo");

const { sendOTP } = require("./utils/mailer");

const OTP = require("./models/OTP");
const User = require("./models/User");
const ResearchQuery = require("./models/ResearchQuery");


/* =====================================================
   EJS CONFIGURATION
===================================================== */

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);


/* =====================================================
   EJS LAYOUT
===================================================== */

app.use(expressLayouts);

app.set(
    "layout",
    "layouts/boilerplate"
);


/* =====================================================
   STATIC FILES
===================================================== */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =====================================================
   BODY PARSERS
===================================================== */

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.json()
);


/* =====================================================
   MONGODB CONNECTION
===================================================== */

mongoose.connect(
    process.env.MONGO_URI
)
.then(() => {

    console.log(
        "MongoDB connected successfully"
    );

})
.catch((err) => {

    console.error(
        "MongoDB connection error:",
        err
    );

});


/* =====================================================
   SESSION
===================================================== */

app.use(
    session({

        secret:
            process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        store:
            MongoStore.create({

                mongoUrl:
                    process.env.MONGO_URI

            }),

        cookie: {

            httpOnly: true,

            secure: false,

            sameSite: "lax",

            maxAge:
                1000 * 60 * 60 * 24

        }

    })
);


/* =====================================================
   HELPER:
   GENERATE LOGIN CAPTCHA
===================================================== */

function generateLoginCaptcha() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";


    let captcha = "";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        captcha +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

    }


    return captcha;
}


/* =====================================================
   HOME ROUTE
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.render(
            "home",
            {
                title:
                    "ICMR-NAMS National Biostatistics Helpline"
            }
        );

    }
);

/* =====================================================
   ABOUT US PAGE
===================================================== */

app.get("/about-us", (req, res) => {
    res.render("about-us", {
        title: "About Us - ICMR-NAMS",
        layout: "layouts/boilerplate"
    });
});

/* =====================================================
   COORDINATING TEAM PAGE
===================================================== */

app.get("/coordinating-team", (req, res) => {
    res.render("coordinating-team", {
        title: "Coordinating Team - ICMR-NAMS",
        layout: "layouts/boilerplate"
    });
});


/* =====================================================
   COORDINATING TEAM PAGE
===================================================== */

app.get("/contact-us", (req, res) => {
    res.render("contact-us", {
        title: "Contact Us - ICMR-NAMS",
        layout: "layouts/boilerplate"
    });
});


/* =====================================================
   LOGIN PAGE
===================================================== */

app.get(
    "/login",
    (req, res) => {


        /*
         * Generate a new CAPTCHA
         */

        const captcha =
            generateLoginCaptcha();


        /*
         * Save CAPTCHA inside session
         */

        req.session.loginCaptcha =
            captcha;


        /*
         * Show login page
         */

        res.render(
            "login",
            {

                layout: false,

                title:
                    "Login | ICMR-NAMS National Biostatistics Helpline",

                captcha:
                    captcha,

                error:
                    ""

            }
        );

    }
);


/* =====================================================
   REFRESH LOGIN CAPTCHA
===================================================== */

app.post(
    "/login-captcha",
    (req, res) => {


        const captcha =
            generateLoginCaptcha();


        req.session.loginCaptcha =
            captcha;


        res.json({

            success: true,

            captcha:
                captcha

        });

    }
);


/* =====================================================
   LOGIN POST
===================================================== */

app.post(
    "/login",
    async (req, res) => {

        try {


            const {
                email,
                password,
                captcha
            } = req.body;


            /* ==========================================
               CHECK FIELDS
            ========================================== */

            if (
                !email ||
                !password ||
                !captcha
            ) {

                const newCaptcha =
                    generateLoginCaptcha();


                req.session.loginCaptcha =
                    newCaptcha;


                return res.status(400).render(
                    "login",
                    {

                        layout: false,

                        title:
                            "Login | ICMR-NAMS National Biostatistics Helpline",

                        captcha:
                            newCaptcha,

                        error:
                            "Please enter email, password and captcha."

                    }
                );

            }


            /* ==========================================
               NORMALIZE EMAIL
            ========================================== */

            const normalizedEmail =
                email
                    .toLowerCase()
                    .trim();


            /* ==========================================
               CHECK CAPTCHA
            ========================================== */

            const savedCaptcha =
                req.session.loginCaptcha;


            if (
                !savedCaptcha ||
                captcha.trim().toLowerCase() !==
                savedCaptcha.trim().toLowerCase()
            ) {


                const newCaptcha =
                    generateLoginCaptcha();


                req.session.loginCaptcha =
                    newCaptcha;


                return res.status(400).render(
                    "login",
                    {

                        layout: false,

                        title:
                            "Login | ICMR-NAMS National Biostatistics Helpline",

                        captcha:
                            newCaptcha,

                        error:
                            "Invalid captcha. Please try again."

                    }
                );

            }


            /*
             * Remove CAPTCHA after checking
             */

            delete req.session.loginCaptcha;


            /* ==========================================
               FIND USER
            ========================================== */

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });


            if (!user) {

                const newCaptcha =
                    generateLoginCaptcha();


                req.session.loginCaptcha =
                    newCaptcha;


                return res.status(401).render(
                    "login",
                    {

                        layout: false,

                        title:
                            "Login | ICMR-NAMS National Biostatistics Helpline",

                        captcha:
                            newCaptcha,

                        error:
                            "Invalid email or password."

                    }
                );

            }


            /* ==========================================
               CHECK EMAIL VERIFICATION
            ========================================== */

            if (
                !user.isEmailVerified
            ) {

                const newCaptcha =
                    generateLoginCaptcha();


                req.session.loginCaptcha =
                    newCaptcha;


                return res.status(401).render(
                    "login",
                    {

                        layout: false,

                        title:
                            "Login | ICMR-NAMS National Biostatistics Helpline",

                        captcha:
                            newCaptcha,

                        error:
                            "Please verify your email before logging in."

                    }
                );

            }


            /* ==========================================
               CHECK PASSWORD
            ========================================== */

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!passwordMatch) {

                const newCaptcha =
                    generateLoginCaptcha();


                req.session.loginCaptcha =
                    newCaptcha;


                return res.status(401).render(
                    "login",
                    {

                        layout: false,

                        title:
                            "Login | ICMR-NAMS National Biostatistics Helpline",

                        captcha:
                            newCaptcha,

                        error:
                            "Invalid email or password."

                    }
                );

            }


            /* ==========================================
               LOGIN SUCCESS
            ========================================== */

            req.session.regenerate(
                (err) => {

                    if (err) {

                        console.error(
                            "Session regeneration error:",
                            err
                        );


                        return res.status(500).render(
                            "login",
                            {

                                layout: false,

                                title:
                                    "Login | ICMR-NAMS National Biostatistics Helpline",

                                captcha:
                                    generateLoginCaptcha(),

                                error:
                                    "Unable to login. Please try again."

                            }
                        );

                    }


                    /*
                     * Store user ID
                     */

                    req.session.userId =
                        user._id.toString();


                    /*
                     * Store role
                     */

                    req.session.userRole =
                        user.role;

                    // Show success message on dashboard after secure login
                    req.session.twoStepAuthSuccess = true;    


                    /*
                     * Redirect to dashboard
                     */

                    return res.redirect(
                        "/dashboard"
                    );

                }
            );


        } catch (error) {


            console.error(
                "Login Error:",
                error
            );


            const newCaptcha =
                generateLoginCaptcha();


            req.session.loginCaptcha =
                newCaptcha;


            return res.status(500).render(
                "login",
                {

                    layout: false,

                    title:
                        "Login | ICMR-NAMS National Biostatistics Helpline",

                    captcha:
                        newCaptcha,

                    error:
                        "Unable to login. Please try again."

                }
            );

        }

    }
);


/* =====================================================
   DASHBOARD
===================================================== */

app.get(
    "/dashboard",
    async (req, res) => {

        try {


            /* ==========================================
               CHECK LOGIN SESSION
            ========================================== */

            if (
                !req.session.userId
            ) {

                return res.redirect(
                    "/login"
                );

            }


            /* ==========================================
               FIND LOGGED-IN USER
            ========================================== */

            const user =
                await User.findById(
                    req.session.userId
                );


            if (!user) {

                req.session.destroy(
                    () => {}
                );


                return res.redirect(
                    "/login"
                );

            }


            /* ==========================================
               SHOW DASHBOARD
            ========================================== */

            const twoStepAuthSuccess =
            req.session.twoStepAuthSuccess || false;

           // Clear it so the message appears only after login
            req.session.twoStepAuthSuccess = false;

            return res.render(
                "dashboard",
                {
                   title: "Dashboard - ICMR-NAMS",

                    user: user,

                    hideSiteChrome: true,

                    twoStepAuthSuccess: twoStepAuthSuccess
                }
            );


        } catch (error) {


            console.error(
                "Dashboard Error:",
                error
            );


            return res.status(500).send(
                "Unable to load dashboard."
            );

        }

    }
);

/* =====================================================
   PERSONAL DETAILS
===================================================== */

app.get("/personal-details", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const user =
            await User.findById(req.session.userId);

        if (!user) {

            req.session.destroy(() => {});

            return res.redirect("/login");

        }

        return res.render(
            "personal-details",
            {
                title: "Applicant Information - ICMR-NAMS",
                user: user,
                layout: false
            }
        );

    } catch (error) {

        console.error(
            "Personal Details Error:",
            error
        );

        return res.status(500).send(
            "Unable to load personal details."
        );

    }

});

/* =====================================================
   ADD PERSONAL DETAILS
===================================================== */

app.get(
    "/personal-details/add",
    async (req, res) => {

        try {

            /* ==========================================
               CHECK LOGIN SESSION
            ========================================== */

            if (!req.session.userId) {

                return res.redirect(
                    "/login"
                );

            }


            /* ==========================================
               FIND LOGGED-IN USER
            ========================================== */

            const user =
                await User.findById(
                    req.session.userId
                );


            if (!user) {

                req.session.destroy(
                    () => {}
                );

                return res.redirect(
                    "/login"
                );

            }


            /* ==========================================
               SHOW ADD PERSONAL DETAILS FORM
            ========================================== */

            return res.render(
                "add-personal-details",
                {

                    title:
                        "Add Personal Details - ICMR-NAMS",

                    user:
                        user,

                    hideSiteChrome:
                        true

                }
            );


        } catch (error) {

            console.error(
                "Add Personal Details Error:",
                error
            );

            return res.status(500).send(
                "Unable to load personal details form."
            );

        }

    }
);

// ======================================================
// SAVE PERSONAL DETAILS
// ======================================================

app.post("/personal-details/save", async (req, res) => {
    try {

        // Check login
        if (!req.session.userId) {
            return res.redirect("/login");
        }


        // Find logged-in user
        const user = await User.findById(req.session.userId);

        if (!user) {

            req.session.destroy(() => {});

            return res.redirect("/login");

        }


        // Get submitted form data
        const {
            gender,
            category,
            state,
            district,
            institute,
            programme,
            department
        } = req.body;


        // Validate required personal details
        if (
            !gender ||
            !category ||
            !state ||
            !district ||
            !institute ||
            !programme ||
            !department
        ) {

            return res.status(400).send(
                "Please fill all required personal details."
            );

        }


        // =================================================
        // FIX OLD USERS WITHOUT USERNAME
        // =================================================

        if (!user.username || user.username.trim() === "") {

            if (user.email) {

                user.username =
                    user.email.split("@")[0];

            } else {

                user.username = "Applicant";

            }

        }


        // =================================================
        // SAVE PERSONAL DETAILS
        // =================================================

        user.gender = gender;
        user.category = category;
        user.state = state;
        user.district = district;
        user.institute = institute;
        user.programme = programme;
        user.department = department;


        // Save user
        await user.save();


        console.log(
            "Personal details saved successfully for:",
            user.email
        );


        // Go to Personal Details page
        return res.redirect("/personal-details");


    } catch (error) {

        console.error(
            "Save Personal Details Error:",
            error
        );

        return res.status(500).send(
            "Unable to save personal details."
        );

    }
});

/* =====================================================
   VIEW / APPLY SESSION
===================================================== */

app.get(
    "/view-apply-session",
    async (req, res) => {

        try {

            // Check login
            if (!req.session.userId) {
                return res.redirect("/login");
            }

            // Find logged-in user
            const user = await User.findById(
                req.session.userId
            );

            if (!user) {

                req.session.destroy(() => {});

                return res.redirect("/login");
            }

            // Show View / Apply Session page
            return res.render(
                "view-apply-session",
                {
                    title:
                        "View/Apply Session - ICMR-NAMS",

                    user: user,

                    layout: false
                }
            );

        } catch (error) {

            console.error(
                "View/Apply Session Error:",
                error
            );

            return res.status(500).send(
                "Unable to load session application."
            );
        }
    }
);


/* =====================================================
   SUBMIT RESEARCH QUERY
===================================================== */

app.post(
    "/view-apply-session",
    async (req, res) => {

        try {

            // Check login
            if (!req.session.userId) {
                return res.redirect("/login");
            }

            // Find logged-in user
            const user = await User.findById(
                req.session.userId
            );

            if (!user) {

                req.session.destroy(() => {});

                return res.redirect("/login");
            }


            // Get form data
            const {
                instituteName,
                specialityName,
                preferredLanguage,
                researchQuestion,
                primaryObjective,
                studyType,
                samplingQuestion
            } = req.body;


            // Validate all required fields
            if (
                !instituteName ||
                !specialityName ||
                !preferredLanguage ||
                !researchQuestion ||
                !primaryObjective ||
                !studyType ||
                !samplingQuestion
            ) {

                return res.status(400).send(
                    "Please fill all required session details."
                );
            }


            // Create research query
            const researchQuery =
                new ResearchQuery({

                    researcher:
                        user._id,

                    username:
                        user.username,

                    email:
                        user.email,

                    instituteName:
                        instituteName.trim(),

                    specialityName:
                        specialityName.trim(),

                    preferredLanguage:
                        preferredLanguage.trim(),

                    researchQuestion:
                        researchQuestion.trim(),

                    primaryObjective:
                        primaryObjective.trim(),

                    studyType:
                        studyType.trim(),

                    samplingQuestion:
                        samplingQuestion.trim(),

                    status:
                        "pending"
                });


            // Save to MongoDB
            await researchQuery.save();


            console.log(
                "Research query submitted successfully:",
                researchQuery._id
            );


            // For now return to dashboard
            // Next step will be Select Expert
            return res.redirect(
                "/dashboard"
            );


        } catch (error) {

            console.error(
                "Submit Research Query Error:",
                error
            );

            return res.status(500).send(
                "Unable to submit your research query."
            );
        }
    }
);

/* =====================================================
   LOGOUT
===================================================== */

app.get(
    "/logout",
    (req, res) => {


        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "Logout Error:",
                        error
                    );

                    return res.status(500).send(
                        "Unable to logout."
                    );

                }


                /*
                 * Clear session cookie
                 */

                res.clearCookie(
                    "connect.sid"
                );


                /*
                 * Go to Login
                 */

                return res.redirect(
                    "/"
                );

            }
        );

    }
);


/* =====================================================
   REGISTER PAGE
===================================================== */

app.get(
    "/register",
    (req, res) => {

        res.render(
            "register",
            {

                layout: false,

                title:
                    "Register | ICMR-NAMS National Biostatistics Helpline"

            }
        );

    }
);


/* =====================================================
   FORGOT PASSWORD PAGE
===================================================== */

app.get(
    "/forgot-password",
    (req, res) => {

        res.render(
            "forgot-password",
            {

                layout: false,

                title:
                    "Forgot Password | ICMR-NAMS National Biostatistics Helpline"

            }
        );

    }
);


/* =====================================================
   SEND OTP
===================================================== */

app.post(
    "/send-otp",
    async (req, res) => {

        try {


            const {
                email
            } = req.body;


            if (!email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email is required."

                });

            }


            const normalizedEmail =
                email
                    .toLowerCase()
                    .trim();


            /* ==========================================
               CHECK EXISTING USER
            ========================================== */

            const existingUser =
                await User.findOne({
                    email:
                        normalizedEmail
                });


            if (existingUser) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This email is already registered."

                });

            }


            /* ==========================================
               GENERATE OTP
            ========================================== */

            const otp =
                Math.floor(
                    100000 +
                    Math.random() * 900000
                ).toString();


            /* ==========================================
               EXPIRATION
               10 MINUTES
            ========================================== */

            const expiresAt =
                new Date(
                    Date.now() +
                    10 * 60 * 1000
                );


            /* ==========================================
               DELETE OLD OTP
            ========================================== */

            await OTP.deleteMany({

                email:
                    normalizedEmail

            });


            /* ==========================================
               SAVE OTP
            ========================================== */

            await OTP.create({

                email:
                    normalizedEmail,

                otp:
                    otp,

                expiresAt:
                    expiresAt

            });


            /* ==========================================
               SEND EMAIL
            ========================================== */

            await sendOTP(
                normalizedEmail,
                otp
            );


            return res.json({

                success: true,

                message:
                    "OTP sent successfully to your email."

            });


        } catch (error) {


            console.error(
                "Send OTP Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to send OTP. Please try again."

            });

        }

    }
);


/* =====================================================
   VERIFY OTP
===================================================== */

app.post(
    "/verify-otp",
    async (req, res) => {

        try {


            const {
                email,
                otp
            } = req.body;


            if (
                !email ||
                !otp
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and OTP are required."

                });

            }


            const normalizedEmail =
                email
                    .toLowerCase()
                    .trim();


            const otpRecord =
                await OTP.findOne({

                    email:
                        normalizedEmail,

                    otp:
                        otp.trim(),

                    verified:
                        false

                });


            if (!otpRecord) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid OTP."

                });

            }


            /* ==========================================
               CHECK EXPIRATION
            ========================================== */

            if (
                otpRecord.expiresAt <
                new Date()
            ) {


                await OTP.deleteOne({

                    _id:
                        otpRecord._id

                });


                return res.status(400).json({

                    success: false,

                    message:
                        "OTP has expired. Please request a new OTP."

                });

            }


            /* ==========================================
               MARK VERIFIED
            ========================================== */

            otpRecord.verified =
                true;


            await otpRecord.save();


            return res.json({

                success: true,

                message:
                    "Email verified successfully."

            });


        } catch (error) {


            console.error(
                "Verify OTP Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to verify OTP. Please try again."

            });

        }

    }
);


/* =====================================================
   REGISTER USER
===================================================== */

app.post(
    "/register",
    async (req, res) => {

        try {


            const {
                username,
                email,
                password,
                confirmPassword
            } = req.body;


            /* ==========================================
               REQUIRED FIELDS
            ========================================== */

            if (
                !username ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all registration fields."

                });

            }


            /* ==========================================
               NORMALIZE EMAIL
            ========================================== */

            const normalizedEmail =
                email
                    .toLowerCase()
                    .trim();


            /* ==========================================
               PASSWORD MATCH
            ========================================== */

            if (
                password !==
                confirmPassword
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Passwords do not match."

                });

            }


            /* ==========================================
               PASSWORD LENGTH
               8-12 CHARACTERS
            ========================================== */

            if (
                password.length < 8 ||
                password.length > 12
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must be 8–12 characters long."

                });

            }


            /* ==========================================
               UPPERCASE
            ========================================== */

            if (
                !/[A-Z]/.test(
                    password
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least one uppercase letter."

                });

            }


            /* ==========================================
               NUMBER
            ========================================== */

            if (
                !/[0-9]/.test(
                    password
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least one number."

                });

            }


            /* ==========================================
               SPECIAL CHARACTER
            ========================================== */

            if (
                !/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];']/
                    .test(password)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least one special character."

                });

            }


            /* ==========================================
               CHECK EXISTING USER
            ========================================== */

            const existingUser =
                await User.findOne({

                    email:
                        normalizedEmail

                });


            if (existingUser) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This email is already registered."

                });

            }


            /* ==========================================
               CHECK OTP VERIFICATION
            ========================================== */

            const verifiedOTP =
                await OTP.findOne({

                    email:
                        normalizedEmail,

                    verified:
                        true

                });


            if (!verifiedOTP) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please verify your email first."

                });

            }


            /* ==========================================
               HASH PASSWORD
            ========================================== */

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    12
                );


            /* ==========================================
               CREATE USER
            ========================================== */

            const newUser =
                new User({

                    username:
                        username.trim(),

                    email:
                        normalizedEmail,

                    password:
                        hashedPassword,

                    role:
                        "researcher",

                    isEmailVerified:
                        true

                });


            await newUser.save();


            /* ==========================================
               DELETE USED OTP
            ========================================== */

            await OTP.deleteMany({

                email:
                    normalizedEmail

            });


            /* ==========================================
               SUCCESS
            ========================================== */

            return res.json({

                success: true,

                message:
                    "Registration successful. You can now login."

            });


        } catch (error) {


            console.error(
                "Registration Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Registration failed. Please try again."

            });

        }

    }
);


/* =====================================================
   SERVER
===================================================== */

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});