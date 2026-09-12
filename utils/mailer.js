const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOTP(email, otp) {
    const mailOptions = {
        from: `"ICMR-NAMS National Biostatistics Helpline" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "ICMR-NAMS Email Verification OTP",
        text: `Your ICMR-NAMS email verification OTP is ${otp}. This OTP is valid for 10 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px;">

                <h2 style="color: #315b9b;">
                    ICMR-NAMS National Biostatistics Helpline
                </h2>

                <p>
                    Dear User,
                </p>

                <p>
                    Your email verification OTP is:
                </p>

                <div style="
                    font-size: 30px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #315b9b;
                    margin: 20px 0;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP is valid for <strong>10 minutes</strong>.
                </p>

                <p>
                    Please do not share this OTP with anyone.
                </p>

                <br>

                <p>
                    Regards,<br>
                    <strong>ICMR-NAMS National Biostatistics Helpline</strong>
                </p>

            </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

module.exports = {
    transporter,
    sendOTP
};