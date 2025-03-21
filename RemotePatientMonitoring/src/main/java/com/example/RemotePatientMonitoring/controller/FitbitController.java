package com.example.RemotePatientMonitoring.controller;

import com.example.RemotePatientMonitoring.service.FitbitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
@RequestMapping("/api/fitbit")
public class FitbitController {

    @Autowired
    private FitbitService fitbitService;

    @GetMapping("/authorize")
    public String getAuthorizationUrl() {
        return fitbitService.getAuthorizationUrl();
    }

    @GetMapping("/callback")
    public RedirectView handleCallback(@RequestParam("code") String code) {
        fitbitService.exchangeCodeForToken(code);
        return new RedirectView("http://localhost:5500/index.html?fitbitConnected=true");
    }

    @GetMapping("/heart-rate")
    public Map<String, Object> getHeartRateData() {
        return fitbitService.getHeartRateData();
    }
}