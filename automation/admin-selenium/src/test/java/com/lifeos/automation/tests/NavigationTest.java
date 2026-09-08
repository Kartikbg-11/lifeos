package com.lifeos.automation.tests;

import com.lifeos.automation.core.*;
import com.lifeos.automation.pages.*;
import org.openqa.selenium.*;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public final class NavigationTest extends BaseUiTest {
    @DataProvider public Object[][] routes() { return new Object[][] {
        {"", "Welcome back"}, {"users", "Your community"}, {"activity", "User activity"}, {"analytics", "Application analytics"},
        {"productivity", "Tasks, goals & improvement"}, {"learning", "Learning & progress"}, {"reports", "Reports"}, {"plans", "Plans"},
        {"subscriptions", "Subscriptions"}, {"payments", "Payments"}, {"content", "Content library"}, {"feedback", "Community feedback"},
        {"support", "Support desk"}, {"notifications", "Notification center"}, {"audit", "Audit logs"}, {"settings", "Workspace settings"},
        {"account", "Profile & security"}, {"schedules", "Report schedules"}
    }; }
    @Test(dataProvider = "routes", groups = "regression") public void adminRouteLoads(String route, String heading) {
        var page = signIn(); page.visit(route); page.heading(heading); page.noHorizontalOverflow();
    }
    @Test(groups = "smoke") public void dashboardHasRealMetricsAndAccessibleChartData() {
        var page = signIn(); page.ready();
        page.visible(By.cssSelector(".ad-stat strong")); Assert.assertEquals(driver().findElements(By.cssSelector(".ad-stat")).size(), 4);
        page.click(By.cssSelector(".ad-chart-data summary")); page.visible(By.cssSelector(".ad-chart-data tbody tr"));
        Assert.assertTrue(admin().get("/api/admin/users?limit=1").expect(200).data().path("total").asInt() >= 32);
        page.option("Reporting period", "7"); page.ready(); page.visible(By.cssSelector(".ad-chart svg"));
    }
    @Test(groups = "regression") public void themeAndCollapsedSidebarPersistAcrossReload() {
        var page = signIn(); page.ready(); page.theme("Dark");
        page.click(BasePage.button("Collapse sidebar")); driver().navigate().refresh(); page.ready();
        Assert.assertEquals(page.visible(By.cssSelector(".admin-root")).getAttribute("data-theme"), "dark");
        page.visible(BasePage.button("Expand sidebar")); page.click(BasePage.button("Expand sidebar")); page.theme("Light");
    }
    @Test(groups = {"smoke", "regression"}) public void keyboardSearchOpensMatchingUser() {
        var page = signIn(); page.ready(); driver().findElement(By.tagName("body")).sendKeys(Keys.chord(Keys.CONTROL, "k"));
        page.field("Global admin search", config.email("member"));
        page.click(By.xpath("//*[@role='dialog']//a[contains(@href," + BasePage.literal(config.userId("member")) + ")]"));
        page.urlEnds("/admin/users/" + config.userId("member")); page.heading("Selenium Member");
    }
    @DataProvider public Object[][] widths() { return new Object[][] {{768}, {390}, {320}}; }
    @Test(dataProvider = "widths", groups = "regression") public void mobileMenuAndReadableText(int width) {
        var page = signIn();
        if (driver() instanceof org.openqa.selenium.chromium.HasCdp cdp) {
            // Chromium clamps desktop windows to 500px; emulate the actual CSS viewport.
            cdp.executeCdpCommand("Emulation.setDeviceMetricsOverride", java.util.Map.of("width", width, "height", 1000, "deviceScaleFactor", 1, "mobile", false));
        } else if (config.browser().equals("firefox")) {
            // Firefox also clamps outer windows; BiDi sizes the real content viewport.
            new org.openqa.selenium.bidi.browsingcontext.BrowsingContext(driver(), driver().getWindowHandle()).setViewport(width, 1000);
        } else {
            var outer = driver().manage().window().getSize();
            int inner = ((Number)page.script("return window.innerWidth")).intValue();
            driver().manage().window().setSize(new Dimension(width + outer.width - inner, 1000));
        }
        page.visit("");
        Assert.assertEquals(((Number)page.script("return window.innerWidth")).intValue(), width, "Browser must exercise the requested CSS viewport");
        page.noHorizontalOverflow();
        page.click(BasePage.button("Open admin menu")); page.visible(By.cssSelector("[role='dialog'] nav"));
        double font = ((Number)page.script("return parseFloat(getComputedStyle(document.querySelector('[role=dialog] .ad-nav-link')).fontSize)")).doubleValue();
        Assert.assertTrue(font >= 16, "Navigation labels should remain readable on phones");
        driver().findElement(By.cssSelector("[role='dialog']")).sendKeys(Keys.ESCAPE); page.absent(By.cssSelector("[role='dialog']"));
        page.until(d -> "Open admin menu".equals(d.switchTo().activeElement().getAttribute("aria-label")));
        Assert.assertEquals(driver().switchTo().activeElement().getAttribute("aria-label"), "Open admin menu", "Drawer must restore keyboard focus");
    }
}
