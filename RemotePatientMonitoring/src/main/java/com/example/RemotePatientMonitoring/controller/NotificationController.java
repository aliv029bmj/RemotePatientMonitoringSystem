package com.example.RemotePatientMonitoring.controller;

import com.example.RemotePatientMonitoring.model.Notification;
import com.example.RemotePatientMonitoring.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class NotificationController {
    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{patientId}")
    public List<Notification> getNotificationsByPatient(@PathVariable Long patientId) {
        return notificationRepository.findByPatientId(patientId);
    }
}