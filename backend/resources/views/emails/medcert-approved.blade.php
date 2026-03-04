<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .header {
            background-color: #009DD1;
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .details {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .details p {
            margin: 10px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #009DD1;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medical Certificate Approved</h1>
        </div>
        <div class="content">
            <p>Dear {{ $patientName }},</p>

            <p>We are pleased to inform you that your medical certificate request has been <strong>approved</strong>.</p>

            <div class="details">
                <h3>Certificate Details</h3>
                <p><strong>Type:</strong> {{ $medCert->type ?? 'N/A' }}</p>
                <p><strong>Purpose:</strong> {{ $medCert->purpose ?? 'N/A' }}</p>
                <p><strong>Valid From:</strong> {{ \Carbon\Carbon::parse($medCert->start_date)->format('F j, Y') }}</p>
                <p><strong>Valid Until:</strong> {{ \Carbon\Carbon::parse($medCert->end_date)->format('F j, Y') }}</p>
                <p><strong>Duration:</strong> {{ $medCert->duration_days ?? 'N/A' }} days</p>
                @if($pickupDate !== 'TBD')
                    <p><strong>Pickup Date:</strong> {{ $pickupDate }}</p>
                @endif
            </div>

            <p>Please visit our clinic during business hours to pick up your certificate. If you have any questions or need to reschedule, please don't hesitate to contact us.</p>

            <p>Best regards,<br/>
            <strong>Clinic and Laboratory</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email from Clinic and Laboratory. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
