<pre><code>
# Remote Patient Monitoring System 🩺

![Project Banner](https://via.placeholder.com/1200x300.png?text=Remote+Patient+Monitoring+System)  
*A modern solution for remote patient monitoring*

---

## 📖 Overview

The **Remote Patient Monitoring System** is a web application designed to monitor patients' health data (heart rate, blood sugar, blood pressure) remotely and in real-time. This system enables doctors to track their patients' health metrics, integrates with Fitbit devices to provide comprehensive health analysis, and generates automatic notifications for abnormal health data. The project offers a user-friendly interface for both patients and doctors, ensuring seamless interaction and data visualization.

This project is built using **Java Spring Boot** (backend), **JavaScript/HTML/CSS** (frontend), and **PostgreSQL** (database).

---

## ✨ Features

- **Real-Time Health Data Monitoring:** Visualize heart rate, blood sugar, and blood pressure data with interactive charts.
- **Fitbit Integration:** Retrieve and analyze heart rate data from Fitbit devices.
- **Abnormal Data Detection:** Automatically generate notifications when heart rate exceeds 100 bpm or blood sugar exceeds 120 mg/dL.
- **User-Friendly Interface:** Tabbed panels for patients and doctors.
- **Simulated Data Generation:** Generate random health data for testing purposes.
- **Theme Support:** Toggle between light and dark modes.
- **Animations:** Smooth scroll and transition animations for an enhanced user experience.

---

## 🛠️ Tech Stack

- **Backend:** Java, Spring Boot
- **Frontend:** HTML, CSS, JavaScript
- **Database:** PostgreSQL
- **Charting Library:** Chart.js
- **Integration:** Fitbit API
- **Other Libraries:** Bootstrap, FontAwesome, Animate.css

---

## 📦 Installation

Follow the steps below to set up and run the project on your local machine.

### Prerequisites
- **Java 17+** (required for Spring Boot)
- **Node.js** (optional, for running the frontend with Live Server)
- **PostgreSQL** (for the database)
- **Git** (to clone the repository)
- **Fitbit Developer Account** (for Fitbit API integration)

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/RemotePatientMonitoringSystem.git
   cd RemotePatientMonitoringSystem
   ```

2. **Set Up the Database:**
   Create a PostgreSQL database:
   ```sql
   CREATE DATABASE remote_patient_monitoring;
   ```
   Update the `application.properties` file with your database connection details:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/remote_patient_monitoring
   spring.datasource.username=your-username
   spring.datasource.password=your-password
   spring.jpa.hibernate.ddl-auto=update
   ```

3. **Run the Backend:**
   - Open the project in IntelliJ IDEA or your preferred IDE.
   - Run the `RemotePatientMonitoringApplication.java` file.
   - The backend will start on `http://localhost:8080` by default.

4. **Run the Frontend:**
   - Open the `index.html` file in VS Code.
   - Use the Live Server extension to run the file (`Go Live`).
   - The frontend will start on `http://127.0.0.1:5500` by default.

5. **Configure Fitbit API Integration:**
   - Create an application on the Fitbit Developer Portal and obtain your `client_id` and `client_secret`.
   - Add the Fitbit API credentials to the `application.properties` file:
   ```properties
   fitbit.client-id=your-client-id
   fitbit.client-secret=your-client-secret
   fitbit.redirect-uri=http://localhost:8080/api/fitbit/callback
   ```

---

## 🚀 Usage

### Log In:
- Open the application and log in using the default credentials:  
  **Username:** `user`  
  **Password:** `password123`

### Use the Patient Panel:
- Navigate to the **Patient** tab and select a patient.
- View health data (**heart rate, blood sugar, blood pressure**) in interactive charts.
- Click the **"Simulate"** button to generate test data.

### View Fitbit Data:
- Click the **"Connect with Fitbit"** button and log in with your Fitbit account.
- Heart rate data will be automatically retrieved and displayed in the charts.

### Use the Doctor Panel:
- Navigate to the **Doctor** tab to view the list of doctors and their associated patients.

---

## 📊 Screenshots

- **Patient Panel**
- **Fitbit Data**

(Note: Replace the placeholder images with actual screenshots of your project.)

---

## 🧪 Testing

- **Backend Testing:** Use tools like **Postman** to test the API endpoints (e.g., `GET /api/health-data/{patientId}`, `POST /api/health-data/simulate/{patientId}`).
- **Frontend Testing:** Open the browser's developer tools (**F12**) to check for console errors and verify that charts are rendering correctly.
- **Database Testing:** Use a **PostgreSQL client** (e.g., **pgAdmin**) to verify that health data is being stored correctly in the `health_data` table.

---

## 🤝 Contributing

Contributions are welcome! To contribute to this project, please follow these steps:

1. Fork this repository.
2. Create a new branch:  
   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes and commit them:  
   ```bash
   git commit -m "Added your feature"
   ```
4. Push your branch:  
   ```bash
   git push origin feature/your-feature
   ```
5. Open a Pull Request.

Please ensure your code follows the project's coding standards and includes appropriate documentation.

---

## 📜 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

---

## 📧 Contact

- **Email:** your-email@example.com  
- **GitHub:** [your-username](https://github.com/your-username)

---

## 🙏 Acknowledgments

- **Fitbit API** for providing health data integration.
- **Chart.js** for the interactive charting library.
- **Bootstrap** for the responsive UI framework.

---

⭐ If you like this project, please give it a star!
</code></pre>
