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
            background-color: #dc2626;
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
        .reason-box {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 3px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medical Certificate Request Rejected</h1>
        </div>
        <div class="content">
            <p>Dear {{ $patientName }},</p>

            <p>Unfortunately, your medical certificate request has been <strong>rejected</strong>.</p>

            <div class="details">
                <h3>Request Details</h3>
                <p><strong>Type:</strong> {{ $medCert->type ?? 'N/A' }}</p>
                <p><strong>Purpose:</strong> {{ $medCert->purpose ?? 'N/A' }}</p>
                <p><strong>Requested Period:</strong> {{ \Carbon\Carbon::parse($medCert->start_date)->format('F j, Y') }} - {{ \Carbon\Carbon::parse($medCert->end_date)->format('F j, Y') }}</p>
            </div>

            <div class="reason-box">
                <h3 style="margin-top: 0;">Reason for Rejection</h3>
                <p>{{ $reason }}</p>
            </div>

            <p>If you believe this decision was made in error or if you have any questions, please contact our clinic staff directly.</p>

            <p>Best regards,<br/>
            <strong>Clinic and Laboratory</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email from Clinic and Laboratory. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
