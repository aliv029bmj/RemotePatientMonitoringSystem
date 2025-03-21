// script.js

let authCredentials = null;
let heartRateChart, bloodSugarChart;

// DOM yüklendiğinde çalışacak kodlar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginScreen').style.display = 'block';

    // Tema butonuna tıklama olayını ekle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Kullanıcının önceki tema tercihini yükle
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i> Açık Mod';
    }

    // Scroll animasyonlarını başlat
    initScrollAnimations();

    // URL'deki fitbitConnected parametresini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fitbitConnected') === 'true') {
        // Giriş yapılmışsa hasta paneline git ve Fitbit verilerini yükle
        if (authCredentials) {
            const loginScreen = document.getElementById('loginScreen');
            const mainContent = document.getElementById('mainContent');
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
            mainContent.classList.add('animate-fade-in');
            showTab('patientTab');
            loadFitbitData(); // Fitbit verilerini yükle
        }
    }
});

// Giriş fonksiyonu
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');

    console.log('Username:', username, 'Password:', password);

    const credentials = btoa(`${username}:${password}`);
    authCredentials = credentials;

    console.log('Credentials:', credentials);

    fetch('http://localhost:8080/api/doctors', {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
    })
    .then(response => {
        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);
        if (!response.ok) {
            throw new Error(`Giriş başarısız: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Login Successful:', data);
        // Giriş ekranını gizle ve ana içeriği göster (animasyonlu geçiş)
        const loginScreen = document.getElementById('loginScreen');
        const mainContent = document.getElementById('mainContent');
        loginScreen.classList.add('animate-fade-out');
        setTimeout(() => {
            loginScreen.style.display = 'none';
            mainContent.style.display = 'block';
            mainContent.classList.add('animate-fade-in');
            showTab('patientTab');
        }, 300);
    })
    .catch(error => {
        console.error('Giriş hatası:', error);
        loginError.style.display = 'block';
    });
}

// Kimlik doğrulama ile fetch isteği yapan yardımcı fonksiyon
async function fetchWithAuth(url, options = {}) {
    if (!authCredentials) {
        throw new Error('Kimlik doğrulama bilgileri bulunamadı. Lütfen giriş yapın.');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Basic ${authCredentials}`,
        'X-Requested-With': 'XMLHttpRequest'
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`İstek başarısız: ${response.status}`);
    }

    return response;
}

// Fitbit ile bağlantı kurma
function connectToFitbit() {
    fetch('http://localhost:8080/api/fitbit/authorize')
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(`Fitbit yetkilendirme hatası: ${errorData.error} (${errorData.status})`);
                });
            }
            return response.text();
        })
        .then(url => {
            window.location.href = url; // Kullanıcıyı Fitbit yetkilendirme sayfasına yönlendir
        })
        .catch(error => {
            console.error('Fitbit yetkilendirme hatası:', error);
            showNotification('Fitbit ile bağlantı kurulurken bir hata oluştu: ' + error.message);
        });
}

