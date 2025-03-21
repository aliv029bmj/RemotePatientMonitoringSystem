package com.example.RemotePatientMonitoring.repository;

import com.example.RemotePatientMonitoring.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}