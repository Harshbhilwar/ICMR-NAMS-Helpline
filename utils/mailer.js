async function sendOTP(email, otp) {
    const htmlContent = `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 30px auto;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 8px;
            background-color: #ffffff;
        ">

            <h2 style="color: #315b9b; margin-bottom: 25px;">
                ICMR-NAMS National Biostatistics Helpline
            </h2>

            <p>
                Dear User,
            </p>

            <p>
                Your email verification OTP is:
            </p>

            <div style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #315b9b;
                margin: 25px 0;
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
    `;

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",

            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },

            body: JSON.stringify({
                sender: {
                    name: "ICMR-NAMS National Biostatistics Helpline",
                    email: process.env.BREVO_SENDER_EMAIL
                },

                to: [
                    {
                        email: email
                    }
                ],

                subject: "ICMR-NAMS Email Verification OTP",

                htmlContent: htmlContent,

                textContent:
                    `Your ICMR-NAMS email verification OTP is ${otp}. ` +
                    `This OTP is valid for 10 minutes.`
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("Brevo API Error:", data);

        throw new Error(
            data.message || "Failed to send OTP email."
        );
    }

    console.log("OTP email sent successfully:", data);

    return data;
}

module.exports = {
    sendOTP
};