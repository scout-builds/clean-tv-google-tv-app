package app.cleantv.tv

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

// Leanback shell: loads the bundled TV interface (assets/www) full-screen.
// Kodi is a separate app (org.xbmc.kodi) — this package never touches it.
class MainActivity : Activity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        val s: WebSettings = webView.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        webView.webViewClient = WebViewClient()
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true
        setContentView(webView)
        webView.loadUrl("file:///android_asset/www/index.html")
        webView.requestFocus()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Forward D-pad / media keys into the page's spatial navigation.
        if (event.action == KeyEvent.ACTION_DOWN) {
            val jsKey = when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
                KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
                KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
                KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> "Enter"
                KeyEvent.KEYCODE_BACK -> "Escape"
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "MediaPlayPause"
                else -> null
            }
            if (jsKey != null && event.keyCode != KeyEvent.KEYCODE_BACK) {
                webView.evaluateJavascript(
                    "document.dispatchEvent(new KeyboardEvent('keydown',{key:'" + jsKey + "'}))",
                    null
                )
                if (jsKey == "Enter") return super.dispatchKeyEvent(event)
                return true
            }
            if (event.keyCode == KeyEvent.KEYCODE_BACK) {
                webView.evaluateJavascript(
                    "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))",
                    null
                )
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
