package com.lifeos.automation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public final class LoginPage extends BasePage {
    public LoginPage(WebDriver driver) { super(driver); }
    public LoginPage visit() { open("/login"); visible(By.id("email")); return this; }
    public void submit(String email, String password) { fill(By.id("email"), email); fill(By.id("password"), password); click(button("Sign In")); }
    public void error(String message) { hasText(By.cssSelector("[data-sonner-toast]"), message); }
}
