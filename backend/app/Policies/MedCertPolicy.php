<?php

namespace App\Policies;

use App\Models\MedCert;
use App\Models\User;

class MedCertPolicy
{
    /**
     * Determine if the user can view the medcert.
     */
    public function view(User $user, MedCert $medCert)
    {
        // Admins can view any medcert
        if ($user->isAdmin()) {
            return true;
        }

        // Patients can view their own medcerts
        if ($user->isPatient() && $medCert->patient?->user_id === $user->id) {
            return true;
        }

        // Clinicians can view medcerts they requested or need to approve
        if ($user->isClinician()) {
            return $medCert->requested_by === $user->id || $medCert->status === 'pending';
        }

        return false;
    }

    /**
     * Determine if the user can approve a medcert.
     */
    public function approve(User $user, MedCert $medCert)
    {
        // Only clinicians and admins can approve
        if (!($user->isClinician() || $user->isAdmin())) {
            return false;
        }

        // Only pending medcerts can be approved
        if ($medCert->status !== 'pending') {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can reject a medcert.
     */
    public function reject(User $user, MedCert $medCert)
    {
        // Only clinicians and admins can reject
        if (!($user->isClinician() || $user->isAdmin())) {
            return false;
        }

        // Only pending medcerts can be rejected
        if ($medCert->status !== 'pending') {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can update a medcert.
     */
    public function update(User $user, MedCert $medCert)
    {
        // Admins can update any medcert
        if ($user->isAdmin()) {
            return true;
        }

        // Patients can update their own pending medcerts
        if ($user->isPatient() && $medCert->patient?->user_id === $user->id && $medCert->status === 'pending') {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete a medcert.
     */
    public function delete(User $user, MedCert $medCert)
    {
        // Admins can delete any medcert
        if ($user->isAdmin()) {
            return true;
        }

        // Patients can delete their own pending medcerts
        if ($user->isPatient() && $medCert->patient?->user_id === $user->id && $medCert->status === 'pending') {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can mark a medcert as no-show.
     */
    public function markNoShow(User $user, MedCert $medCert)
    {
        // Only clinicians and admins can mark as no-show
        if (!($user->isClinician() || $user->isAdmin())) {
            return false;
        }

        // Only approved medcerts can be marked as no-show
        if ($medCert->status !== 'approved') {
            return false;
        }

        return true;
    }

    /**
     * Determine if the user can mark a medcert as completed.
     */
    public function markCompleted(User $user, MedCert $medCert)
    {
        // Only clinicians and admins can mark as completed
        if (!($user->isClinician() || $user->isAdmin())) {
            return false;
        }

        // Only approved medcerts can be marked as completed
        if ($medCert->status !== 'approved') {
            return false;
        }

        return true;
    }
}
