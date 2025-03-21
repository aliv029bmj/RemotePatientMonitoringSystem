package com.example.RemotePatientMonitoring.controller;

import com.example.RemotePatientMonitoring.model.HealthData;
import com.example.RemotePatientMonitoring.model.Notification;
import com.example.RemotePatientMonitoring.repository.HealthDataRepository;
import com.example.RemotePatientMonitoring.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/health-data")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class HealthDataController {
    @Autowired
    private HealthDataRepository healthDataRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{patientId}")
    public List<HealthData> getHealthDataByPatient(@PathVariable Long patientId) {
        return healthDataRepository.findByPatientId(patientId);
    }

    @PostMapping
    public HealthData createHealthData(@RequestBody HealthData healthData) {
        // recordedAt alanını kontrol et ve eğer null ise şu anki zamanı ata
        if (healthData.getRecordedAt() == null) {
            healthData.setRecordedAt(LocalDateTime.now());
        }

        HealthData savedData = healthDataRepository.save(healthData);

        if (savedData.getHeartRate() != null && savedData.getHeartRate() > 100 ||
                savedData.getBloodSugar() != null && savedData.getBloodSugar() > 120) {
            Notification notification = new Notification();
            notification.setPatientId(savedData.getPatientId());
            notification.setDoctorId(1L); // Şimdilik sabit bir doktor
            notification.setMessage("Uyarı: Anormal sağlık verisi tespit edildi! Nabız: " +
                    savedData.getHeartRate() + ", Şeker: " + savedData.getBloodSugar());
            notificationRepository.save(notification);
        }

        return savedData;
    }

    @PostMapping("/simulate/{patientId}")
    public HealthData simulateHealthData(@PathVariable Long patientId) {
        HealthData healthData = new HealthData();
        healthData.setPatientId(patientId);
        healthData.setHeartRate(60 + (int)(Math.random() * 50)); // 60-110 bpm
        healthData.setBloodPressure("120/80");
        healthData.setBloodSugar(80 + (int)(Math.random() * 50)); // 80-130 mg/dL
        healthData.setRecordedAt(LocalDateTime.now()); // recordedAt alanını doldur

        return createHealthData(healthData);
    }
}