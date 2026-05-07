import Observation
import WebKit

@Observable
final class WebViewState {
    var isLoading = false
    var isUsingFallback = false
    var lastErrorMessage: String?
    var hasLoadedInitialPage = false
    weak var webView: WKWebView?
    private var pendingAuthCallbackURL: URL?

    static let homeURL = URL(string: "app://localhost/")!

    func reload() {
        lastErrorMessage = nil

        guard let webView else {
            return
        }

        if webView.url == nil {
            loadHome()
        } else {
            webView.reload()
        }
    }

    func loadHome() {
        lastErrorMessage = nil
        webView?.load(URLRequest(url: Self.homeURL))
    }

    func markLoadStarted() {
        isLoading = true
        lastErrorMessage = nil
    }

    func markLoadFinished() {
        isLoading = false
        isUsingFallback = false
        lastErrorMessage = nil
        hasLoadedInitialPage = true
    }

    func markLoadFailed(_ error: Error) {
        let nsError = error as NSError
        if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
            isLoading = false
            return
        }

        isLoading = false
        lastErrorMessage = userFacingMessage(for: error)
    }

    @discardableResult
    func attach(_ webView: WKWebView) -> Bool {
        self.webView = webView
        if let pendingAuthCallbackURL {
            self.pendingAuthCallbackURL = nil
            openAuthCallback(pendingAuthCallbackURL)
            return true
        }
        return false
    }

    func openAuthCallback(_ url: URL) {
        guard let appURL = localAppURL(for: url) else { return }

        guard let webView else {
            pendingAuthCallbackURL = url
            return
        }

        webView.load(URLRequest(url: appURL))
    }

    private func localAppURL(for callbackURL: URL) -> URL? {
        var components = URLComponents()
        components.scheme = "app"
        components.host = "localhost"
        components.path = "/"
        components.query = callbackURL.query
        components.fragment = callbackURL.fragment
        return components.url
    }

    private func userFacingMessage(for error: Error) -> String {
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost:
                isUsingFallback = true
                return "Peak Lift could not connect. Check your connection and try again."
            case .timedOut:
                return "Peak Lift took too long to respond. Try again in a moment."
            case .fileDoesNotExist:
                return "The bundled app files could not be found. Rebuild the app and try again."
            default:
                break
            }
        }

        return "Peak Lift could not finish loading. Try again."
    }
}
