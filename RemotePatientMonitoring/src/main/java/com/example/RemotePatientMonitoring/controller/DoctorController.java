package com.example.RemotePatientMonitoring.controller;

import com.example.RemotePatientMonitoring.model.Doctor;
import com.example.RemotePatientMonitoring.model.Patient;
import com.example.RemotePatientMonitoring.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class DoctorController {
    @Autowired
    private DoctorRepository doctorRepository;

    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    @GetMapping("/{id}/patients")
    public List<Patient> getPatientsByDoctor(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doktor bulunamadı: " + id));
        return doctor.getPatients();
    }
}