# ZEGOCLOUD Android Web Audio Findings — 2026-08-18

The current hook requests `navigator.mediaDevices.getUserMedia({audio:true})` and silently catches failures. Android documentation requires dangerous permissions such as microphone to be requested at runtime, not merely declared in AndroidManifest.xml.

ZEGOCLOUD's Web SDK documentation says remote streams should be played in the `roomStreamUpdate` ADD callback with `startPlayingStream`, and that publishing/playing should happen only after `roomStateChanged` reports LOGINED or RECONNECTED. It also recommends checking `checkSystemRequirements()` for `microphone` and WebRTC support.

ZEGOCLOUD documents Android Chrome WebRTC support, but warns that embedded application WebViews vary by device and recommends compatibility testing. The app currently uses a Web SDK inside a Capacitor WebView, so silent permission failures and autoplay/audio-output restrictions are plausible.

Likely code issues to address:
1. `requestPermissions()` swallows errors and stops the microphone tracks before the actual publish call.
2. There is no visible runtime permission result or Android native permission request.
3. Remote audio is attached to dynamically created HTMLAudioElement elements without an explicit `play()` call or handling of a rejected play promise.
4. `startPublishingStream` is invoked after `LOGINED` only when `isOnSeat` is true; a user not assigned a seat will not publish by design.
5. `checkSystemRequirements()` is not called or surfaced.

Official sources:
- https://www.zegocloud.com/docs/real-time-voice-web/quick-start/implementing-voice-call
- https://www.zegocloud.com/docs/real-time-video-web/introduction/browser-restrictions
- https://developer.android.com/training/permissions/requesting
