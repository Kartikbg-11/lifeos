package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.*;
import org.testng.Assert;
import org.testng.annotations.Test;
import java.nio.file.Files;
import java.util.zip.ZipFile;

public final class ReportsAndSettingsTest extends BaseUiTest {
    @Test(groups = {"smoke", "regression"}) public void generatedReportCanBePreviewedAndDownloaded() throws Exception {
        signIn(); var page = new ReportsPage(driver()).visit(); String name = config.unique("report"); page.generate(name, "users");
        page.preview(name); page.visible(By.cssSelector(".ad-report-preview tbody tr")); driver().findElement(By.cssSelector("[role='dialog']")).sendKeys(Keys.ESCAPE); page.absent(By.cssSelector("[role='dialog']"));
        String csv = Files.readString(page.download(name, "csv")); Assert.assertTrue(csv.contains(config.email("member"))); Assert.assertFalse(csv.contains("passwordHash"));
        try (var zip = new ZipFile(page.download(name, "xlsx").toFile())) { Assert.assertNotNull(zip.getEntry("xl/workbook.xml")); Assert.assertNotNull(zip.getEntry("xl/worksheets/sheet1.xml")); }
        byte[] pdf = Files.readAllBytes(page.download(name, "pdf")); Assert.assertEquals(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII), "%PDF");
    }
    @Test(groups = {"regression", "security"}) public void rolePermissionsTakeEffectOnAnExistingSession() {
        var page = signIn(); page.visit("settings"); String roleName = config.unique("role"); page.click(BasePage.button("Create role")); page.field("Role name", roleName);
        page.click(By.xpath("//label[normalize-space(.)='dashboard · read']/input")); page.click(BasePage.button("Save role")); page.absent(By.cssSelector(".ad-editor"));
        var roles = admin().get("/api/admin/roles").expect(200).data();
        String roleId = java.util.stream.StreamSupport.stream(roles.spliterator(), false).filter(role -> role.path("name").asText().equals(roleName)).findFirst().orElseThrow().path("id").asText();
        String email = config.unique("permission-user") + "@" + config.runId() + ".test.invalid";
        admin().post("/api/admin/users", ApiClient.body("name", "Permission user", "email", email, "password", config.password(), "roleId", roleId, "status", "active")).expect(200);
        var staff = new ApiClient(); staff.login(email, config.password()).expect(200); staff.get("/api/admin/users").expect(403);
        page.click(By.xpath("//div[contains(@class,'ad-role-card')][h3[normalize-space(.)=" + BasePage.literal(roleName) + "]]//button[normalize-space(.)='Configure']"));
        page.click(By.xpath("//label[normalize-space(.)='users · read']/input")); page.click(BasePage.button("Save role")); page.absent(By.cssSelector(".ad-editor")); staff.get("/api/admin/users").expect(200);
    }
}
