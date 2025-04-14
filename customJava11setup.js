"use strict";
let regexResultData; 
window.ready = false;

//Startup functions to prepare the v86 OS with the files needed to run java Regex:


async function sendFilesToRoot(emulator) {
    const textEncoder = new TextEncoder();

    const files = [
        { path: "/Java11Regex/files/minJava.tar", name: "minJava.tar" },
        { path: "/Java11Regex/files/RegexJSON.class", name: "RegexJSON.class" },
        {
            name: "run.sh",
            isInline: true,
            contents: `#!/bin/sh
echo "📦 Extracting minJava.tar to / ..."
tar -xvf /minJava.tar -C /
cp /RegexJSON.class /minimal-java/bin/
cd /minimal-java/bin/
echo "🚀 Running Java program..."
/minimal-java/bin/java RegexJSON
`
        }
    ];

    for (const file of files) {
        try {
            let data;

            if (file.isInline) {
                data = textEncoder.encode(file.contents);
            } else {
                const response = await fetch(file.path);
                const buffer = await response.arrayBuffer();
                data = new Uint8Array(buffer);
            }

            emulator.fs9p.CreateBinaryFile(file.name, 0, data);
            console.log(`✅ Injected ${file.name} into /`);
        } catch (err) {
            console.error(`❌ Failed to write ${file.name}:`, err);
        }
    }

    // ➕ Automatically run the script after injection
    console.log("🚀 Running /run.sh...");
    const sendCommand = (cmd) => {
        for (let i = 0; i < cmd.length; i++) {
            emulator.serial0_send(cmd[i]);
        }
        emulator.serial0_send("\n");
    };

    // Make it executable and run it
    sendCommand("chmod +x /run.sh && /run.sh");
}






window.captureTerminal = () => {
    const rows = Array.from(document.querySelectorAll(".xterm-rows > div"))
        .map(div => div.textContent.trim())
        .filter(Boolean);

    return rows;
};

function sendTextToTerminal(text) {
    // Get the terminal instance
    const terminal = document.querySelector('.xterm');
    if (!terminal) {
        console.error('Terminal not found');
        return;
    }

    // Send the text
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        // Send each character through the serial0-input bus
        emulator.bus.send('serial0-input', charCode);
    }

    // Send carriage return and newline to simulate enter key press
    //emulator.bus.send('serial0-input', 13); // \r
    emulator.bus.send('serial0-input', 10); // \n
}

/*
// Function to wrap body content in a container div
function wrapBodyContent() {
    // Create container div
    const container = document.createElement('div');
    container.id = 'content-container';
    
    // Move all body children into container
    while (document.body.firstChild) {
        container.appendChild(document.body.firstChild);
    }
    
    // Add container to body
    document.body.appendChild(container);
}
*/

/*
function wrapBodyContent() {
    // Create container div
    const container = document.createElement('div');
    container.id = 'content-container';

    // Find all body children and exclude the last <div>
    const children = Array.from(document.body.children);
    const lastDiv = children.reverse().find(child => child.tagName === "DIV");

    children.reverse().forEach(function(child) {
        if (child !== lastDiv) {
            container.appendChild(child);
        }
    });

    // Append the container to body
    document.body.appendChild(container);
}

*/





function wrapBodyContent() {
    const container = document.createElement('div');
    container.id = 'content-container';

    const children = Array.from(document.body.children);

    children.forEach(function(child) {
        const isExcluded =
            child.tagName === "DIV" &&
            (
                child.id === "regexControls" ||
                child.id === "regexTool" ||
                child.id === "regexConsolePreview"
            );

        if (!isExcluded) {
            container.appendChild(child);
        }
    });

    document.body.appendChild(container);
}






// Function to show the c



function showContent() {
    document.getElementById('content-container').style.display = 'block';
}

// Function to hide the content
function hideContent() {
    document.getElementById('content-container').style.display = 'none';
}

// Function to toggle the content
function toggleContent() {
    const container = document.getElementById('content-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}




//Helper funcitons to interface with v86 emulated OS:

/*
async function RunRegexJava11(inputObj) {
    // Step 1: Send the pattern
    SendRegexPattern(inputObj);

    // Step 2: Wait for the result file to be written
    await RetrieveRegexResult();

    // Step 3: Decode and return the result
    return DecodeRegexResult();
}
*/


// Function to scan terminal rows for the ready signal




function checkTerminalForReadySignal() {
    var terminalLines = window.captureTerminal();
    //console.log(terminalLines);

    var foundReadySignal = false;
    for (var i = 0; i < terminalLines.length; i++) {
        if (terminalLines[i].indexOf("-internal regex ready") !== -1) {
            foundReadySignal = true;
            break;
        }
    }

    if (foundReadySignal) {
        console.log("✅ Found ready signal in terminal");
        window.ready = true;
    }
}





async function RunRegexJava11(inputObj) {
    checkTerminalForReadySignal();
    // ⛔ If not ready, skip entirely
    if (window.ready === false) {
        console.log("⚠️ Regex engine not ready yet, skipping execution");
        return("regex not ready");
    }

    // ✅ Check if it's ready (first time only)

    // 🔁 If still not ready, exit
    if (!window.ready) {
        console.warn("⚠️ Still not ready after check, aborting");
        return;
    }

    // Step 1: Send the pattern
    SendRegexPattern(inputObj);

    // Step 2: Wait for the result file to be written
    await RetrieveRegexResult();

    // Step 3: Decode and return the result
    return DecodeRegexResult();
}




function SendRegexPattern(inputObj) {
    const jsonInput = typeof inputObj === 'string' ? inputObj : JSON.stringify(inputObj, null, 2);
    const base64 = btoa(jsonInput);
    const wrapped = `BASE64SEPARATORSTART${base64}BASE64SEPARATORSEND`;
    sendTextToTerminal(wrapped);
}

async function RetrieveRegexResult() {
    await new Promise((resolve) => {
        const interval = setInterval(() => {
            const rows = captureTerminal();
            if (rows.at(-1)?.includes("Done")) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });

    // Slight delay to ensure file is flushed
    await new Promise(r => setTimeout(r, 500));

    try {
        regexResultData = await emulator.fs9p.read_file("/RegexOutput.txt");
        DecodeRegexResult();  // Calls decoding after global is set
    } catch (e) {
        console.error("Failed to read RegexOutput.txt:", e.message);
    }
}

function DecodeRegexResult() {
    if (!regexResultData || regexResultData.length === 0) {
        console.warn("regexResultData is empty or undefined.");
        return;
    }

    const decoder = new TextDecoder();
    const text = decoder.decode(regexResultData);

    try {
        const parsed = JSON.parse(text);
        console.log("✅ Decoded JSON:", parsed);
	//regexResultData = null;
        return parsed;
    } catch {
        console.warn("⚠️ Failed to parse JSON. Raw text:\n", text);    
        return text;
    }
}
