import React from "react";
import { Text, View } from "react-native";
import type { FlightFare } from "../../api/flight.api";
import type { useTaxAndFee } from "../../hook/useTaxAndFee";
import { FEE_LABELS } from "../../utils/taxAndFee";
import { BookingCard, BookingLink, PriceRow } from "./BookingLayout";

export function TaxAndFeeCard({ taxes, fares }: {
  taxes: ReturnType<typeof useTaxAndFee>;
  fares: FlightFare[];
}) {
  return (
    <BookingCard title="Thuế và phí" icon="receipt-outline">
      {taxes.status === "loading" ? (
        <Text accessibilityLiveRegion="polite" className="text-xs text-booking-muted">Đang tải thuế và phí theo hãng bay…</Text>
      ) : taxes.status === "error" ? (
        <View>
          <Text accessibilityLiveRegion="polite" className="text-xs leading-5 text-booking-danger">{taxes.error}</Text>
          <BookingLink onPress={taxes.reload}>Thử lại thuế và phí</BookingLink>
        </View>
      ) : (
        <>
          {taxes.legs.map(leg => {
            const fare = fares.find(item => item.flightId === leg.flightId)!;
            return (
              <View key={leg.flightId} className="mb-3">
                <Text className="mb-1 text-xs font-bold text-booking-ink">{fare.departure.airportCode} → {fare.arrival.airportCode} · {fare.airline.name} · {leg.count} khách</Text>
                {(Object.keys(FEE_LABELS) as (keyof typeof FEE_LABELS)[]).map(field => (
                  <PriceRow key={field} label={`${FEE_LABELS[field]} (×${leg.count})`} value={leg.config[field]! * leg.count} />
                ))}
                <PriceRow label={`VAT ${leg.config.vat_percent}% trên giá vé (×${leg.count})`} value={leg.vatPerPassenger * leg.count} />
              </View>
            );
          })}
          <PriceRow label="Tổng thuế và phí" value={taxes.total!} strong />
          <Text className="mt-2 text-[10px] leading-4 text-booking-muted">Phí tính cho mỗi khách, mỗi chặng, gồm cả trẻ em và em bé. VAT tính trên giá vé, chưa áp dụng cho ghế hoặc dịch vụ bổ sung.</Text>
        </>
      )}
    </BookingCard>
  );
}
