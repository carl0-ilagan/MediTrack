<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MedcertReason;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MedcertReasonController extends Controller
{
    use ApiResponses;

    public function index()
    {
        try {
            $list = MedcertReason::orderBy('id','desc')->get();
            // Return both 'types' and 'reasons' for backward compatibility
            return $this->ok('Types retrieved', ['types' => $list, 'reasons' => $list]);
        } catch (\Exception $e) {
            Log::error('Failed to list medcert types: ' . $e->getMessage());
            return $this->error('Failed to list types', 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->only(['reason', 'type']);
        $validator = Validator::make($data, [
            'reason' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
        ]);
        if ($validator->fails()) return $this->error('Invalid input', 422, $validator->errors()->toArray());

        try {
            // Accept either 'reason' or 'type' field name
            if (!isset($data['reason']) && isset($data['type'])) {
                $data['reason'] = $data['type'];
            } elseif (isset($data['reason']) && !isset($data['type'])) {
                $data['type'] = $data['reason'];
            }

            $r = MedcertReason::create($data);
            return $this->ok('Type created', ['type' => $r]);
        } catch (\Exception $e) {
            Log::error('Failed to create medcert type: ' . $e->getMessage());
            return $this->error('Failed to create type', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $r = MedcertReason::findOrFail($id);
            $r->delete();
            return $this->ok('Type removed');
        } catch (\Exception $e) {
            Log::error('Failed to remove type: ' . $e->getMessage());
            return $this->error('Failed to remove type', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $data = $request->only(['reason', 'type']);
        $validator = Validator::make($data, [
            'reason' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
        ]);
        if ($validator->fails()) return $this->error('Invalid input', 422, $validator->errors()->toArray());

        try {
            $r = MedcertReason::findOrFail($id);
            
            // Accept either 'reason' or 'type' field name
            if (isset($data['reason'])) {
                $r->reason = $data['reason'];
                $r->type = $data['reason'];
            }
            if (isset($data['type'])) {
                $r->type = $data['type'];
                $r->reason = $data['type'];
            }
            
            $r->save();
            return $this->ok('Type updated', ['type' => $r]);
        } catch (\Exception $e) {
            Log::error('Failed to update medcert type: ' . $e->getMessage());
            return $this->error('Failed to update type', 500);
        }
    }
}
