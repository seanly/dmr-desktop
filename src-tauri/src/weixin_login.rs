use serde::{Deserialize, Serialize};
use std::time::Duration;

const API_BASE_URL: &str = "https://ilinkai.weixin.qq.com";
const BOT_TYPE: &str = "3";
const POLL_INTERVAL: Duration = Duration::from_secs(2);
const MAX_WAIT: Duration = Duration::from_secs(480); // 8 minutes

#[derive(Debug, Serialize, Deserialize)]
pub struct QRCodeResponse {
    pub qrcode: String,
    pub qrcode_img_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatusResponse {
    pub status: String,
    pub bot_token: Option<String>,
    pub ilink_bot_id: Option<String>,
    pub baseurl: Option<String>,
    pub ilink_user_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeixinCredentials {
    pub gateway_base_url: String,
    pub cdn_base_url: String,
    pub token: String,
    pub ilink_bot_id: String,
    pub ilink_user_id: String,
}

pub struct WeixinLogin {
    client: reqwest::Client,
}

impl WeixinLogin {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(40))
                .build()
                .unwrap(),
        }
    }

    /// 获取二维码
    pub async fn get_qrcode(&self) -> Result<QRCodeResponse, String> {
        let url = format!("{}/ilink/bot/get_bot_qrcode?bot_type={}", API_BASE_URL, BOT_TYPE);

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get QR code: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP error: {}", response.status()));
        }

        let qr_response: QRCodeResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse QR response: {}", e))?;

        Ok(qr_response)
    }

    /// 轮询扫码状态
    pub async fn poll_status(&self, qrcode: &str) -> Result<StatusResponse, String> {
        let url = format!("{}/ilink/bot/get_qrcode_status?qrcode={}", API_BASE_URL, qrcode);

        let response = self.client
            .get(&url)
            .header("iLink-App-ClientVersion", "1")
            .send()
            .await
            .map_err(|e| format!("Failed to poll status: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("HTTP error: {}", response.status()));
        }

        let status_response: StatusResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse status response: {}", e))?;

        Ok(status_response)
    }

    /// 完整的登录流程
    pub async fn login(&self) -> Result<WeixinCredentials, String> {
        // 1. 获取二维码
        let qr = self.get_qrcode().await?;
        eprintln!("QR Code URL: {}", qr.qrcode_img_content);

        // 2. 轮询状态
        let start = std::time::Instant::now();
        loop {
            if start.elapsed() > MAX_WAIT {
                return Err("Login timeout".to_string());
            }

            tokio::time::sleep(POLL_INTERVAL).await;

            let status = self.poll_status(&qr.qrcode).await?;
            eprintln!("Status: {}", status.status);

            match status.status.as_str() {
                "wait" | "" => continue,
                "scaned" => {
                    eprintln!("Scanned - confirm on phone...");
                    continue;
                }
                "expired" => {
                    return Err("QR code expired".to_string());
                }
                "confirmed" => {
                    // 登录成功
                    let token = status.bot_token.ok_or("Missing bot_token")?;
                    let baseurl = status.baseurl.ok_or("Missing baseurl")?;
                    let ilink_bot_id = status.ilink_bot_id.ok_or("Missing ilink_bot_id")?;
                    let ilink_user_id = status.ilink_user_id.ok_or("Missing ilink_user_id")?;

                    return Ok(WeixinCredentials {
                        gateway_base_url: baseurl,
                        cdn_base_url: "https://novac2c.cdn.weixin.qq.com/c2c".to_string(),
                        token,
                        ilink_bot_id,
                        ilink_user_id,
                    });
                }
                _ => continue,
            }
        }
    }
}
