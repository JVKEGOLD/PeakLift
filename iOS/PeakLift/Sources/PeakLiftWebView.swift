import SwiftUI
import UIKit
import UniformTypeIdentifiers
import WebKit

struct PeakLiftWebView: UIViewRepresentable {
    let state: WebViewState

    private let allowedHosts: Set<String> = ["qwqwctttggwesgqspgrp.supabase.co"]

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        configuration.setURLSchemeHandler(LocalSchemeHandler(), forURLScheme: "app")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.scrollView.backgroundColor = .black
        webView.backgroundColor = .black
        let openedPendingAuthCallback = state.attach(webView)
        if !openedPendingAuthCallback {
            webView.load(URLRequest(url: WebViewState.homeURL))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(state: state, allowedHosts: allowedHosts)
    }
}

final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
    private let state: WebViewState
    private let allowedHosts: Set<String>

    init(state: WebViewState, allowedHosts: Set<String>) {
        self.state = state
        self.allowedHosts = allowedHosts
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        state.markLoadStarted()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        state.markLoadFinished()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        state.markLoadFailed(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        state.markLoadFailed(error)
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        if url.scheme == "app" {
            decisionHandler(.allow)
            return
        }

        if shouldKeepInApp(url) {
            decisionHandler(.allow)
            return
        }

        if UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            if let url = navigationAction.request.url, shouldKeepInApp(url) {
                webView.load(navigationAction.request)
            } else if let url = navigationAction.request.url, UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
        }
        return nil
    }

    private func shouldKeepInApp(_ url: URL) -> Bool {
        guard url.scheme == "http" || url.scheme == "https" else {
            return false
        }

        guard let host = url.host?.lowercased() else {
            return false
        }

        if allowedHosts.contains(host) || host.hasSuffix(".supabase.co") || host.hasSuffix(".googleapis.com") {
            return true
        }

        return host.hasSuffix(".google.com") || host.hasSuffix(".gstatic.com") || host == "appleid.apple.com"
    }
}

class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url,
              url.host == "localhost",
              let webAppRoot = Bundle.main.url(forResource: "WebApp", withExtension: nil) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }

        let requestedPath = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let relativePath = requestedPath.isEmpty ? "index.html" : requestedPath
        let rootURL = webAppRoot.standardizedFileURL
        let fileURL = rootURL.appendingPathComponent(relativePath).standardizedFileURL
        let rootPath = rootURL.path.hasSuffix("/") ? rootURL.path : "\(rootURL.path)/"

        guard fileURL.path.hasPrefix(rootPath) else {
            urlSchemeTask.didFailWithError(URLError(.noPermissionsToReadFile))
            return
        }

        if FileManager.default.fileExists(atPath: fileURL.path) {
            serve(fileURL, for: url, task: urlSchemeTask)
            return
        }

        let acceptsHTML = urlSchemeTask.request.value(forHTTPHeaderField: "Accept")?.contains("text/html") == true
        if acceptsHTML, let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp") {
            serve(indexURL, for: url, task: urlSchemeTask)
            return
        }

        let response = HTTPURLResponse(url: url, statusCode: 404, httpVersion: nil, headerFields: nil)!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didFinish()
    }
    
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    }
    
    private func serve(_ fileURL: URL, for url: URL, task: WKURLSchemeTask) {
        do {
            let data = try Data(contentsOf: fileURL)
            let mimeType = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            let response = URLResponse(url: url, mimeType: mimeType, expectedContentLength: data.count, textEncodingName: nil)
            task.didReceive(response)
            task.didReceive(data)
            task.didFinish()
        } catch {
            task.didFailWithError(error)
        }
    }
}
