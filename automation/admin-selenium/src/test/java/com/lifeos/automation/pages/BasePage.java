package com.lifeos.automation.pages;

import com.lifeos.automation.core.Config;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

public class BasePage {
    protected final WebDriver driver;
    protected final WebDriverWait wait;
    public BasePage(WebDriver driver) { this.driver = driver; wait = new WebDriverWait(driver, Config.get().timeout()); wait.ignoring(StaleElementReferenceException.class); }
    public static String literal(String value) { if (!value.contains("'")) return "'" + value + "'"; return "concat('" + value.replace("'", "',\"'\",'") + "')"; }
    public static By text(String value) { return By.xpath("//*[normalize-space(.)=" + literal(value) + "]"); }
    public static By button(String value) { return By.xpath("//button[normalize-space(.)=" + literal(value) + " or @aria-label=" + literal(value) + "]"); }
    public static By label(String value) { return By.xpath("//*[@aria-label=" + literal(value) + "] | //label[span[normalize-space(.)=" + literal(value) + "]]/*[self::input or self::textarea or self::select] | //*[@id=//label[normalize-space(.)=" + literal(value) + "]/@for]"); }
    public WebElement visible(By locator) { return wait.until(ExpectedConditions.visibilityOfElementLocated(locator)); }
    public void click(By locator) { wait.until(ExpectedConditions.elementToBeClickable(locator)).click(); }
    public void fill(By locator, String value) { WebElement element = visible(locator); element.sendKeys(Keys.chord(Keys.CONTROL, "a"), value); }
    public void select(By locator, String value) {
        wait.until(d -> {
            var element = new Select(visible(locator));
            var option = element.getOptions().stream().filter(o -> value.equals(o.getDomProperty("value"))).findFirst();
            if (option.isEmpty()) return false;
            // HTML options without a value attribute use their text as the DOM value.
            if (option.get().getDomAttribute("value") == null) element.selectByVisibleText(option.get().getText());
            else element.selectByValue(value);
            return true;
        });
    }
    public void open(String path) { driver.get(Config.get().baseUrl() + path); }
    public void urlEnds(String path) { wait.until(d -> java.net.URI.create(d.getCurrentUrl()).getPath().equals(path)); }
    public void absent(By locator) { wait.until(ExpectedConditions.invisibilityOfElementLocated(locator)); }
    public void hasText(By locator, String value) { wait.until(ExpectedConditions.textToBePresentInElementLocated(locator, value)); }
    public boolean exists(By locator) { return driver.findElements(locator).stream().anyMatch(WebElement::isDisplayed); }
    public void until(java.util.function.Function<WebDriver, Boolean> condition) { wait.until(condition); }
    public Object script(String script, Object... arguments) { return ((JavascriptExecutor)driver).executeScript(script, arguments); }
}
