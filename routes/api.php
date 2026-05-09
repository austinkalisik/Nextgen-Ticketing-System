<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', DashboardController::class);
Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);
Route::apiResource('tickets', TicketController::class);
Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
