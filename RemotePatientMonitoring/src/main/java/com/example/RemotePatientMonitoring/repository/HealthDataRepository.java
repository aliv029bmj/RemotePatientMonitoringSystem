package com.example.RemotePatientMonitoring.repository;

import com.example.RemotePatientMonitoring.model.HealthData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthDataRepository extends JpaRepository<HealthData, Long> {
    List<HealthData> findByPatientId(Long patientId);
}