package com.example.RemotePatientMonitoring.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // CSRF korumasını devre dışı bırak
                .authorizeHttpRequests(auth -> auth
                        // OPTIONS isteklerini kimlik doğrulama olmadan serbest bırak
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Fitbit yetkilendirme uç noktalarını kimlik doğrulama dışı bırak
                        .requestMatchers("/api/fitbit/authorize", "/api/fitbit/callback").permitAll()
                        // /api/ ile başlayan diğer tüm uç noktalar kimlik doğrulama gerektirir
                        .requestMatchers("/api/**").authenticated()
                        // Diğer tüm istekler serbest
                        .anyRequest().permitAll()
                )
                .httpBasic(httpBasic -> {}); // Basit HTTP Basic Authentication kullan

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user = User.builder()
                .username("user")
                .password("password123") // Şifreyi düz metin olarak tanımlıyoruz
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance(); // Şifreyi düz metin olarak karşılaştırmak için (TEST AMAÇLI)
    }
}