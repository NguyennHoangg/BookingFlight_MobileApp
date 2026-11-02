import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { BookingRecord } from "../api/booking.api";
import { bookingShareText, bookingTicketHtml } from "./payment";

export async function shareBooking(booking: BookingRecord): Promise<"shared" | "copied" | "dismissed"> {
  const message = bookingShareText(booking);
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: `SkyJourney · ${booking.pnrCode}`, text: message }); return "shared"; }
      catch (cause) { if (cause instanceof Error && cause.name === "AbortError") return "dismissed"; throw cause; }
    }
    if (!(await Clipboard.setStringAsync(message))) throw new Error("Không sao chép được hành trình. Vui lòng thử lại.");
    return "copied";
  }
  const result = await Share.share({ title: `SkyJourney · ${booking.pnrCode}`, message });
  return result.action === Share.dismissedAction ? "dismissed" : "shared";
}
export async function exportBookingPdf(booking: BookingRecord) {
  const html = bookingTicketHtml(booking);
  if (Platform.OS === "web") {
    // Expo Print on web ignores its html option and prints the current app page.
    // Give the generated ticket its own document so long itineraries print in full.
    const printWindow = window.open("", "_blank", "width=850,height=1000");
    if (!printWindow) throw new Error("Vui lòng cho phép cửa sổ in để lưu vé PDF.");
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    await printWindow.document.fonts.ready;
    if (printWindow.closed) return;
    printWindow.focus();
    printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
    printWindow.print();
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: `Vé điện tử ${booking.pnrCode}` });
  } else await Print.printAsync({ html });
}
