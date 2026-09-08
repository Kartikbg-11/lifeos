package com.lifeos.automation.core;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.URI;
import java.time.Duration;
import java.util.Properties;

/** Immutable run configuration. Credentials are supplied by the sandbox runner, never by source code. */
public final class Config {
    private static final Config INSTANCE = new Config();
    private final Properties values = new Properties();
    private Config() {
        String file = System.getenv("E2E_CONFIG");
        if (file == null || file.isBlank()) throw new IllegalStateException("Run npm run test:admin:selenium, or supply E2E_CONFIG for an explicitly provisioned sandbox.");
        try (var input = Files.newInputStream(Path.of(file))) { values.load(input); }
        catch (IOException e) { throw new IllegalStateException("Cannot read E2E_CONFIG", e); }
        if (!required("sandbox.name").equals("LIFEOS QA")) throw new IllegalStateException("This suite requires a LIFEOS QA sandbox.");
        URI origin = URI.create(baseUrl());
        if (!java.util.Set.of("http", "https").contains(origin.getScheme()) || origin.getHost() == null || origin.getUserInfo() != null || origin.getQuery() != null || origin.getFragment() != null)
            throw new IllegalStateException("base.url must be an HTTP(S) origin without credentials, query or fragment.");
    }
    public static Config get() { return INSTANCE; }
    public String required(String key) { String value = values.getProperty(key); if (value == null || value.isBlank()) throw new IllegalStateException("Missing configuration: " + key); return value; }
    public String baseUrl() { return required("base.url"); }
    public String runId() { return required("run.id"); }
    public String email(String role) { return required("account." + role + ".email"); }
    public String userId(String role) { return required("account." + role + ".id"); }
    public String password() { return required("account.password"); }
    public String jobSecret() { return required("jobs.secret"); }
    public Duration timeout() { return Duration.ofSeconds(Long.parseLong(System.getProperty("wait.seconds", "30"))); }
    public String browser() { return System.getProperty("browser", "chrome").toLowerCase(); }
    public boolean headless() { return Boolean.parseBoolean(System.getProperty("headless", "true")); }
    public String gridUrl() { String value = System.getProperty("grid.url", ""); return value.isBlank() ? System.getenv().getOrDefault("SELENIUM_GRID_URL", "") : value; }
    public String unique(String prefix) { return prefix.toLowerCase().replaceAll("[^a-z0-9-]", "-") + "-" + java.util.UUID.randomUUID().toString().substring(0, 12); }
}
