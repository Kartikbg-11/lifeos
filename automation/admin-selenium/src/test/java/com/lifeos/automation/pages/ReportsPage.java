package com.lifeos.automation.pages;

import com.lifeos.automation.core.*;
import org.openqa.selenium.*;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ReportsPage extends AdminPage {
    public ReportsPage(WebDriver driver) { super(driver); }
    public ReportsPage visit() { visit("reports"); return this; }
    public void generate(String name, String type) { click(button("Generate report")); field("Report name", name); option("Report type", type); save(); visible(text("Your report is ready to preview and download.")); }
    private By action(String name, String action) { return By.xpath("//article[h3[normalize-space(.)=" + literal(name) + "]]//*[self::button or self::a][normalize-space(.)=" + literal(action) + "]"); }
    public void preview(String name) { click(action(name, "Preview")); visible(By.cssSelector(".ad-report-preview table")); }
    public Path download(String name, String format) throws Exception {
        click(action(name, format.toUpperCase())); Path directory = DriverManager.downloads();
        if (!Config.get().gridUrl().isBlank()) {
            var remote = (org.openqa.selenium.HasDownloads)driver;
            String file = wait.until(d -> remote.getDownloadedFiles().stream().map(HasDownloads.DownloadedFile::getName).filter(value -> value.endsWith("." + format)).findFirst().orElse(null));
            remote.downloadFile(file, directory); return directory.resolve(file);
        }
        return wait.until(d -> { try (var files = Files.list(directory)) { return files.filter(path -> path.getFileName().toString().endsWith("." + format)).filter(path -> { try { return Files.size(path) > 0; } catch (Exception ignored) { return false; } }).findFirst().orElse(null); } catch (Exception e) { return null; } });
    }
}
