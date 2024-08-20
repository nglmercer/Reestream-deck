import os from "os";
import QRCode from "qrcode";

const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "IP address not found";
};
const localIP = getLocalIPAddress();
const urlToQR = `https://${localIP}:${Port}`;

QRCode.toDataURL(urlToQR, (err, qrCode) => {
  if (err) {
    console.error("Error generating QR code:", err);
    return;
  }

  mainWindow.webContents.on("dom-ready", () => {
    console.log("dom-ready");
    mainWindow.webContents.executeJavaScript(`
      (${showQRModal.toString()})("${qrCode}","${urlToQR}");
    `);
  });

  // Si necesitas enviar este código QR a otro lugar, puedes usar la variable 'qrCode'
  // que contiene la representación base64 de la imagen del QR.
});
export { getLocalIPAddress };
