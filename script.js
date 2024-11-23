const API_URL = "https://<YOUR-CLOUD-RUN-URL>";

let fetchedData = []; // 스프레드시트 데이터 저장
let promptType = "fitness"; // 기본값은 피트니스 프롬프트

// 프롬프트 타입 변경 감지
document.querySelectorAll("input[name='promptType']").forEach((radio) => {
    radio.addEventListener("change", (e) => {
        promptType = e.target.value;
    });
});

document.getElementById("automationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const spreadsheetUrl = document.getElementById("spreadsheetUrl").value;
    const sheetName = document.getElementById("sheetName").value;

    if (!spreadsheetUrl || !sheetName) {
        logMessage("에러: 모든 필드를 입력하세요.");
        return;
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
        logMessage("에러: 올바른 Google 스프레드시트 URL을 입력하세요.");
        return;
    }

    try {
        logMessage("구글 스프레드시트 데이터 가져오는 중...");
        const response = await fetch(`${API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "fetchSheets",
                spreadsheetId,
                range: sheetName,
            }),
        });

        const data = await response.json();
        fetchedData = data.data;
        logMessage(`총 ${fetchedData.length}개의 데이터를 가져왔습니다.`);
    } catch (error) {
        logMessage(`에러: ${error.message}`);
    }
});

document.getElementById("generatePostButton").addEventListener("click", async () => {
    if (fetchedData.length === 0) {
        logMessage("에러: 먼저 스프레드시트 데이터를 가져오세요.");
        return;
    }

    const [companyName, keyword, description, placeAddress] = fetchedData[0]; // 첫 번째 데이터 사용

    try {
        logMessage(`블로그 포스팅 생성 중... (업체명: ${companyName})`);
        const response = await fetch(`${API_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "generatePost",
                promptType,
                companyName,
                keyword,
                description,
                placeAddress,
            }),
        });

        const data = await response.json();
        document.getElementById("blogPostContainer").innerText = data.data;
        logMessage(`블로그 포스팅 생성 완료! (업체명: ${companyName})`);
    } catch (error) {
        logMessage(`에러: ${error.message}`);
    }
});

function extractSpreadsheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

function logMessage(message) {
    const log = document.getElementById("log");
    log.value += message + "\n";
    log.scrollTop = log.scrollHeight;
}
