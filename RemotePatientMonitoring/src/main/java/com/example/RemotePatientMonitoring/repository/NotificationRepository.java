package com.example.RemotePatientMonitoring.repository;

import com.example.RemotePatientMonitoring.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByPatientId(Long patientId);
}