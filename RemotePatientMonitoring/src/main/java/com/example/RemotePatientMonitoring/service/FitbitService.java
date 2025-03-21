package com.example.RemotePatientMonitoring.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FitbitService {

    @Value("${fitbit.client.id}")
    private String clientId;

    @Value("${fitbit.client.secret}")
    private String clientSecret;

    @Value("${fitbit.redirect.uri}")
    private String redirectUri;

    private String accessToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getAuthorizationUrl() {
        if (clientId == null || redirectUri == null) {
            throw new IllegalStateException("Fitbit yapılandırma bilgileri eksik: clientId veya redirectUri bulunamadı.");
        }
        String encodedRedirectUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        return "https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=" + clientId +
                "&redirect_uri=" + encodedRedirectUri + "&scope=activity%20heartrate%20sleep";
    }

    public void exchangeCodeForToken(String code) {
        String tokenUrl = "https://api.fitbit.com/oauth2/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId, clientSecret);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("grant_type", "authorization_code");
        body.add("redirect_uri", redirectUri);
        body.add("code", code);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);
        this.accessToken = response.getBody().split("\"access_token\":\"")[1].split("\"")[0];
    }

    public Map<String, Object> getHeartRateData() {
        if (accessToken == null) {
            throw new IllegalStateException("Access token bulunamadı. Lütfen önce yetkilendirme yapın.");
        }

        String heartRateUrl = "https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(heartRateUrl, HttpMethod.GET, entity, Map.class);
        Map<String, Object> heartRateData = response.getBody();

        // Veriyi analiz et ve sonuçları ekle
        Map<String, Object> analysisResult = analyzeHeartRateData(heartRateData);
        heartRateData.put("analysis", analysisResult);

        return heartRateData;
    }

    private Map<String, Object> analyzeHeartRateData(Map<String, Object> heartRateData) {
        Map<String, Object> analysis = new HashMap<>();

        // Verileri al
        Map<String, Object> intradayData = (Map<String, Object>) heartRateData.get("activities-heart-intraday");
        List<Map<String, Object>> dataset = (List<Map<String, Object>>) intradayData.get("dataset");

        if (dataset == null || dataset.isEmpty()) {
            analysis.put("error", "Nabız verisi bulunamadı.");
            return analysis;
        }

        // Nabız değerlerini ve zaman damgalarını çıkar
        List<Double> heartRates = new ArrayList<>();
        List<String> timestamps = new ArrayList<>();
        for (Map<String, Object> entry : dataset) {
            heartRates.add(((Number) entry.get("value")).doubleValue());
            timestamps.add((String) entry.get("time"));
        }

        // 1. Hareketli Ortalama (Moving Average) Hesaplama (5 dakikalık pencere)
        List<Double> movingAverages = calculateMovingAverage(heartRates, 5);
        analysis.put("movingAverages", movingAverages);

        // 2. Trend Analizi: Nabız artıyor mu, azalıyor mu, yoksa sabit mi?
        String trend = determineTrend(movingAverages);
        analysis.put("trend", trend);

        // 3. Ani Değişim Tespiti: Bir dakikadan diğerine 20 bpm'den fazla değişim
        List<Map<String, Object>> suddenChanges = detectSuddenChanges(heartRates, timestamps);
        analysis.put("suddenChanges", suddenChanges);

        // 4. Uyarılar: Nabız 100 bpm'den yüksek mi veya ani değişim var mı?
        List<String> alerts = generateAlerts(heartRates, suddenChanges);
        analysis.put("alerts", alerts);

        return analysis;
    }

    private List<Double> calculateMovingAverage(List<Double> values, int windowSize) {
        List<Double> movingAverages = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) {
            if (i < windowSize - 1) {
                movingAverages.add(null); // İlk birkaç veri için hareketli ortalama hesaplanamaz
            } else {
                double sum = 0;
                for (int j = i - windowSize + 1; j <= i; j++) {
                    sum += values.get(j);
                }
                movingAverages.add(sum / windowSize);
            }
        }
        return movingAverages;
    }

    private String determineTrend(List<Double> movingAverages) {
        // Son 5 hareketli ortalamayı kontrol et
        int trendWindow = Math.min(5, movingAverages.size());
        if (trendWindow < 2) {
            return "Yetersiz veri";
        }

        Double firstValue = movingAverages.get(movingAverages.size() - trendWindow);
        Double lastValue = movingAverages.get(movingAverages.size() - 1);

        if (firstValue == null || lastValue == null) {
            return "Yetersiz veri";
        }

        double difference = lastValue - firstValue;
        if (difference > 5) {
            return "Artan";
        } else if (difference < -5) {
            return "Azalan";
        } else {
            return "Sabit";
        }
    }

    private List<Map<String, Object>> detectSuddenChanges(List<Double> heartRates, List<String> timestamps) {
        List<Map<String, Object>> suddenChanges = new ArrayList<>();
        for (int i = 1; i < heartRates.size(); i++) {
            double difference = Math.abs(heartRates.get(i) - heartRates.get(i - 1));
            if (difference > 20) { // 20 bpm'den fazla değişim
                Map<String, Object> change = new HashMap<>();
                change.put("timestamp", timestamps.get(i));
                change.put("previousValue", heartRates.get(i - 1));
                change.put("currentValue", heartRates.get(i));
                change.put("difference", difference);
                suddenChanges.add(change);
            }
        }
        return suddenChanges;
    }

    private List<String> generateAlerts(List<Double> heartRates, List<Map<String, Object>> suddenChanges) {
        List<String> alerts = new ArrayList<>();

        // Nabız 100 bpm'den yüksek mi?
        for (int i = 0; i < heartRates.size(); i++) {
            if (heartRates.get(i) > 100) {
                alerts.add("Yüksek nabız tespit edildi: " + heartRates.get(i) + " bpm");
            }
        }

        // Ani değişim var mı?
        for (Map<String, Object> change : suddenChanges) {
            alerts.add("Ani nabız değişimi tespit edildi: " + change.get("previousValue") + " bpm'den " +
                    change.get("currentValue") + " bpm'e (" + change.get("timestamp") + ")");
        }

        return alerts;
    }
}