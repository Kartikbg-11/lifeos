package com.lifeos.automation.core;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.support.ThreadGuard;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

public final class DriverManager {
    private static final ThreadLocal<WebDriver> CURRENT = new ThreadLocal<>();
    private static final ThreadLocal<Path> DOWNLOADS = new ThreadLocal<>();
    private DriverManager() { }
    public static WebDriver get() { return CURRENT.get(); }
    public static Path downloads() { return DOWNLOADS.get(); }
    public static WebDriver create() throws Exception {
        var config = Config.get();
        Path download = Path.of("target", "downloads", config.unique("test")).toAbsolutePath();
        Files.createDirectories(download); DOWNLOADS.set(download);
        org.openqa.selenium.MutableCapabilities options;
        switch (config.browser()) {
            case "chrome" -> {
                var chrome = new ChromeOptions();
                chrome.addArguments("--window-size=1440,1000", "--disable-dev-shm-usage");
                if (config.headless()) chrome.addArguments("--headless=new");
                if (System.getenv("CI") != null && System.getProperty("os.name").toLowerCase().contains("linux")) chrome.addArguments("--no-sandbox");
                chrome.setExperimentalOption("prefs", Map.of("download.default_directory", download.toString(), "download.prompt_for_download", false, "profile.password_manager_enabled", false, "credentials_enable_service", false));
                options = chrome;
            }
            case "edge" -> {
                var edge = new EdgeOptions(); edge.addArguments("--window-size=1440,1000");
                if (config.headless()) edge.addArguments("--headless=new");
                edge.setExperimentalOption("prefs", Map.of("download.default_directory", download.toString(), "download.prompt_for_download", false)); options = edge;
            }
            case "firefox" -> {
                var firefox = new FirefoxOptions(); if (config.headless()) firefox.addArguments("-headless");
                firefox.addPreference("browser.download.folderList", 2); firefox.addPreference("browser.download.dir", download.toString());
                firefox.addPreference("browser.helperApps.neverAsk.saveToDisk", "text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                firefox.addPreference("pdfjs.disabled", true); options = firefox;
            }
            default -> throw new IllegalArgumentException("Supported browsers: chrome, edge, firefox");
        }
        WebDriver raw;
        if (!config.gridUrl().isBlank()) {
            options.setCapability("se:downloadsEnabled", true);
            raw = new RemoteWebDriver(java.net.URI.create(config.gridUrl()).toURL(), options);
        } else raw = switch (config.browser()) {
            case "chrome" -> new ChromeDriver((ChromeOptions)options);
            case "edge" -> new EdgeDriver((EdgeOptions)options);
            default -> new FirefoxDriver((FirefoxOptions)options);
        };
        var driver = ThreadGuard.protect(raw); CURRENT.set(driver);
        driver.manage().timeouts().implicitlyWait(java.time.Duration.ZERO);
        driver.manage().timeouts().pageLoadTimeout(java.time.Duration.ofSeconds(60));
        driver.manage().window().setSize(new org.openqa.selenium.Dimension(1440, 1000));
        return driver;
    }
    public static void close() { try { if (get() != null) get().quit(); } finally { CURRENT.remove(); DOWNLOADS.remove(); } }
}
