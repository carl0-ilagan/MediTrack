<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #009DD1 0%, #01377D 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #01377D;
            margin-bottom: 10px;
            border-bottom: 2px solid #009DD1;
            padding-bottom: 8px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 15px;
        }
        .detail-label {
            font-weight: 600;
            color: #01377D;
            width: 120px;
            flex-shrink: 0;
        }
        .detail-value {
            color: #555;
        }
        .status-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #155724;
        }
        .next-steps {
            background-color: #e7f3ff;
            border-left: 4px solid #009DD1;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #01377D;
        }
        .next-steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin-bottom: 8px;
        }
        .footer {
            background-color: #f0f0f0;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 8px 8px;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #009DD1;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
        }
        .button:hover {
            background-color: #01377D;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Appointment Confirmed</h1>
        </div>

        <div class="content">
            <p>Hi {{ $patientName }},</p>

            <p>Great news! Your appointment request has been <strong>confirmed</strong> by our clinic staff.</p>

            <div class="status-box">
                <strong>Status:</strong> Your appointment is confirmed and ready to go!
            </div>

            <div class="section">
                <div class="section-title">Appointment Details</div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">{{ $appointmentType }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">{{ $appointmentDate }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">{{ $appointmentTime }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">{{ $appointmentLocation }}</span>
                </div>
            </div>

            <div class="next-steps">
                <strong>What's Next?</strong>
                <ol>
                    <li>Mark your calendar for {{ $appointmentDate }} at {{ $appointmentTime }}</li>
                    <li>Arrive 5-10 minutes early if possible</li>
                    <li>Bring any necessary documents or insurance cards</li>
                    <li>If you need to reschedule, please contact us as soon as possible</li>
                </ol>
            </div>

            <p>If you have any questions or need to make changes to your appointment, please reply to this email or contact our clinic directly.</p>

            <p>We look forward to seeing you!</p>

            <p>
                Best regards,<br>
                <strong>Clinic and Laboratory</strong>
            </p>
        </div>

        <div class="footer">
            <p>This is an automated message from Clinic and Laboratory. Please do not reply directly to this email if you're using an email system that doesn't support replies.</p>
            <p>&copy; {{ date('Y') }} Clinic and Laboratory. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
