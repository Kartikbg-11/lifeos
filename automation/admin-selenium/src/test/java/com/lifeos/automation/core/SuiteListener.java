package com.lifeos.automation.core;

import org.testng.*;
import org.testng.xml.XmlSuite;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/** Failures are reported honestly: no automatic retry converts a failed test into a pass. */
public final class SuiteListener implements ISuiteListener, ITestListener, IConfigurationListener, IReporter {
    @Override public void onStart(ISuite suite) {
        var config = Config.get(); var api = new ApiClient().login("super");
        Assert.assertEquals(api.get("/api/admin/settings").expect(200).data().path("appName").asText(), config.required("sandbox.name"), "Refusing to run against an unmarked database");
        Assert.assertEquals(api.get("/api/admin/me").expect(200).data().path("id").asText(), config.userId("super"), "Sandbox identity mismatch");
    }
    @Override public void onTestFailure(ITestResult result) { capture(result); }
    @Override public void onConfigurationFailure(ITestResult result) { capture(result); }
    private void capture(ITestResult result) {
        var driver = DriverManager.get(); if (driver == null) return;
        try {
            Path dir = Path.of("target", "reports", "artifacts"); Files.createDirectories(dir);
            String name = result.getMethod().getMethodName() + "-" + UUID.randomUUID();
            Files.write(dir.resolve(name + ".png"), ((TakesScreenshot)driver).getScreenshotAs(OutputType.BYTES));
            result.setAttribute("screenshot", "artifacts/" + name + ".png");
            try { Files.writeString(dir.resolve(name + "-browser.log"), driver.manage().logs().get("browser").getAll().toString()); }
            catch (Exception ignored) { /* Browser console retrieval is not supported by every Grid/browser. */ }
        } catch (Exception e) { result.setAttribute("artifactError", e.getClass().getSimpleName()); }
    }
    private String escape(Object text) { return String.valueOf(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }
    @Override public void generateReport(List<XmlSuite> xmlSuites, List<ISuite> suites, String outputDirectory) {
        try {
            List<ITestResult> results = new ArrayList<>(); int configurationFailures = 0;
            for (ISuite suite : suites) for (ISuiteResult suiteResult : suite.getResults().values()) {
                var context = suiteResult.getTestContext();
                results.addAll(context.getPassedTests().getAllResults()); results.addAll(context.getFailedTests().getAllResults()); results.addAll(context.getSkippedTests().getAllResults());
                configurationFailures += context.getFailedConfigurations().size();
            }
            results.sort(Comparator.comparingLong(ITestResult::getStartMillis));
            long passed = results.stream().filter(ITestResult::isSuccess).count();
            long skipped = results.stream().filter(r -> r.getStatus() == ITestResult.SKIP).count();
            long failed = results.size() - passed - skipped;
            Path report = Path.of("target", "reports"); Files.createDirectories(report);
            var summary = Map.of("total", results.size(), "passed", passed, "failed", failed, "skipped", skipped, "configurationFailures", configurationFailures, "browser", Config.get().browser(), "runId", Config.get().runId());
            Files.writeString(report.resolve("summary.json"), ApiClient.JSON.writerWithDefaultPrettyPrinter().writeValueAsString(summary));
            StringBuilder html = new StringBuilder("<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>LIFEOS Selenium results</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#17332b;background:#f1f6f3;margin:0;padding:32px}main{max-width:1200px;margin:auto}h1{font-size:32px}table{width:100%;border-collapse:collapse;background:white}th,td{text-align:left;padding:14px;border-bottom:1px solid #d4e0d9;vertical-align:top}th{background:#dcece2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.PASS{color:#126b38}.FAIL,.SKIP{color:#a82c32}a{color:#126449}code{overflow-wrap:anywhere}</style><main><h1>LIFEOS · Admin Selenium report</h1>");
            html.append("<p>").append(passed).append(" passed · ").append(failed).append(" failed · ").append(skipped).append(" skipped · ").append(configurationFailures).append(" configuration failures</p><p>Browser: ").append(escape(Config.get().browser())).append(" · Run: ").append(escape(Config.get().runId())).append("</p><table><thead><tr><th>Test</th><th>Result</th><th>Seconds</th><th>Evidence</th></tr></thead><tbody>");
            for (var result : results) {
                String state = result.isSuccess() ? "PASS" : result.getStatus() == ITestResult.SKIP ? "SKIP" : "FAIL";
                html.append("<tr><td>").append(escape(result.getTestClass().getRealClass().getSimpleName() + "." + result.getMethod().getMethodName())).append("<br><code>").append(escape(Arrays.toString(result.getParameters()))).append("</code></td><td class='").append(state).append("'>").append(state).append("</td><td>").append((result.getEndMillis()-result.getStartMillis())/1000.0).append("</td><td>");
                if (result.getAttribute("screenshot") != null) html.append("<a href='").append(escape(result.getAttribute("screenshot"))).append("'>Screenshot</a>");
                if (result.getThrowable() != null) {
                    var text = new java.io.StringWriter(); result.getThrowable().printStackTrace(new java.io.PrintWriter(text));
                    html.append("<details><summary>Failure details</summary><pre>").append(escape(text.toString().replace(Config.get().password(), "[redacted]"))).append("</pre></details>");
                }
                html.append("</td></tr>");
            }
            Files.writeString(report.resolve("index.html"), html.append("</tbody></table><p>UI: Selenium WebDriver. Backend verification: Java HTTP client. Payment processing and external email/push integrations are outside the application’s implemented scope.</p></main></html>").toString());
        } catch (Exception e) { throw new IllegalStateException("Unable to write test report", e); }
    }
}
