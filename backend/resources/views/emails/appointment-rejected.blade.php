<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Rejected</title>
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
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
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
            border-bottom: 2px solid #dc3545;
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
        .rejection-box {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #721c24;
        }
        .next-steps {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
        }
        .reason-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            font-style: italic;
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
            <h1>Appointment Request Rejected</h1>
        </div>

        <div class="content">
            <p>Hi {{ $patientName }},</p>

            <p>We regret to inform you that your appointment request has been <strong>rejected</strong>.</p>

            <div class="rejection-box">
                <strong>Status:</strong> Your appointment request could not be confirmed at this time.
            </div>

            <div class="section">
                <div class="section-title">Original Appointment Details</div>
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
            </div>

            <div class="section">
                <div class="section-title">Reason for Rejection</div>
                <div class="reason-box">
                    {{ $rejectionReason }}
                </div>
            </div>

            <div class="next-steps">
                <strong>What Can You Do?</strong>
                <p>You can request a new appointment at a different date and time. Please visit our clinic's booking portal or contact us directly to schedule a new appointment.</p>
            </div>

            <p>If you have any questions about this decision or would like to discuss other available times, please feel free to contact our clinic.</p>

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
