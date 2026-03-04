{{-- resources/views/med-certs/pdf.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <title>Medical Certificate - {{ $medCert->certificate_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .certificate { border: 2px solid #000; padding: 30px; }
        .patient-info { margin-bottom: 20px; }
        .dates { margin-bottom: 20px; }
        .signature { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <h1>MEDICAL CERTIFICATE</h1>
            <p>Certificate No: {{ $medCert->certificate_number }}</p>
        </div>
        
        <div class="patient-info">
            <p><strong>Patient:</strong> {{ $medCert->patient->user->name }}</p>
            <p><strong>Student Number:</strong> {{ $medCert->patient->student_number }}</p>
        </div>
        
        <div class="dates">
            <p><strong>Start Date:</strong> {{ $medCert->start_date->format('F j, Y') }}</p>
            <p><strong>End Date:</strong> {{ $medCert->end_date->format('F j, Y') }}</p>
            <p><strong>Duration:</strong> {{ $medCert->duration_days }} days</p>
        </div>
        
        <div class="medical-reason">
            <p><strong>Medical Reason:</strong></p>
            <p>{{ $medCert->medical_reason }}</p>
        </div>
        
        @if($medCert->recommendations)
        <div class="recommendations">
            <p><strong>Recommendations:</strong></p>
            <p>{{ $medCert->recommendations }}</p>
        </div>
        @endif
        
        <div class="signature">
            <p>Approved by: {{ $medCert->approver->name ?? 'System' }}</p>
            <p>Date: {{ $medCert->approved_at->format('F j, Y') }}</p>
        </div>
    </div>
</body>
</html>