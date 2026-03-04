<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    use ApiResponses;

    public function index()
    {
        try {
            $list = Service::orderBy('name')->get();
            return $this->ok('Services retrieved', ['services' => $list]);
        } catch (\Exception $e) {
            Log::error('Failed to list services: ' . $e->getMessage());
            return $this->error('Failed to list services', 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->only(['name', 'estimated_minutes']);
        $validator = Validator::make($data, [
            'name' => 'required|string|max:191',
            'estimated_minutes' => 'required|integer|min:1',
        ]);
        if ($validator->fails()) return $this->error('Invalid input', 422, $validator->errors()->toArray());

        try {
            $s = Service::create($data);
            return $this->ok('Service created', ['service' => $s]);
        } catch (\Exception $e) {
            Log::error('Failed to create service: ' . $e->getMessage());
            return $this->error('Failed to create service', 500);
        }
    }

    public function destroy($id)
    {
        try {
            $s = Service::findOrFail($id);
            $s->delete();
            return $this->ok('Service removed');
        } catch (\Exception $e) {
            Log::error('Failed to remove service: ' . $e->getMessage());
            return $this->error('Failed to remove service', 500);
        }
    }

    public function update(Request $request, $id)
    {
        $data = $request->only(['name', 'estimated_minutes']);
        $validator = Validator::make($data, [
            'name' => 'sometimes|required|string|max:191',
            'estimated_minutes' => 'sometimes|required|integer|min:1',
        ]);
        if ($validator->fails()) return $this->error('Invalid input', 422, $validator->errors()->toArray());

        try {
            $s = Service::findOrFail($id);
            if (isset($data['name'])) $s->name = $data['name'];
            if (isset($data['estimated_minutes'])) $s->estimated_minutes = $data['estimated_minutes'];
            $s->save();
            return $this->ok('Service updated', ['service' => $s]);
        } catch (\Exception $e) {
            Log::error('Failed to update service: ' . $e->getMessage());
            return $this->error('Failed to update service', 500);
        }
    }
}
