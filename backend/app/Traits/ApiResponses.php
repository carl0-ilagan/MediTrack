<?php

namespace App\Traits;

use Illuminate\Validation\ValidationException;

trait ApiResponses
{
    protected function ok($message, $data = []) 
    {
        return $this->success($message, $data, 200);
    } 

    protected function success($message, $data = [], $statusCode = 200) 
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'status' => $statusCode,
        ], $statusCode);
    }

    protected function error($message, $statusCode = 500) 
    {
        return response()->json([
            'success' => false,
            'error' => $message,
            'status' => $statusCode,
        ], $statusCode);
    }

    protected function validationError($errors, $message = 'Validation failed')
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'status' => 422,
        ], 422);
    }

    protected function notFound($message = 'Resource not found')
    {
        return $this->error($message, 404);
    }

    protected function unauthorized($message = 'Unauthorized access')
    {
        return $this->error($message, 401);
    }

    protected function forbidden($message = 'Forbidden access')
    {
        return $this->error($message, 403);
    }
}