// Fitbit'ten nabız verisini çekme ve grafiği güncelleme
async function loadFitbitData() {
    try {
        const response = await fetch('http://localhost:8080/api/fitbit/heart-rate');
        if (!response.ok) {
            throw new Error(`Fitbit verileri alınamadı: ${response.status}`);
        }
        const fitbitData = await response.json();

        // Fitbit verisini konsola yazdır
        console.log('Fitbit Data:', fitbitData);

        // Veri setini kontrol et
        if (!fitbitData['activities-heart-intraday'] || !fitbitData['activities-heart-intraday'].dataset) {
            throw new Error('Fitbit verisi eksik veya geçersiz.');
        }

        // Fitbit verisini işleme (örnek: son 10 dakikalık nabız verileri)
        const heartRateData = fitbitData['activities-heart-intraday'].dataset.map(entry => entry.value);

        // Zaman damgalarını doğrudan string olarak kullan (kategori ekseni için)
        const labels = fitbitData['activities-heart-intraday'].dataset.map((entry, index) => {
            if (!entry.time || typeof entry.time !== 'string') {
                console.warn(`Geçersiz zaman damgası (index ${index}):`, entry.time);
                return `Zaman ${index}`; // Geçersiz zaman damgası için varsayılan bir string
            }
            return entry.time; // Doğrudan HH:mm:ss formatında string kullan
        });

        // Oluşturulan labels dizisini konsola yazdır
        console.log('Labels:', labels);

        // Kan şekeri verisi Fitbit'ten doğrudan alınamıyor, simüle edilmiş veri kullanıyoruz
        const bloodSugarData = heartRateData.map(value => Math.round(value * 1.5)); // Örnek simülasyon

        // Analiz sonuçlarını al
        const analysis = fitbitData.analysis || {};
        const movingAverages = analysis.movingAverages || [];
        const trend = analysis.trend || 'Bilinmiyor';
        const suddenChanges = analysis.suddenChanges || [];
        const alerts = analysis.alerts || [];

        // Grafikleri güncelle
        updateChartsFromFitbit(heartRateData, bloodSugarData, labels, movingAverages, suddenChanges);

        // Trend bilgisini göster
        showNotification(`Nabız Trend Analizi: ${trend}`);

        // Uyarıları göster
        alerts.forEach(alert => showNotification(alert));
    } catch (error) {
        console.error('Fitbit verileri yüklenirken bir hata oluştu:', error);
        showNotification('Fitbit verileri yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Sekme değiştirme fonksiyonu
function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('show', 'active');
    });

    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('show', 'active');
    selectedTab.classList.add('animate-fade-in');

    if (tabId === 'patientTab') {
        loadPatients();
    } else if (tabId === 'doctorTab') {
        loadDoctors();
    }
}

