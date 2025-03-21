package com.example.RemotePatientMonitoring.repository;

import com.example.RemotePatientMonitoring.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
}