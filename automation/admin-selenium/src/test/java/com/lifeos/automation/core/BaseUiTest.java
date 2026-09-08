package com.lifeos.automation.core;

import com.lifeos.automation.pages.AdminPage;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

public abstract class BaseUiTest {
    protected final Config config = Config.get();
    @BeforeMethod(alwaysRun = true) public void createBrowser() throws Exception { DriverManager.create(); }
    @AfterMethod(alwaysRun = true) public void closeBrowser() { DriverManager.close(); }
    protected WebDriver driver() { return DriverManager.get(); }
    protected AdminPage signIn() { return signIn("super"); }
    protected AdminPage signIn(String role) {
        var api = new ApiClient().login(role);
        driver().get(config.baseUrl() + "/login");
        driver().manage().addCookie(new Cookie.Builder("lifeos-session", api.token()).path("/").isHttpOnly(true).build());
        var page = new AdminPage(driver()); page.open("/admin"); return page;
    }
    protected ApiClient admin() { return new ApiClient().login("super"); }
    protected String createMember(String prefix) {
        String email = config.unique(prefix) + "@" + config.runId() + ".test.invalid";
        admin().post("/api/admin/users", ApiClient.body("name", prefix, "email", email, "password", config.password(), "status", "active", "roleId", null)).expect(200);
        return email;
    }
}
