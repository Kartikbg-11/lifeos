package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.Test;

public final class AuthenticationTest extends BaseUiTest {
    @Test(groups = {"smoke", "regression"}) public void superAdminCanSignInAndSignOut() {
        var login = new LoginPage(driver()).visit(); login.submit(config.email("super"), config.password()); login.urlEnds("/admin");
        var admin = new AdminPage(driver()); admin.ready(); admin.heading("Welcome back");
        var cookie = driver().manage().getCookieNamed("lifeos-session"); Assert.assertNotNull(cookie); Assert.assertTrue(cookie.isHttpOnly());
        admin.signOut(); driver().get(config.baseUrl() + "/admin"); login.urlEnds("/login");
    }
    @Test(groups = {"regression", "security"}) public void wrongPasswordIsRejected() {
        var login = new LoginPage(driver()).visit(); login.submit(config.email("super"), "Incorrect-password-for-QA-only");
        login.error("Invalid email or password"); login.urlEnds("/login"); Assert.assertNull(driver().manage().getCookieNamed("lifeos-session"));
    }
    @Test(groups = {"smoke", "security"}) public void memberCannotOpenAdminWorkspace() {
        var login = new LoginPage(driver()).visit(); login.submit(config.email("member"), config.password()); login.urlEnds("/");
        login.open("/admin"); login.hasText(By.cssSelector("h1"), "This workspace is for administrators.");
        Assert.assertFalse(login.exists(By.cssSelector(".admin-root")));
    }
    @Test(groups = "security") public void anonymousAdminNavigationRedirectsToLogin() {
        var page = new BasePage(driver()); page.open("/admin/users"); page.urlEnds("/login"); page.visible(By.id("email"));
    }
    @Test(groups = "regression") public void passwordChangeRevokesExistingSessions() {
        var oldSession = new ApiClient().login("rotation");
        var login = new LoginPage(driver()).visit(); login.submit(config.email("rotation"), config.password()); login.urlEnds("/admin");
        var page = new AdminPage(driver()).visit("account"); page.click(BasePage.button("Change password"));
        String newPassword = "QA!Rotated9-" + config.unique("password");
        page.field("Current password", config.password()); page.field("New password", newPassword); page.save(); page.urlEnds("/login");
        oldSession.get("/api/auth/me").expect(401);
        new ApiClient().login(config.email("rotation"), config.password()).expect(401);
        login.submit(config.email("rotation"), newPassword); login.urlEnds("/admin");
        new AdminPage(driver()).ready();
    }
}