// Hastaları yükleme fonksiyonu
async function loadPatients() {
    try {
        const response = await fetchWithAuth('http://localhost:8080/api/patients');
        const patients = await response.json();
        const patientSelect = document.getElementById('patientSelect');
        patientSelect.innerHTML = '';

        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.id;
            option.textContent = `${patient.firstName} ${patient.lastName}`;
            patientSelect.appendChild(option);
        });

        if (patients.length > 0) {
            patientSelect.value = patients[0].id;
            loadHealthData();
        }
    } catch (error) {
        console.error('Hastalar yüklenirken bir hata oluştu:', error);
        showNotification('Hastalar yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Doktorları yükleme fonksiyonu
async function loadDoctors() {
    try {
        const table = document.getElementById('doctorTable');
        if (!table) {
            throw new Error('Doktor tablosu bulunamadı (ID: doctorTable)');
        }

        const tbody = table.getElementsByTagName('tbody')[0];
        if (!tbody) {
            throw new Error('Doktor tablosunda tbody elementi bulunamadı');
        }

        const response = await fetchWithAuth('http://localhost:8080/api/doctors');
        const doctors = await response.json();
        tbody.innerHTML = '';

        doctors.forEach(doctor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doctor.firstName} ${doctor.lastName}</td>
                <td>${doctor.email}</td>
                <td>${doctor.patients.map(patient => `${patient.firstName} ${patient.lastName}`).join(', ')}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Doktorlar yüklenirken bir hata oluştu:', error);
        showNotification('Doktorlar yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Sağlık verilerini yükleme fonksiyonu
async function loadHealthData() {
    try {
        const patientId = document.getElementById('patientSelect').value;
        const response = await fetchWithAuth(`http://localhost:8080/api/health-data/${patientId}`);
        const healthData = await response.json();

        updateCharts(healthData);
    } catch (error) {
        console.error('Sağlık verileri yüklenirken bir hata oluştu:', error);
        showNotification('Sağlık verileri yüklenirken bir hata oluştu: ' + error.message);
    }
}

// Grafikleri güncelleme fonksiyonu (Simüle edilmiş veriler için)
// Grafikleri güncelleme fonksiyonu (Simüle edilmiş veriler için)
function updateCharts(healthData) {
    const heartRateData = healthData.map(data => data.heartRate);
    const bloodSugarData = healthData.map(data => data.bloodSugar);
    const labels = healthData.map(data => {
        if (!data.recordedAt) {
            console.warn('Geçersiz recordedAt:', data);
            return 'Bilinmeyen Zaman';
        }
        return new Date(data.recordedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    });

    console.log('Labels (updateCharts):', labels);

    if (heartRateChart) {
        heartRateChart.destroy();
    }
    heartRateChart = new Chart(document.getElementById('heartRateChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nabız (bpm)',
                data: heartRateData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    padding: 10
                }
            },
            scales: {
                x: {
                    type: 'category', // Kategori ekseni kullan
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });

    if (bloodSugarChart) {
        bloodSugarChart.destroy();
    }
    bloodSugarChart = new Chart(document.getElementById('bloodSugarChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kan Şekeri (mg/dL)',
                data: bloodSugarData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    padding: 10
                }
            },
            scales: {
                x: {
                    type: 'category', // Kategori ekseni kullan
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Fitbit verileriyle grafikleri güncelleme
function updateChartsFromFitbit(heartRateData, bloodSugarData, labels, movingAverages, suddenChanges) {
    if (heartRateChart) {
        heartRateChart.destroy();
    }

    // Ani değişim noktalarını işaretlemek için özel bir veri seti oluştur
    const suddenChangePoints = new Array(heartRateData.length).fill(null);
    suddenChanges.forEach(change => {
        const index = labels.indexOf(change.timestamp);
        if (index !== -1) {
            suddenChangePoints[index] = heartRateData[index];
        }
    });

    heartRateChart = new Chart(document.getElementById('heartRateChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Nabız (bpm) - Fitbit',
                    data: heartRateData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Hareketli Ortalama (5 dk)',
                    data: movingAverages,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Ani Değişim Noktaları',
                    data: suddenChangePoints,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: false // Sadece noktaları göster
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category', // Kategori ekseni kullan
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });

    if (bloodSugarChart) {
        bloodSugarChart.destroy();
    }
    bloodSugarChart = new Chart(document.getElementById('bloodSugarChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kan Şekeri (mg/dL) - Simüle',
                data: bloodSugarData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category', // Kategori ekseni kullan
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Yeni sağlık verisi simüle etme fonksiyonu
async function simulateHealthData() {
    try {
        const patientId = document.getElementById('patientSelect').value;
        const response = await fetchWithAuth(`http://localhost:8080/api/health-data/simulate/${patientId}`, {
            method: 'POST'
        });
        const newData = await response.json();

        loadHealthData();

        if (newData.heartRate > 100) {
            showNotification(`Uyarı: ${newData.heartRate} bpm nabız değeri normalin üzerinde!`);
        }
        if (newData.bloodSugar > 120) {
            showNotification(`Uyarı: ${newData.bloodSugar} mg/dL kan şekeri değeri normalin üzerinde!`);
        }
    } catch (error) {
        console.error('Yeni veri simüle edilirken bir hata oluştu:', error);
        showNotification('Yeni veri simüle edilirken bir hata oluştu: ' + error.message);
    }
}

// Bildirim gösterme fonksiyonu
function showNotification(message) {
    const notificationArea = document.getElementById('notificationArea');
    const notificationId = 'notification-' + new Date().getTime();
    const notificationHtml = `
        <div id="${notificationId}" class="alert alert-warning alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    notificationArea.innerHTML += notificationHtml;

    setTimeout(() => {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 150);
        }
    }, 5000);
}

// Tema değiştirme fonksiyonu
function toggleTheme() {
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggle');
    const isDarkMode = body.classList.toggle('dark-mode');

    if (isDarkMode) {
        themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i> Açık Mod';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i> Koyu Mod';
        localStorage.setItem('theme', 'light');
    }
}

// Scroll animasyonlarını başlatma
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}