# ⚡ Java 11 Regex Engine in the Browser  
🌐 **[Launch Demo](https://john5634.github.io/Java11Regex/debug.html?profile=archlinux)**

> A full Java 11 regex engine running *entirely in your browser* — powered by `v86`, `jlink`, and some creative JavaScript orchestration.

---

## ✨ Features

- 💡 **Java 11 Regex Support** (including named capture groups!)
- 📦 **Tiny JRE via `jlink`** – stripped down to essentials to save space
- 🎯 **Structured JSON input**, pretty JSON output
- 📁 **Output saved inside emulated Linux at `/RegexOutput.txt`**
- 🖥️ **Runs on your browser** – No backend needed, no installs, 100% client-side
- 🔍 **Terminal viewable with `showContent()`**, hide it again with `hideContent()`
- 🧠 **Await/Promise-based system** – for better or worse 😅

---

## 🌍 How It Works

### 🧱 Setup Behind the Scenes

- We use [`jlink`](https://docs.oracle.com/en/java/javase/11/tools/jlink.html) to build a **custom Java runtime** with only the required modules for regex and base64 decoding.
- The entire JRE is packed into a tarball named `minJava.tar` and automatically extracted into `/minimal-java` at runtime.
- A custom `RegexJSON.class` file is placed into `/files` and loaded from inside the virtual machine when started.

🎛️ **You can swap in your own class file or JRE:**

- 📜 Replace `/files/RegexJSON.class` with any custom compiled Java class
- 🧩 Replace `/files/minJava.tar` with another JDK 11+ build, as long as it unpacks into `/minimal-java`

---

## 🧪 Try It Live

### 🟢 Demo URL  
👉 https://john5634.github.io/Java11Regex/debug.html?profile=archlinux

✅ Open the browser, wait ~30 seconds (watch the **Network tab** if you're curious):
- Kernel, BusyBox tools, JRE, and Java class are streamed into the emulator
- Terminal will eventually print:
  
```bash
Java 11.0.27-internal regex ready
