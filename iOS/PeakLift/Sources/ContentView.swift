import SwiftUI

struct ContentView: View {
    @State private var webViewState = WebViewState()
    @State private var isShowingLaunchOverlay = true

    private var shouldShowLaunchOverlay: Bool {
        isShowingLaunchOverlay || (webViewState.isLoading && !webViewState.hasLoadedInitialPage)
    }

    var body: some View {
        ZStack {
            AppBackdrop()

            PeakLiftWebView(state: webViewState)
                .ignoresSafeArea(.container, edges: .bottom)
                .opacity(webViewState.lastErrorMessage == nil ? 1 : 0.18)
                .accessibilityHidden(webViewState.lastErrorMessage != nil)

            if shouldShowLaunchOverlay {
                LaunchOverlay(isLoading: webViewState.isLoading)
                    .transition(.opacity)
            }

            if webViewState.isLoading && webViewState.hasLoadedInitialPage {
                LoadingStatusPill()
                    .frame(maxHeight: .infinity, alignment: .top)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            if webViewState.isUsingFallback && webViewState.lastErrorMessage == nil {
                OfflineStatusPill()
                    .frame(maxHeight: .infinity, alignment: .top)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }

            if let message = webViewState.lastErrorMessage {
                ConnectionIssueView(message: message) {
                    webViewState.reload()
                } goHome: {
                    webViewState.loadHome()
                }
                .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
        }
        .background(Color.black)
        .safeAreaInset(edge: .top) {
            TopStatusBar(
                isLoading: webViewState.isLoading,
                hasError: webViewState.lastErrorMessage != nil
            ) {
                webViewState.reload()
            }
        }
        .animation(.snappy(duration: 0.28), value: webViewState.isLoading)
        .animation(.snappy(duration: 0.28), value: webViewState.isUsingFallback)
        .animation(.snappy(duration: 0.28), value: webViewState.lastErrorMessage)
        .animation(.easeOut(duration: 0.24), value: shouldShowLaunchOverlay)
        .onChange(of: webViewState.hasLoadedInitialPage) { _, hasLoaded in
            guard hasLoaded else { return }
            hideLaunchOverlay()
        }
        .task {
            try? await Task.sleep(for: .seconds(1.1))
            if webViewState.hasLoadedInitialPage {
                hideLaunchOverlay()
            }
        }
        .onOpenURL { url in
            webViewState.openAuthCallback(url)
        }
    }

    private func hideLaunchOverlay() {
        withAnimation(.easeOut(duration: 0.24)) {
            isShowingLaunchOverlay = false
        }
    }
}

private struct TopStatusBar: View {
    let isLoading: Bool
    let hasError: Bool
    let reload: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            BrandLockup(compact: true)

            Spacer()

            if isLoading {
                ProgressView()
                    .controlSize(.small)
                    .tint(.white)
                    .accessibilityLabel("Loading")
            }

            Button(action: reload) {
                Image(systemName: hasError ? "arrow.clockwise.circle.fill" : "arrow.clockwise")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(.white.opacity(hasError ? 0.18 : 0.08), in: Circle())
            }
            .accessibilityLabel(hasError ? "Try loading Peak Lift again" : "Reload Peak Lift")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.black.opacity(0.72))
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(.white.opacity(0.08))
                .frame(height: 1)
        }
    }
}

private struct LaunchOverlay: View {
    let isLoading: Bool

    var body: some View {
        VStack(spacing: 22) {
            BrandMark(size: 78)

            VStack(spacing: 8) {
                Text("Peak Lift")
                    .font(.system(size: 34, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .accessibilityAddTraits(.isHeader)

                Text("Training, nutrition, and daily progress in one place.")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white.opacity(0.72))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 28)
            }

            HStack(spacing: 10) {
                ProgressView()
                    .controlSize(.small)
                    .tint(.white)

                Text(isLoading ? "Opening your workspace" : "Preparing your workspace")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.82))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.white.opacity(0.10), in: Capsule())
            .overlay {
                Capsule()
                    .stroke(.white.opacity(0.12), lineWidth: 1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppBackdrop())
    }
}

private struct ConnectionIssueView: View {
    let message: String
    let retry: () -> Void
    let goHome: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            BrandMark(size: 58)

            VStack(spacing: 8) {
                Text("Connection Issue")
                    .font(.title3.weight(.heavy))
                    .foregroundStyle(.white)
                    .accessibilityAddTraits(.isHeader)

                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.72))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            VStack(spacing: 10) {
                Button(action: retry) {
                    Label("Try Again", systemImage: "arrow.clockwise")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                }
                .buttonStyle(.borderedProminent)
                .tint(.white)
                .foregroundStyle(.black)

                Button(action: goHome) {
                    Label("Back to Start", systemImage: "house")
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.white)
                .background(.white.opacity(0.10), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(24)
        .frame(maxWidth: 360)
        .background(.black.opacity(0.68), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(.white.opacity(0.14), lineWidth: 1)
        }
        .padding(24)
    }
}

private struct LoadingStatusPill: View {
    var body: some View {
        HStack(spacing: 8) {
            ProgressView()
                .controlSize(.small)
                .tint(.white)

            Text("Syncing")
                .font(.caption.weight(.bold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.black.opacity(0.70), in: Capsule())
        .overlay {
            Capsule()
                .stroke(.white.opacity(0.12), lineWidth: 1)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct OfflineStatusPill: View {
    var body: some View {
        Label("Offline Mode", systemImage: "wifi.slash")
            .font(.caption.weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.black.opacity(0.70), in: Capsule())
            .overlay {
                Capsule()
                    .stroke(.white.opacity(0.12), lineWidth: 1)
            }
            .accessibilityLabel("Offline mode")
    }
}

private struct BrandLockup: View {
    let compact: Bool

    var body: some View {
        HStack(spacing: compact ? 8 : 12) {
            BrandMark(size: compact ? 32 : 44)

            VStack(alignment: .leading, spacing: 1) {
                Text("Peak Lift")
                    .font(.system(size: compact ? 16 : 20, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)

                if !compact {
                    Text("Coach workspace")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.62))
                }
            }
        }
        .accessibilityElement(children: .combine)
    }
}

private struct BrandMark: View {
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.78, green: 1.00, blue: 0.31),
                            Color(red: 0.24, green: 0.77, blue: 0.93)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: size * 0.45, weight: .bold))
                .foregroundStyle(.black.opacity(0.82))
        }
        .frame(width: size, height: size)
        .shadow(color: Color(red: 0.24, green: 0.77, blue: 0.93).opacity(0.28), radius: size * 0.16, y: size * 0.08)
        .accessibilityHidden(true)
    }
}

private struct AppBackdrop: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 0.02, green: 0.04, blue: 0.05),
                Color(red: 0.06, green: 0.09, blue: 0.09),
                Color(red: 0.00, green: 0.00, blue: 0.00)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}

#Preview {
    ContentView()
}
