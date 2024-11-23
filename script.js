const API_URL ="https://realcoach-post-writer-352283866864.asia-northeast3.run.app";

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

document.getElementById("generateZipButton").addEventListener("click", async () => {
    if (fetchedData.length === 0) {
        logMessage("에러: 먼저 스프레드시트 데이터를 가져오세요.");
        return;
    }

    const zip = new JSZip();

    for (const row of fetchedData) {
        const [companyName, keyword, description, placeAddress] = row;

        for (let i = 1; i <= 3; i++) {
            try {
                logMessage(`블로그 포스팅 생성 중... (업체명: ${companyName}, ${i}/3)`);
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
                const postContent = data.data;

                // ZIP 파일에 추가
                zip.file(`${companyName}_${i}.txt`, postContent);
                logMessage(`원고 생성 완료: ${companyName}_${i}.txt`);
            } catch (error) {
                logMessage(`에러: ${error.message}`);
            }
        }
    }

    // ZIP 파일 생성 및 다운로드
    try {
        logMessage("ZIP 파일 생성 중...");
        const zipBlob = await zip.generateAsync({ type: "blob" });

        logMessage("ZIP 파일 생성 완료! 다운로드 준비 중...");
        const zipUrl = URL.createObjectURL(zipBlob);

        logMessage("파일 다운로드 중...");
        const a = document.createElement("a");
        a.href = zipUrl;
        a.download = "blog_posts.zip";
        a.click();

        URL.revokeObjectURL(zipUrl);
        logMessage("ZIP 파일 다운로드 완료!");
    } catch (error) {
        logMessage(`ZIP 파일 생성 중 에러 발생: ${error.message}`);
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
