import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import QRCode from "react-qr-code";

interface WeixinLoginProps {
  onSuccess: () => void;
  onSkip: () => void;
}

interface QRCodeResponse {
  qrcode: string;
  qrcode_img_content: string;
}

interface StatusResponse {
  status: string;
  bot_token?: string;
  ilink_bot_id?: string;
  baseurl?: string;
  ilink_user_id?: string;
}

interface WeixinCredentials {
  gateway_base_url: string;
  cdn_base_url: string;
  token: string;
  ilink_bot_id: string;
  ilink_user_id: string;
}

export default function WeixinLogin({ onSuccess, onSkip }: WeixinLoginProps) {
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQRCode();
  }, []);

  const getQRCode = async () => {
    try {
      setStatus("loading");
      setError(null);
      const qr = await invoke<QRCodeResponse>("weixin_get_qrcode");
      setQrData(qr);
      setStatus("waiting");
      startPolling(qr.qrcode);
    } catch (err) {
      console.error("Failed to get QR code:", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const startPolling = async (qrcode: string) => {
    const maxAttempts = 240; // 8 minutes / 2 seconds
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const statusResp = await invoke<StatusResponse>("weixin_poll_status", { qrcode });
        console.log("Poll response:", statusResp);

        switch (statusResp.status) {
          case "wait":
          case "":
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;

          case "scaned":
            console.log("Status: scanned");
            setStatus("scanned");
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;

          case "expired":
            console.log("Status: expired");
            setStatus("expired");
            setError("QR code expired. Please try again.");
            return;

          case "confirmed":
            console.log("Status: confirmed, saving credentials...");
            setStatus("confirmed");
            // 保存凭证
            const credentials: WeixinCredentials = {
              gateway_base_url: statusResp.baseurl!,
              cdn_base_url: "https://novac2c.cdn.weixin.qq.com/c2c",
              token: statusResp.bot_token!,
              ilink_bot_id: statusResp.ilink_bot_id!,
              ilink_user_id: statusResp.ilink_user_id!,
            };
            console.log("Credentials:", credentials);
            await invoke("weixin_save_credentials", { credentials });
            console.log("Credentials saved!");
            setStatus("success");
            await new Promise(resolve => setTimeout(resolve, 1000));
            onSuccess();
            return;

          default:
            console.log("Unknown status:", statusResp.status);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error("Poll error:", err);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setError("Login timeout. Please try again.");
    setStatus("error");
  };

  const getStatusMessage = () => {
    switch (status) {
      case "loading":
        return "Loading QR code...";
      case "waiting":
        return "Please scan with WeChat";
      case "scanned":
        return "Scanned! Please confirm on your phone";
      case "confirmed":
        return "Login confirmed!";
      case "success":
        return "Login successful!";
      case "expired":
        return "QR code expired";
      case "error":
        return "Login failed";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">WeChat Login Required</h1>
          <p className="text-muted-foreground">
            WeChat plugin is enabled but not configured
          </p>
        </div>

        {status === "error" ? (
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">Login Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={getQRCode}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 hover:bg-primary/90"
              >
                Retry
              </button>
              <button
                onClick={onSkip}
                className="flex-1 border border-border rounded-lg py-3 hover:bg-muted"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {qrData && status !== "loading" && (
              <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                <QRCode value={qrData.qrcode_img_content} size={256} />
              </div>
            )}

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {status === "loading" || status === "waiting" || status === "scanned" ? (
                  <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                ) : status === "success" ? (
                  <div className="size-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : null}
                <span className="font-medium">{getStatusMessage()}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Open WeChat and scan the QR code
              </p>
            </div>

            <button
              onClick={onSkip}
              className="w-full border border-border rounded-lg py-3 hover:bg-muted"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
